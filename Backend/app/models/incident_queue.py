from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from ..core.datetime_utils import get_current_time
from ..core.database import Base


class IncidentQueue(Base):
    __tablename__ = "incident_queue"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    incident_id: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    
    # Location & Jurisdiction details
    location: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, default=0.0)
    longitude: Mapped[float] = mapped_column(Float, default=0.0)
    ward: Mapped[str] = mapped_column(String(64), default="")
    assigned_ulb_id: Mapped[str] = mapped_column(String(64), default="")
    assigned_ulb_name: Mapped[str] = mapped_column(String(128), default="")
    jurisdiction_type: Mapped[str] = mapped_column(String(64), default="")
    subdivision: Mapped[str] = mapped_column(String(255), default="")

    # Incident Metrics
    issue_type: Mapped[str] = mapped_column(String(128), default="Waterlogging")
    water_depth: Mapped[float] = mapped_column(Float, default=0.0)  # in cm
    report_count: Mapped[int] = mapped_column(Integer, default=1)   # count of reports received for this place
    risk_level: Mapped[str] = mapped_column(String(32), default="LOW")  # CRITICAL, HIGH, MODERATE, LOW, MONITORING
    status: Mapped[str] = mapped_column(String(32), default="Needs Intervention")  # Needs Intervention, ACTIVE, RESOLVED

    # Latest Report Details
    latest_description: Mapped[str] = mapped_column(Text, default="")
    latest_image_url: Mapped[str] = mapped_column(String(255), default="")
    latest_report_id: Mapped[str] = mapped_column(String(64), default="")

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_current_time)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_current_time)
    last_reported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=get_current_time)

    @property
    def severity(self) -> str:
        return self.risk_level

    @severity.setter
    def severity(self, value: str):
        self.risk_level = value
