from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    """Multipart form fields accepted by POST /reports. Aligned to the frontend form."""

    location: str = Field(..., description="Street / locality address")
    latitude: float = Field(0.0, description="GPS latitude")
    longitude: float = Field(0.0, description="GPS longitude")
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

    class Config:
        from_attributes = True
        populate_by_name = True