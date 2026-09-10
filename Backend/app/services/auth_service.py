import uuid
import re
from datetime import datetime
from typing import Optional, Union, List
from sqlalchemy import select, or_
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
        "email": "admin@kolkata-water.gov.in",
        "password": "Kolkata@Water2026",
        "name": "Administrator",
        "role": "Admin",
        "department": "KMC Water & Drainage Administration",
        "badge_id": "KMC-ADM-7049",
        "clearance": "Admin Clearance",
        "phone": "+91 98300 12345",
        "location": "Salt Lake, Kolkata",
    },
    {
        "id": "USR-CIT-003",
        "portal": "user",
        "email": "anirban.chatterjee@kolkata.org",
        "password": "Citizen@2026",
        "name": "Anirban Chatterjee",
        "role": "User",
        "clearance": "User Access",
        "phone": "+91 98301 54321",
        "location": "Ballygunge, Kolkata",
    },
    {
        "id": "USR-CIT-004",
        "portal": "user",
        "email": "abhishekb@gmail.com",
        "password": "Citizen@2026",
        "name": "Abhishek Bose",
        "role": "User",
        "clearance": "User Access",
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
        """Register account into 'users' or 'admin' table based on selected portal ('user' or 'admin')."""
        email_clean = data.email.lower().strip()
        portal = (data.portal or "user").lower().strip()
        phone = (data.phone or "").strip() or None
        location = (data.location or "").strip() or "Kolkata, West Bengal"

        if portal in ["admin", "super_admin", "officer"]:
            # Check if admin email already exists
            result = await db.execute(select(Admin).where(Admin.email == email_clean))
            if result.scalars().first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An admin account with this email address already exists.",
                )

            admin_id = f"ADM-{uuid.uuid4().hex[:8].upper()}"
            badge_id = (data.badgeId or "").strip() or f"KMC-{uuid.uuid4().hex[:4].upper()}"
            name = (data.fullName or "").strip() or "Admin"
            role = "Admin"
            department = data.department or "KMC Water & Drainage Administration"
            clearance = data.clearance or "Admin Clearance"

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
            name = (data.fullName or "").strip() or "User"
            role = "User"
            clearance = data.clearance or "User Access"

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

    @staticmethod
    def get_canonical_role_category(role_str: str) -> str:
        """
        Normalizes a role string into one of two canonical categories:
        'USER' or 'ADMIN'.
        """
        r = (role_str or "").strip().lower().replace("-", " ").replace("_", " ")
        if any(k in r for k in ["admin", "super", "officer", "engineer", "directorate", "command"]):
            return "ADMIN"
        return "USER"

    @staticmethod
    def get_canonical_portal_category(portal_str: str) -> str:
        """
        Normalizes a portal string into one of two canonical categories:
        'USER' or 'ADMIN'.
        """
        p = (portal_str or "user").strip().lower().replace("-", " ").replace("_", " ")
        if any(k in p for k in ["admin", "super", "officer"]):
            return "ADMIN"
        return "USER"

    @classmethod
    def validate_role_for_portal(cls, account_role: str, requested_portal: str) -> tuple[bool, str]:
        """
        Validates that the account's registered role matches the requested login portal.
        Only two portals exist: 'user' and 'admin'.
        Returns (is_valid, error_message).
        """
        canon_role = cls.get_canonical_role_category(account_role)
        canon_portal = cls.get_canonical_portal_category(requested_portal)

        # If portal is user, only USER role is permitted
        if canon_portal == "USER":
            if canon_role == "USER":
                return True, ""
            return False, "This account is registered as an Administrator. Please use the Admin Login portal."

        # If portal is admin, only ADMIN role is permitted
        if canon_portal == "ADMIN":
            if canon_role == "ADMIN":
                return True, ""
            return False, "This account is registered as a User. Please use the User Login portal."

        return True, ""

    @classmethod
    async def find_account_by_identifier(
        cls, db: AsyncSession, identifier: str
    ) -> Optional[Union[User, Admin]]:
        """Finds account across admin and users table by email or phone."""
        clean = (identifier or "").lower().strip()
        raw_digits = re.sub(r"\D", "", identifier or "")

        # Check Admin table
        admin_conds = [Admin.email == clean]
        if len(raw_digits) >= 7:
            admin_conds.append(Admin.phone == identifier.strip())
            admin_conds.append(Admin.phone.like(f"%{raw_digits[-10:]}"))
        res_adm = await db.execute(select(Admin).where(or_(*admin_conds)))
        adm = res_adm.scalars().first()
        if adm:
            return adm

        # Check Users table
        user_conds = [User.email == clean]
        if len(raw_digits) >= 7:
            user_conds.append(User.phone == identifier.strip())
            user_conds.append(User.phone.like(f"%{raw_digits[-10:]}"))
        res_usr = await db.execute(select(User).where(or_(*user_conds)))
        usr = res_usr.scalars().first()
        return usr

    @classmethod
    async def authenticate_user(
        cls, db: AsyncSession, email: str, password: str, portal: str = "user"
    ) -> tuple[Optional[Union[User, Admin]], str]:
        """
        Authenticate user credentials against target table with strict role-based portal validation.
        Returns (entity, error_detail).
        """
        entity = await cls.find_account_by_identifier(db, email)
        if not entity:
            return None, "No account found with these credentials. Please check your email or phone."

        # Validate role matches requested portal
        is_valid_role, role_error = cls.validate_role_for_portal(entity.role, portal)
        if not is_valid_role:
            return None, role_error

        if not verify_password(password, entity.hashed_password):
            return None, "Invalid email/phone or password."

        # Successfully authenticated -> update status to 'active'
        entity.status = "active"
        await db.commit()
        await db.refresh(entity)
        return entity, ""

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
