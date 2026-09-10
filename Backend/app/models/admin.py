from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from ..core.datetime_utils import get_current_time
from ..core.database import Base


class Admin(Base):
    __tablename__ = "admin"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    badge_id: Mapped[str] = mapped_column(String(64), default="")
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True, default=None)
    role: Mapped[str] = mapped_column(String(64), default="Command Officer")
    department: Mapped[str] = mapped_column(String(128), default="KMC Sewerage & Drainage Directorate")
    clearance: Mapped[str] = mapped_column(String(64), default="Level 3 // Admin Clearance")
    status: Mapped[str] = mapped_column(String(32), default="not active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_current_time)
    location: Mapped[str | None] = mapped_column(String(128), nullable=True, default=None)

    @property
    def full_name(self) -> str:
        return self.name

    @full_name.setter
    def full_name(self, val: str):
        self.name = val

    @property
    def clearence(self) -> str:
        return self.clearance

    @clearence.setter
    def clearence(self, val: str):
        self.clearance = val

    @property
    def is_active(self) -> bool:
        return self.status == "active"

    @is_active.setter
    def is_active(self, val: bool):
        self.status = "active" if val else "not active"
