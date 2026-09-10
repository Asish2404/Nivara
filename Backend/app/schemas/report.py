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