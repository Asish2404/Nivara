from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(128), nullable=False)
    role: Mapped[str] = mapped_column(String(64), default="Kolkata Water Intelligence Officer")
    department: Mapped[str] = mapped_column(String(128), default="Kolkata Water Intelligence")
    badge_id: Mapped[str] = mapped_column(String(64), default="")
    clearance: Mapped[str] = mapped_column(String(64), default="Verified User")
    avatar: Mapped[str] = mapped_column(String(32), default="🛡️")
    # Real profile picture (URL or base64 data URL) + editable profile fields
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True, default=None)
    location: Mapped[str | None] = mapped_column(String(128), nullable=True, default=None)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
