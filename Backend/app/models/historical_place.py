from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base


class HistoricalPlace(Base):
    __tablename__ = "historical_place"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    incident_id: Mapped[str] = mapped_column(String(64), default="")
    location: Mapped[str] = mapped_column(String(255), default="")
    latitude: Mapped[float] = mapped_column(Float, default=0.0)
    longitude: Mapped[float] = mapped_column(Float, default=0.0)
    issue_type: Mapped[str] = mapped_column(String(128), default="Waterlogging")
    water_depth: Mapped[float] = mapped_column(Float, default=0.0)
    work_id: Mapped[str] = mapped_column(String(64), default="")
    assigned_ulb_id: Mapped[str] = mapped_column(String(64), default="")
    assigned_ulb_name: Mapped[str] = mapped_column(String(128), default="")
    jurisdiction_type: Mapped[str] = mapped_column(String(64), default="")
    ward: Mapped[str] = mapped_column(String(64), default="")
    status: Mapped[str] = mapped_column(String(32), default="Resolved")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

