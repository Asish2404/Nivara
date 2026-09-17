from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, computed_field
from app.core.datetime_utils import ensure_kolkata_tz


class ReportCreate(BaseModel):
    """Multipart form fields accepted by POST /reports. Aligned to the frontend form."""

    location: Optional[str] = Field(default="", description="Street / locality address")
    latitude: Optional[float] = Field(default=None, description="GPS latitude")
    longitude: Optional[float] = Field(default=None, description="GPS longitude")
    issue_type: str = Field(default="Waterlogging", alias="issueType")
    description: str = Field(default="", description="Citizen description of the waterlogging")
    water_depth: float = Field(0.0, alias="waterDepth", description="Estimated water depth in cm")

    class Config:
        populate_by_name = True


class ReportResponse(BaseModel):
    id: int
    report_id: str
    user_id: str
    user_name: str
    user_email: str
    original_image: str
    image_url: str
    location: str
    latitude: float
    longitude: float
    location_source: Optional[str] = "coordinates"
    assigned_ulb_id: Optional[str] = ""
    assigned_ulb_name: Optional[str] = ""
    jurisdiction_type: Optional[str] = ""
    ward: Optional[str] = ""
    issue_type: str
    water_depth: float
    description: str
    submitted_at: Optional[datetime] = None
    status: str
    ai_confidence: float
    ai_verification_result: str
    dispatch_status: str
    dispatched_to: str
    updated_at: Optional[datetime] = None

    @computed_field
    @property
    def submitted_time_12hr(self) -> str:
        dt = ensure_kolkata_tz(self.submitted_at)
        return dt.strftime("%I:%M %p") if dt else ""

    @computed_field
    @property
    def updated_time_12hr(self) -> str:
        dt = ensure_kolkata_tz(self.updated_at)
        return dt.strftime("%I:%M %p") if dt else ""

    @computed_field
    @property
    def submitted_at_formatted(self) -> str:
        dt = ensure_kolkata_tz(self.submitted_at)
        return dt.strftime("%b %d, %Y at %I:%M %p") if dt else ""

    @computed_field
    @property
    def updated_at_formatted(self) -> str:
        dt = ensure_kolkata_tz(self.updated_at)
        return dt.strftime("%b %d, %Y at %I:%M %p") if dt else ""

    class Config:
        from_attributes = True
        populate_by_name = True


class IncidentQueueResponse(BaseModel):
    id: int
    incident_id: str
    location: str
    latitude: float
    longitude: float
    ward: Optional[str] = ""
    assigned_ulb_id: Optional[str] = ""
    assigned_ulb_name: Optional[str] = ""
    jurisdiction_type: Optional[str] = ""
    subdivision: Optional[str] = ""
    issue_type: Optional[str] = "Waterlogging"
    water_depth: float = 0.0
    report_count: int = 1
    risk_level: str = "LOW"
    severity: Optional[str] = None
    status: str = "Needs Intervention"
    latest_description: Optional[str] = ""
    latest_image_url: Optional[str] = ""
    latest_report_id: Optional[str] = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_reported_at: Optional[datetime] = None

    @computed_field
    @property
    def card_id(self) -> str:
        return f"#{self.incident_id}" if not self.incident_id.startswith("#") else self.incident_id

    @computed_field
    @property
    def water_depth_display(self) -> str:
        if self.water_depth and self.water_depth > 0:
            return f"{int(self.water_depth) if self.water_depth.is_integer() else self.water_depth} cm water depth"
        return "Telemetry Pending"

    @computed_field
    @property
    def verified_reports_display(self) -> str:
        count = self.report_count or 1
        return f"{count} verified {'report' if count == 1 else 'reports'}"

    @computed_field
    @property
    def dynamic_severity(self) -> str:
        return self.risk_level or self.severity or "LOW"

    @computed_field
    @property
    def updated_at_formatted(self) -> str:
        dt = ensure_kolkata_tz(self.updated_at)
        return dt.strftime("%b %d, %Y at %I:%M %p") if dt else ""

    class Config:
        from_attributes = True
        populate_by_name = True
