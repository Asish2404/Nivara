from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, decode_access_token
from app.models.user import User
from app.schemas.auth import (
    UserSignupRequest,
    UserLoginRequest,
    UserResponse,
    UserUpdateRequest,
    TokenResponse,
)
from app.services.auth_service import AuthService

router = APIRouter()


# Dependency to get current authenticated user from Bearer token
async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
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
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or inactive.",
        )

    return user


# Dependency to get current user, falling back to registered citizen persona if unauthenticated
async def get_current_user_or_default(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Returns the authenticated user if token is valid, or falls back to the default citizen persona."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalars().first()
            if user and user.is_active:
                return user

    # Fallback 1: Default citizen persona
    result = await db.execute(
        select(User).where(User.email == "anirban.chatterjee@kolkata.org")
    )
    default_citizen = result.scalars().first()
    if default_citizen and default_citizen.is_active:
        return default_citizen

    # Fallback 2: Any active user in DB
    result = await db.execute(select(User).where(User.is_active == True))
    first_user = result.scalars().first()
    if first_user:
        return first_user

    # Fallback 3: Create default citizen if none exists
    new_citizen = User(
        id="USR-CIT-003",
        email="anirban.chatterjee@kolkata.org",
        hashed_password="dummy",
        full_name="Anirban Chatterjee",
        role="Community Lead Reporter",
        department="Kolkata Citizen Water Watch",
        badge_id="CITIZEN-KOL-9182",
        clearance="Verified Citizen ID",
        avatar="🌊",
        is_active=True,
    )
    db.add(new_citizen)
    await db.commit()
    await db.refresh(new_citizen)
    return new_citizen


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new citizen or officer account",
)
async def signup(
    payload: UserSignupRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user, hashes password, saves to DB, and returns a signed JWT."""
    user = await AuthService.register_user(db, payload)
    access_token = create_access_token(
        subject=user.id,
        extra_claims={"email": user.email, "role": user.role},
    )
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=AuthService.to_user_response(user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and obtain JWT token",
)
async def login(
    payload: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate email & password. Returns JWT token and municipal persona."""
    user = await AuthService.authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    access_token = create_access_token(
        subject=user.id,
        extra_claims={"email": user.email, "role": user.role},
    )
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=AuthService.to_user_response(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get profile of currently logged-in user",
)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Protected endpoint: Reads token from Authorization header and returns user profile."""
    return AuthService.to_user_response(current_user)


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update profile fields of the currently logged-in user",
)
async def update_my_profile(
    payload: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update only the provided profile fields (full name, department, phone, location, bio, avatar)."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip() or current_user.full_name
    if payload.department is not None:
        current_user.department = payload.department.strip() or current_user.department
    if payload.phone is not None:
        current_user.phone = payload.phone.strip() or None
    if payload.location is not None:
        current_user.location = payload.location.strip() or None
    if payload.bio is not None:
        current_user.bio = payload.bio.strip() or None
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url.strip() or None

    await db.commit()
    await db.refresh(current_user)
    return AuthService.to_user_response(current_user)
