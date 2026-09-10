import uuid
from datetime import datetime
from typing import Optional, Union, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user import User
from app.models.admin import Admin
from app.schemas.auth import UserSignupRequest, UserResponse
from app.core.security import hash_password, verify_password
from app.core.datetime_utils import get_current_time, ensure_kolkata_tz


# Default official personas pre-seeded for demoing
DEFAULT_PERSONAS = [
    {
        "id": "USR-KMC-001",
        "portal": "admin",
        "email": "officer.roy@kolkata-water.gov.in",
        "password": "Kolkata@Water2026",
        "name": "Officer Devjyoti Sen",
        "role": "Chief Drainage Officer",
        "department": "KMC Sewerage & Drainage Directorate",
        "badge_id": "KMC-DIR-7049",
        "clearance": "Level 4 // Command Clearance",
        "phone": "+91 98300 12345",
        "location": "Salt Lake, Kolkata",
    },
    {
        "id": "USR-ENG-002",
        "portal": "admin",
        "email": "priyanka.mukherjee@kwi.gov.in",
        "password": "Telemetry@2026",
        "name": "Priyanka Mukherjee",
        "role": "Lead Sensor Systems Engineer",
        "department": "KWI Real-time Telemetry Wing",
        "badge_id": "ENG-TELEMETRY-284",
        "clearance": "Level 3 // Systems Ops",
        "phone": "+91 98300 67890",
        "location": "Alipore, Kolkata",
    },
    {
        "id": "USR-CIT-003",
        "portal": "user",
        "email": "anirban.chatterjee@kolkata.org",
        "password": "Citizen@2026",
        "name": "Anirban Chatterjee",
        "role": "Community Lead Reporter",
        "clearance": "Verified Citizen ID",
        "phone": "+91 98301 54321",
        "location": "Ballygunge, Kolkata",
    },
    {
        "id": "USR-CIT-004",
        "portal": "user",
        "email": "abhishekb@gmail.com",
        "password": "Citizen@2026",
        "name": "Abhishek Bose",
        "role": "Community Lead Reporter",
        "clearance": "Verified Citizen ID",
        "phone": "+91 98301 54321",
        "location": "Ballygunge, Kolkata",
    },
]


