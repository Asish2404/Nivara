import re
from typing import Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, decode_access_token, verify_password
from app.core.datetime_utils import get_current_time
from app.models.user import User
from app.models.admin import Admin
from app.schemas.auth import (
    UserSignupRequest,
    UserLoginRequest,
    UserResponse,
    UserUpdateRequest,
    TokenResponse,
    GenerateOtpRequest,
    VerifyOtpRequest,
    OtpResponse,
)
from app.services.auth_service import AuthService
from app.services.otp_service import OtpService

router = APIRouter()


# Dependency to get current authenticated user/admin from Bearer token
async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Union[User, Admin]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Must be 'Bearer <token>'.",
        )

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        )

    user_id = payload["sub"]

    # 1. Search in users table
    res_user = await db.execute(select(User).where(User.id == user_id))
    user = res_user.scalars().first()
    if user:
        return user

    # 2. Search in admin table
    res_admin = await db.execute(select(Admin).where(Admin.id == user_id))
    admin = res_admin.scalars().first()
    if admin:
        return admin

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="User account not found or inactive.",
    )


# Dependency falling back to registered default persona if unauthenticated
async def get_current_user_or_default(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Union[User, Admin]:
    """Returns the authenticated user/admin if token is valid, or falls back to default persona."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]
            res_user = await db.execute(select(User).where(User.id == user_id))
            user = res_user.scalars().first()
            if user:
                return user

            res_admin = await db.execute(select(Admin).where(Admin.id == user_id))
            admin = res_admin.scalars().first()
            if admin:
                return admin

    # Fallback: Default citizen persona
    result = await db.execute(
        select(User).where(User.email == "anirban.chatterjee@kolkata.org")
    )
    default_citizen = result.scalars().first()
    if default_citizen:
        return default_citizen

    # Fallback: Any active user in DB
    result = await db.execute(select(User))
    first_user = result.scalars().first()
    if first_user:
        return first_user

    # Fallback: Create default citizen
    new_citizen = User(
        id="USR-CIT-003",
        name="Anirban Chatterjee",
        email="anirban.chatterjee@kolkata.org",
        hashed_password="dummy",
        role="Community Lead Reporter",
        clearance="Verified Citizen ID",
        status="active",
    )
    db.add(new_citizen)
    await db.commit()
    await db.refresh(new_citizen)
    return new_citizen


@router.post(
    "/admin/generate-otp",
    response_model=OtpResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate 2FA OTP for administrative authentication",
)
async def generate_admin_otp(
    payload: GenerateOtpRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate and dispatch 6-digit OTP to mobile phone / email for admin login or signup."""
    email_raw = (payload.email or "").strip() or None
    phone_raw = (payload.phone or "").strip() or None
    purpose = (payload.purpose or "login").lower().strip()

    # If email_raw is formatted like a phone number (e.g. 6289143592) and no phone was supplied, treat as phone
    if email_raw and not phone_raw and "@" not in email_raw:
        phone_raw = email_raw
        email_raw = None

    email_clean = email_raw.lower() if email_raw else None
    phone_clean = phone_raw

    if not email_clean and not phone_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either a phone number or email address is required to dispatch security OTP.",
        )

    # Normalize canonical purpose
    canon_purpose = "signup" if purpose in ["signup", "create", "register"] else "login"

    name_raw = (payload.name or "").strip() or None
    target_name = name_raw
    target_portal = (payload.portal or "admin").lower().strip()

    target_phone = phone_clean
    if canon_purpose == "login":
        # 1. Look up account across DB by email or phone
        account = await AuthService.find_account_by_identifier(db, email_clean or phone_clean)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with these credentials. Please check your phone or email.",
            )

        # 2. Strict Role-Based Portal Validation
        is_valid_role, role_error = AuthService.validate_role_for_portal(account.role, target_portal)
        if not is_valid_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=role_error,
            )

        # 3. Optional password verification if provided
        if payload.password and not verify_password(payload.password, account.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password. Please check your credentials.",
            )

        target_phone = phone_clean or getattr(account, "phone", None)
        email_clean = email_clean or getattr(account, "email", None)
        target_name = getattr(account, "name", None) or name_raw

    elif canon_purpose == "signup":
        # Check if already registered across both tables
        existing = await AuthService.find_account_by_identifier(db, email_clean or phone_clean)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email or phone number already exists. Please sign in instead.",
            )

    # Dispatch OTP and trigger gateways (Free Email + SMS)
    otp = OtpService.generate_otp(email=email_clean, phone=target_phone, purpose=canon_purpose)
    if email_clean and "@" in email_clean:
        await OtpService.dispatch_email_otp(to_email=email_clean, otp=otp, purpose=canon_purpose, user_name=target_name)
    if target_phone:
        await OtpService.dispatch_real_sms(phone=target_phone, otp=otp)

    # Format human-friendly message
    if email_clean and "@" in email_clean:
        name_part, domain = email_clean.split("@", 1)
        masked_email = name_part[:2] + ("*" * max(1, len(name_part) - 2)) + f"@{domain}"
        display_msg = f"6-digit security code dispatched to {masked_email}."
    elif target_phone:
        digits = re.sub(r"\D", "", target_phone)
        masked = f"+91 ******{digits[-4:]}" if len(digits) >= 4 else target_phone
        display_msg = f"6-digit security code dispatched to {masked}."
    else:
        display_msg = "6-digit security code dispatched successfully."

    return OtpResponse(
        status="ok",
        message=display_msg,
        phone=target_phone,
        email=email_clean,
        expires_in=OtpService.DEFAULT_EXPIRY_SECONDS,
    )


