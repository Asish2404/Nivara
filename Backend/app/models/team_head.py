from datetime import datetime
from sqlalchemy import String, DateTime, Integer, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from ..core.datetime_utils import get_current_time
from ..core.database import Base


class TeamHead(Base):
    __tablename__ = "team_head"
    __table_args__ = (
        CheckConstraint("status IN ('occupied', 'not occupied')", name="check_team_head_status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    hash_password: Mapped[str] = mapped_column(String(255), nullable=False)
    ph_no: Mapped[str] = mapped_column(String(32), nullable=False)
    role: Mapped[str] = mapped_column(String(64), default="team_head")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_current_time)
    status: Mapped[str] = mapped_column(String(32), default="not occupied")

    @property
    def full_name(self) -> str:
        return self.name

    @full_name.setter
    def full_name(self, val: str):
        self.name = val

    @property
    def hashed_password(self) -> str:
        return self.hash_password

    @hashed_password.setter
    def hashed_password(self, val: str):
        self.hash_password = val

    @property
    def phone(self) -> str:
        return self.ph_no

    @phone.setter
    def phone(self, val: str):
        self.ph_no = val

    @property
    def department(self) -> str:
        return "KMC Field Operations & Ward Supervision"

    @property
    def clearance(self) -> str:
        return "Supervisor Clearance"

    @property
    def badge_id(self) -> str:
        return f"KMC-TH-{self.id:04d}" if self.id else "KMC-TH-0001"

    @property
    def location(self) -> str:
        return "Kolkata, West Bengal"

    @property
    def is_active(self) -> bool:
        return True