class AuthService:

    @staticmethod
    def get_initials(name: str) -> str:
        """Compute 2-letter initials from name, e.g. 'Devjyoti Sen' -> 'DS'."""
        parts = (name or "").strip().split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[-1][0]).upper()
        elif parts:
            return parts[0][:2].upper()
        return "KW"

    @classmethod
    def to_user_response(cls, entity: Union[User, Admin]) -> UserResponse:
        """Convert a User or Admin DB model into a frontend-compatible UserResponse schema."""
        initials = cls.get_initials(entity.name)
        is_admin = isinstance(entity, Admin) or hasattr(entity, "badge_id")
        return UserResponse(
            id=entity.id,
            email=entity.email,
            name=entity.name,
            full_name=entity.name,
            role=entity.role,
            department=getattr(entity, "department", "Kolkata Citizen Water Watch"),
            badgeId=getattr(entity, "badge_id", ""),
            badge_id=getattr(entity, "badge_id", ""),
            clearance=entity.clearance,
            avatar="👨‍✈️" if is_admin else "🌊",
            initials=initials,
            wardAccess="All Boroughs (I - XVI)",
            ward_access="All Boroughs (I - XVI)",
            avatar_url=None,
            phone=entity.phone,
            location=entity.location,
            bio=None,
            status=entity.status or "not active",
            portal="admin" if is_admin else "user",
            created_at=ensure_kolkata_tz(entity.created_at),
        )

    @classmethod
    async def seed_default_users(cls, db: AsyncSession) -> None:
        """Ensure the official demo personas exist in users and admin tables."""
        for persona in DEFAULT_PERSONAS:
            email_clean = persona["email"].lower().strip()
            portal = persona.get("portal", "user")

            if portal == "admin":
                res = await db.execute(select(Admin).where(Admin.email == email_clean))
                if not res.scalars().first():
                    db_admin = Admin(
                        id=persona["id"],
                        badge_id=persona.get("badge_id", ""),
                        name=persona["name"],
                        email=email_clean,
                        hashed_password=hash_password(persona["password"]),
                        phone=persona.get("phone"),
                        role=persona["role"],
                        department=persona.get("department", "KMC Sewerage & Drainage Directorate"),
                        clearance=persona.get("clearance", "Level 3 // Admin Clearance"),
                        status="not active",
                        created_at=get_current_time(),
                        location=persona.get("location", "Kolkata, West Bengal"),
                    )
                    db.add(db_admin)
            else:
                res = await db.execute(select(User).where(User.email == email_clean))
                if not res.scalars().first():
                    db_user = User(
                        id=persona["id"],
                        name=persona["name"],
                        email=email_clean,
                        hashed_password=hash_password(persona["password"]),
                        phone=persona.get("phone"),
                        role=persona["role"],
                        clearance=persona.get("clearance", "Citizen Access"),
                        status="not active",
                        created_at=get_current_time(),
                        location=persona.get("location", "Kolkata, West Bengal"),
                    )
                    db.add(db_user)

        await db.commit()

    @classmethod
    async def register_user(cls, db: AsyncSession, data: UserSignupRequest) -> Union[User, Admin]:
        """Register account into 'users' or 'admin' table based on selected portal."""
        email_clean = data.email.lower().strip()
        portal = (data.portal or "user").lower().strip()
        name = (data.fullName or "").strip() or ("Officer" if portal in ["admin", "super_admin"] else "Citizen")
        phone = (data.phone or "").strip() or None
        location = (data.location or "").strip() or "Kolkata, West Bengal"

        if portal in ["admin", "super_admin"]:
            # Check if admin email already exists
            result = await db.execute(select(Admin).where(Admin.email == email_clean))
            if result.scalars().first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An admin account with this email address already exists.",
                )

            admin_id = f"ADM-{uuid.uuid4().hex[:8].upper()}"
            badge_id = (data.badgeId or "").strip() or f"KMC-{uuid.uuid4().hex[:4].upper()}"
            role = data.role or ("Super Admin" if portal == "super_admin" else "Command Officer")
            department = data.department or "KMC Sewerage & Drainage Directorate"
            clearance = data.clearance or ("Level 4 // Command Clearance" if portal == "super_admin" else "Level 3 // Admin Clearance")

            new_admin = Admin(
                id=admin_id,
                badge_id=badge_id,
                name=name,
                email=email_clean,
                hashed_password=hash_password(data.password),
                phone=phone,
                role=role,
                department=department,
                clearance=clearance,
                status="not active",
                created_at=get_current_time(),
                location=location,
            )
            db.add(new_admin)
            await db.commit()
            await db.refresh(new_admin)
            return new_admin

        else:
            # Check if user email already exists
            result = await db.execute(select(User).where(User.email == email_clean))
            if result.scalars().first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A user account with this email address already exists.",
                )

            user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
            role = data.role or "Citizen"
            clearance = data.clearance or "Citizen Access"

            new_user = User(
                id=user_id,
                name=name,
                email=email_clean,
                hashed_password=hash_password(data.password),
                phone=phone,
                role=role,
                clearance=clearance,
                status="not active",
                created_at=get_current_time(),
                location=location,
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            return new_user

    @classmethod
    async def authenticate_user(
        cls, db: AsyncSession, email: str, password: str, portal: str = "user"
    ) -> Optional[Union[User, Admin]]:
        """Authenticate user against target table and set status to 'active' on success."""
        email_clean = email.lower().strip()
        target_portal = (portal or "user").lower().strip()

        entity = None
        if target_portal in ["admin", "super_admin"]:
            res = await db.execute(select(Admin).where(Admin.email == email_clean))
            entity = res.scalars().first()
            if not entity:
                res_user = await db.execute(select(User).where(User.email == email_clean))
                entity = res_user.scalars().first()
        else:
            res = await db.execute(select(User).where(User.email == email_clean))
            entity = res.scalars().first()
            if not entity:
                res_admin = await db.execute(select(Admin).where(Admin.email == email_clean))
                entity = res_admin.scalars().first()

        if not entity:
            return None

        if not verify_password(password, entity.hashed_password):
            return None

        # Successfully authenticated -> update status to 'active'
        entity.status = "active"
        await db.commit()
        await db.refresh(entity)
        return entity

    @classmethod
    async def logout_user(cls, db: AsyncSession, user_id: str) -> None:
        """Set user or admin status to 'not active' upon logout."""
        res_user = await db.execute(select(User).where(User.id == user_id))
        user = res_user.scalars().first()
        if user:
            user.status = "not active"
            await db.commit()
            return

        res_admin = await db.execute(select(Admin).where(Admin.id == user_id))
        admin = res_admin.scalars().first()
        if admin:
            admin.status = "not active"
            await db.commit()
