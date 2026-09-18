from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from ..core.datetime_utils import get_current_time
from ..core.database import Base


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    work_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    incident_id: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    
    # Location & Jurisdiction details
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, default=0.0)
    longitude: Mapped[float] = mapped_column(Float, default=0.0)
    ward: Mapped[str] = mapped_column(String(64), default="")
    assigned_ulb_id: Mapped[str] = mapped_column(String(64), default="")
    assigned_ulb_name: Mapped[str] = mapped_column(String(128), default="")
    jurisdiction_type: Mapped[str] = mapped_column(String(64), default="")

    # Incident Details
    issue_type: Mapped[str] = mapped_column(String(128), default="Waterlogging")
    risk_level: Mapped[str] = mapped_column(String(32), default="LOW")
    water_depth: Mapped[float] = mapped_column(Float, default=0.0)
    reports_number: Mapped[int] = mapped_column(Integer, default=1)

    # Intervention type populated directly from selected intervention parameters
    intervention_type: Mapped[str] = mapped_column(String(255), default="")
    status: Mapped[str] = mapped_column(String(32), default="Dispatched")  # Dispatched, In Progress, Resolved

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_current_time)
    dispatched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_current_time)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_current_time)
