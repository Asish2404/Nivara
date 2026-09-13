from datetime import datetime
from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from ..core.datetime_utils import get_current_time
from ..core.database import Base
from .admin import Admin


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True, default=None)
    role: Mapped[str] = mapped_column(String(64), default="User")
    clearance: Mapped[str] = mapped_column(String(64), default="User Access")
    status: Mapped[str] = mapped_column(String(32), default="not active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_current_time)
    location: Mapped[str | None] = mapped_column(String(128), nullable=True, default=None)
    welcome_email_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    auth_provider: Mapped[str | None] = mapped_column(String(32), nullable=True, default="local")
    google_id: Mapped[str | None] = mapped_column(String(128), nullable=True, default=None)

    @property
    def full_name(self) -> str:
        return self.name

    @full_name.setter
    def full_name(self, val: str):
        self.name = val

    @property
    def hassed_password(self) -> str:
        return self.hashed_password

    @hassed_password.setter
    def hassed_password(self, val: str):
        self.hashed_password = val

    @property
    def is_active(self) -> bool:
        return self.status == "active"

    @is_active.setter
    def is_active(self, val: bool):
        self.status = "active" if val else "not active"
