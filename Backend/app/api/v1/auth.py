import re
import uuid
import secrets
from typing import Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, decode_access_token, verify_password, hash_password
from app.core.datetime_utils import get_current_time
from app.models.user import User
from app.models.admin import Admin
from app.models.team_head import TeamHead
from app.schemas.auth import (
    UserSignupRequest,
    UserLoginRequest,
    GoogleLoginRequest,
    UserResponse,
    UserUpdateRequest,
    TokenResponse,
    GenerateOtpRequest,
    VerifyOtpRequest,
    OtpResponse,
)
from app.services.auth_service import AuthService
from app.services.otp_service import OtpService
from app.services.google_auth_service import GoogleAuthService

router = APIRouter()


# Dependency to get current authenticated user/admin/team_head from Bearer token
async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Union[User, Admin, TeamHead]:
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

    user_id = str(payload["sub"])

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

    # 3. Search in team_head table (Supervisors)
    try:
        raw_id = user_id.replace("TH-", "")
        if raw_id.isdigit():
            res_th = await db.execute(select(TeamHead).where(TeamHead.id == int(raw_id)))
            th = res_th.scalars().first()
            if th:
                return th
    except Exception:
        pass

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
        select(User).where(User.email == "[EMAIL_ADDRESS]")
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
        name="Shuvajit Saha",
        email="[EMAIL_ADDRESS]",
        hashed_password="dummy",
        role="Volunteer",
        clearance="Volunteer ID",
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
    canon_portal = AuthService.get_canonical_portal_category(portal)
    if canon_portal in ["ADMIN", "SUPERVISOR"]:
        email_clean = payload.email.lower().strip()
        phone_clean = (payload.phone or "").strip() or None
        if not OtpService.consume_otp(otp=payload.otp, email=email_clean, phone=phone_clean, purpose="signup"):
            portal_label = "Supervisor" if canon_portal == "SUPERVISOR" else "Admin"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{portal_label} registration requires verified 2-factor OTP. Please verify the code sent to your phone.",
            )

    entity = await AuthService.register_user(db, payload)
    entity_role = (getattr(entity, "role", "") or "").lower()
    if isinstance(entity, TeamHead) or entity_role in ["team_head", "supervisor"]:
        entity_portal = "supervisor"
        role_claim = "Supervisor"
    elif isinstance(entity, Admin):
        entity_portal = "admin"
        role_claim = entity.role
    else:
        entity_portal = "user"
        role_claim = entity.role

    access_token = create_access_token(
        subject=str(entity.id),
        extra_claims={"email": entity.email, "role": role_claim, "portal": entity_portal},
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
                role=role_claim,
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
    """Authenticate email & password with role portal validation. If portal is admin or supervisor, requires OTP verification."""
    portal = (payload.portal or "user").lower().strip()
    canon_portal = AuthService.get_canonical_portal_category(portal)

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

    # 2. If OTP is required or provided (admin/supervisor portal, or user with OTP), verify & consume OTP
    if canon_portal in ["ADMIN", "SUPERVISOR"] or payload.otp:
        admin_email = getattr(entity, "email", payload.email)
        admin_phone = getattr(entity, "phone", getattr(entity, "ph_no", None)) or payload.email
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

    entity_role = (getattr(entity, "role", "") or "").lower()
    if isinstance(entity, TeamHead) or entity_role in ["team_head", "supervisor"]:
        entity_portal = "supervisor"
        role_claim = "Supervisor"
    elif isinstance(entity, Admin):
        entity_portal = "admin"
        role_claim = entity.role
    else:
        entity_portal = "user"
        role_claim = entity.role

    access_token = create_access_token(
        subject=str(entity.id),
        extra_claims={"email": entity.email, "role": role_claim, "portal": entity_portal},
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
    "/google",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate or register user via verified Google SSO credential",
)
async def google_login(
    payload: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Real Google SSO Authentication for NIVARA:
    1. Cryptographically verifies Google ID token credential with Google's public key infrastructure.
    2. Validates audience matches configured GOOGLE_CLIENT_ID and email is verified.
    3. Checks SQLite database (admin and users tables) for an account matching the verified email.
    4. Existing accounts:
       - Preserves existing role (Official/Admin or Citizen) and clearance.
       - Links google_id and sets status to active.
    5. New accounts:
       - Safely registers a Citizen in 'users' table (role='User', clearance='Citizen Access').
       - Prevents arbitrary Google accounts from gaining administrative privileges.
       - Generates a high-entropy password hash so empty password logins are impossible.
    6. Generates existing NIVARA signed JWT session token.
    7. Dispatches security notifications and returns TokenResponse.
    """
    google_user = GoogleAuthService.verify_credential(payload.credential)
    verified_email = google_user["email"].lower().strip()
    google_id = google_user["google_id"]
    google_name = google_user.get("name") or verified_email.split("@")[0]

    # 1. Search Admin table for existing official account
    res_admin = await db.execute(select(Admin).where(Admin.email == verified_email))
    entity: Union[User, Admin, None] = res_admin.scalars().first()

    # 2. If not found in Admin table, search Users table for existing citizen
    if not entity:
        res_user = await db.execute(select(User).where(User.email == verified_email))
        entity = res_user.scalars().first()

    is_new_user = False
    if entity:
        # Existing account: PRESERVE EXACT ROLE & PERMISSIONS (Admin or Citizen)
        entity.status = "active"
        if hasattr(entity, "google_id") and not entity.google_id:
            entity.google_id = google_id
        if hasattr(entity, "auth_provider") and not entity.auth_provider:
            entity.auth_provider = "google"
        await db.commit()
        await db.refresh(entity)
    else:
        # New account: Register safe default Citizen ONLY (Never Admin)
        is_new_user = True
        user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
        random_pw = secrets.token_urlsafe(32)
        entity = User(
            id=user_id,
            name=google_name,
            email=verified_email,
            hashed_password=hash_password(random_pw),
            role="User",
            clearance="Citizen Access",
            status="active",
            created_at=get_current_time(),
            location="Kolkata, West Bengal",
            auth_provider="google",
            google_id=google_id,
        )
        db.add(entity)
        await db.commit()
        await db.refresh(entity)

    entity_portal = "admin" if isinstance(entity, Admin) else "user"
    access_token = create_access_token(
        subject=entity.id,
        extra_claims={"email": entity.email, "role": entity.role, "portal": entity_portal},
    )

    from app.services.email_service import EmailService

    # Dispatch Welcome Email for newly registered accounts
    if is_new_user or not getattr(entity, "welcome_email_sent", False):
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

    # Dispatch Login Security Notification Email
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
    current_user: Union[User, Admin, TeamHead] = Depends(get_current_user),
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
async def get_my_profile(current_user: Union[User, Admin, TeamHead] = Depends(get_current_user)):
    """Protected endpoint: Reads token from Authorization header and returns profile."""
    return AuthService.to_user_response(current_user)


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update profile fields of currently logged-in user or admin",
)
async def update_my_profile(
    payload: UserUpdateRequest,
    current_user: Union[User, Admin, TeamHead] = Depends(get_current_user),
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
