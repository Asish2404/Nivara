from datetime import datetime
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(128), nullable=False)
    role: Mapped[str] = mapped_column(String(64), default="Command Officer")
    department: Mapped[str] = mapped_column(String(128), default="KMC Sewerage & Drainage Directorate")
    badge_id: Mapped[str] = mapped_column(String(64), default="KMC-DIR-7049")
    clearance: Mapped[str] = mapped_column(String(64), default="Level 4 // Command Clearance")
    avatar: Mapped[str] = mapped_column(String(32), default="👨‍✈️")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
