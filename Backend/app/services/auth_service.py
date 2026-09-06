import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from ..models.user import User
from ..schemas.auth import UserSignupRequest, UserResponse
from ..core.security import hash_password, verify_password


# Default official KMC personas pre-seeded for demoing
DEFAULT_PERSONAS = [
    {
        "id": "USR-KMC-001",
        "email": "officer.roy@kolkata-water.gov.in",
        "password": "Kolkata@Water2026",
        "full_name": "Officer Devjyoti Sen",
        "role": "Chief Drainage Officer",
        "department": "KMC Sewerage & Drainage Directorate",
        "badge_id": "KMC-DIR-7049",
        "clearance": "Level 4 // Command Clearance",
        "avatar": "👨‍✈️",
    },
    {
        "id": "USR-ENG-002",
        "email": "priyanka.mukherjee@kwi.gov.in",
        "password": "Telemetry@2026",
        "full_name": "Priyanka Mukherjee",
        "role": "Lead Sensor Systems Engineer",
        "department": "KWI Real-time Telemetry Wing",
        "badge_id": "ENG-TELEMETRY-284",
        "clearance": "Level 3 // Systems Ops",
        "avatar": "👩‍💻",
    },
    {
        "id": "USR-CIT-003",
        "email": "anirban.chatterjee@kolkata.org",
        "password": "Citizen@2026",
        "full_name": "Anirban Chatterjee",
        "role": "Community Lead Reporter",
        "department": "Kolkata Citizen Water Watch",
        "badge_id": "CITIZEN-KOL-9182",
        "clearance": "Verified Citizen ID",
        "avatar": "🌊",
    },
]


class AuthService:

    @staticmethod
    def get_initials(name: str) -> str:
        """Compute 2-letter initials from name, e.g. 'Devjyoti Sen' -> 'DS'."""
        parts = name.strip().split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[-1][0]).upper()
        elif parts:
            return parts[0][:2].upper()
        return "KW"

    @classmethod
    def to_user_response(cls, user: User) -> UserResponse:
        """Convert a DB User model into a frontend-compatible UserResponse schema."""
        initials = cls.get_initials(user.full_name)
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.full_name,
            full_name=user.full_name,
            role=user.role,
            department=user.department,
            badgeId=user.badge_id,
            badge_id=user.badge_id,
            clearance=user.clearance,
            avatar=user.avatar,
            initials=initials,
            wardAccess="All Boroughs (I - XVI)",
            ward_access="All Boroughs (I - XVI)",
            created_at=user.created_at,
        )

    @classmethod
    async def seed_default_users(cls, db: AsyncSession) -> None:
        """Seed the 3 official demo personas if users table is empty."""
        result = await db.execute(select(User))
        if not result.scalars().first():
            for persona in DEFAULT_PERSONAS:
                db_user = User(
                    id=persona["id"],
                    email=persona["email"].lower().strip(),
                    hashed_password=hash_password(persona["password"]),
                    full_name=persona["full_name"],
                    role=persona["role"],
                    department=persona["department"],
                    badge_id=persona["badge_id"],
                    clearance=persona["clearance"],
                    avatar=persona["avatar"],
                    is_active=True,
                )
                db.add(db_user)
            await db.commit()

    @classmethod
    async def register_user(cls, db: AsyncSession, data: UserSignupRequest) -> User:
        """Register a new user account with hashed password."""
        email_clean = data.email.lower().strip()

        # Check if email is already taken
        result = await db.execute(select(User).where(User.email == email_clean))
        existing_user = result.scalars().first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            )

        user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
        full_name = data.fullName or "Officer"

        new_user = User(
            id=user_id,
            email=email_clean,
            hashed_password=hash_password(data.password),
            full_name=full_name,
            role=data.role or "Command Officer",
            department=data.department or "KMC Sewerage & Drainage Directorate",
            badge_id=data.badgeId or f"KMC-{uuid.uuid4().hex[:4].upper()}",
            clearance=data.clearance or "Level 4 // Command Clearance",
            avatar=data.avatar or "👨‍✈️",
            is_active=True,
            created_at=datetime.utcnow(),
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user

    @classmethod
    async def authenticate_user(
        cls, db: AsyncSession, email: str, password: str
    ) -> Optional[User]:
        """Authenticate user credentials. Returns User if valid, None if invalid."""
        email_clean = email.lower().strip()
        result = await db.execute(select(User).where(User.email == email_clean))
        user = result.scalars().first()

        if not user or not user.is_active:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        return user
