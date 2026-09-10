from typing import Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, decode_access_token
from app.models.user import User
from app.models.admin import Admin
from app.schemas.auth import (
    UserSignupRequest,
    UserLoginRequest,
    UserResponse,
    UserUpdateRequest,
    TokenResponse,
)
from app.services.auth_service import AuthService

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
    entity = await AuthService.register_user(db, payload)
    portal = "admin" if isinstance(entity, Admin) else "user"
    access_token = create_access_token(
        subject=entity.id,
        extra_claims={"email": entity.email, "role": entity.role, "portal": portal},
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
    """Authenticate email & password. Sets status to 'active', returns JWT token and profile."""
    entity = await AuthService.authenticate_user(
        db, payload.email, payload.password, payload.portal or "user"
    )
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    portal = "admin" if isinstance(entity, Admin) else "user"
    access_token = create_access_token(
        subject=entity.id,
        extra_claims={"email": entity.email, "role": entity.role, "portal": portal},
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