@router.post(
    "/admin/verify-otp",
    response_model=OtpResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate 2FA OTP for administrative authentication",
)
async def verify_admin_otp(payload: VerifyOtpRequest):
    """Verify 6-digit OTP code before proceeding with administrative login or signup."""
    email_raw = (payload.email or "").strip() or None
    phone_raw = (payload.phone or "").strip() or None
    if email_raw and not phone_raw and "@" not in email_raw:
        phone_raw = email_raw
        email_raw = None

    email_clean = email_raw.lower() if email_raw else None
    phone_clean = phone_raw
    purpose = (payload.purpose or "login").lower().strip()

    is_valid = OtpService.verify_otp(
        otp=payload.otp,
        email=email_clean,
        phone=phone_clean,
        purpose=purpose,
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code. Please check your SMS or request a new code.",
        )

    return OtpResponse(
        status="ok",
        message="Administrative 2FA clearance verified successfully.",
        phone=phone_clean,
        email=email_clean,
        expires_in=OtpService.DEFAULT_EXPIRY_SECONDS,
    )


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new citizen or admin account",
)
async def signup(
    payload: UserSignupRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new account into 'users' or 'admin' table, and returns a signed JWT."""
    portal = (payload.portal or "user").lower().strip()
    if AuthService.get_canonical_portal_category(portal) == "ADMIN":
        email_clean = payload.email.lower().strip()
        phone_clean = (payload.phone or "").strip() or None
        if not OtpService.consume_otp(otp=payload.otp, email=email_clean, phone=phone_clean, purpose="signup"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin registration requires verified 2-factor OTP. Please verify the code sent to your phone.",
            )

    entity = await AuthService.register_user(db, payload)
    entity_portal = "admin" if isinstance(entity, Admin) else "user"
    access_token = create_access_token(
        subject=entity.id,
        extra_claims={"email": entity.email, "role": entity.role, "portal": entity_portal},
    )

    # Trigger Welcome Email ONLY ONCE upon first successful account creation & verification
    if not getattr(entity, "welcome_email_sent", False):
        entity.welcome_email_sent = True
        await db.commit()
        await db.refresh(entity)
        from app.services.email_service import EmailService
        EmailService.dispatch_background(
            EmailService.send_welcome_email(
                to_email=entity.email,
                user_name=entity.name,
                role=entity.role,
            )
        )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=AuthService.to_user_response(entity),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user or admin and obtain JWT token",
)
async def login(
    payload: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate email & password with role portal validation. If portal is admin, requires OTP verification."""
    portal = (payload.portal or "user").lower().strip()

    # 1. Authenticate user credentials with strict role-based portal validation
    entity, auth_error = await AuthService.authenticate_user(
        db, payload.email, payload.password, payload.portal or "user"
    )
    if not entity:
        status_code = status.HTTP_403_FORBIDDEN if "portal" in auth_error.lower() else status.HTTP_401_UNAUTHORIZED
        raise HTTPException(
            status_code=status_code,
            detail=auth_error,
        )

    # 2. If OTP is required or provided (admin portal, or user with OTP), verify & consume OTP
    if AuthService.get_canonical_portal_category(portal) == "ADMIN" or payload.otp:
        admin_email = getattr(entity, "email", payload.email)
        admin_phone = getattr(entity, "phone", None) or payload.email
        if not OtpService.consume_otp(
            otp=payload.otp,
            email=admin_email,
            phone=admin_phone,
            purpose="login",
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security clearance requires verified 2-factor OTP. Please verify the code sent to your email or mobile.",
            )

    entity_portal = "admin" if isinstance(entity, Admin) else "user"
    access_token = create_access_token(
        subject=entity.id,
        extra_claims={"email": entity.email, "role": entity.role, "portal": entity_portal},
    )

    from app.services.email_service import EmailService

    # 3. If Welcome Email was never sent (first time access), send it once
    if not getattr(entity, "welcome_email_sent", False):
        entity.welcome_email_sent = True
        await db.commit()
        await db.refresh(entity)
        EmailService.dispatch_background(
            EmailService.send_welcome_email(
                to_email=entity.email,
                user_name=entity.name,
                role=entity.role,
            )
        )

    # 4. Send Login Security Notification Email (non-blocking)
    EmailService.dispatch_background(
        EmailService.send_login_notification_email(
            to_email=entity.email,
            user_name=entity.name,
            role=entity.role,
            login_time=get_current_time(),
        )
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=AuthService.to_user_response(entity),
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout user and set status to not active",
)
async def logout(
    current_user: Union[User, Admin] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Marks user/admin status as 'not active' upon logout."""
    await AuthService.logout_user(db, current_user.id)
    return {"status": "ok", "message": "Successfully logged out."}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get profile of currently logged-in user or admin",
)
async def get_my_profile(current_user: Union[User, Admin] = Depends(get_current_user)):
    """Protected endpoint: Reads token from Authorization header and returns profile."""
    return AuthService.to_user_response(current_user)


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update profile fields of currently logged-in user or admin",
)
async def update_my_profile(
    payload: UserUpdateRequest,
    current_user: Union[User, Admin] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update profile fields (name, department, phone, location)."""
    if payload.full_name is not None:
        current_user.name = payload.full_name.strip() or current_user.name
    if payload.department is not None and hasattr(current_user, "department"):
        current_user.department = payload.department.strip() or current_user.department
    if payload.phone is not None:
        current_user.phone = payload.phone.strip() or None
    if payload.location is not None:
        current_user.location = payload.location.strip() or None

    await db.commit()
    await db.refresh(current_user)
    return AuthService.to_user_response(current_user)
