from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, computed_field
from app.core.datetime_utils import ensure_kolkata_tz


class WorkOrderCreate(BaseModel):
    id: Optional[str] = None
    work_id: Optional[str] = Field(default=None, alias="ticketKey")
    incident_id: Optional[str] = Field(default=None, alias="incidentId")
    incident_ref: Optional[str] = Field(default=None, alias="incidentRef")
    location: str = Field(default="")
    latitude: Optional[float] = Field(default=0.0, alias="lat")
    longitude: Optional[float] = Field(default=0.0, alias="lng")
    ward: Optional[str] = Field(default="", alias="borough")
    assigned_ulb_id: Optional[str] = ""
    assigned_ulb_name: Optional[str] = ""
    jurisdiction_type: Optional[str] = ""
    issue_type: Optional[str] = "Waterlogging"
    risk_level: Optional[str] = Field(default="LOW", alias="priority")
    water_depth: Optional[float] = 0.0
    reports_number: Optional[int] = 1
    intervention_type: Optional[str] = ""
    status: Optional[str] = "Dispatched"

    class Config:
        populate_by_name = True


class WorkOrderStatusUpdate(BaseModel):
    status: Optional[str] = None


class WorkOrderResponse(BaseModel):
    id: int
    work_id: str
    incident_id: str
    location: str
    latitude: float = 0.0
    longitude: float = 0.0
    ward: Optional[str] = ""
    assigned_ulb_id: Optional[str] = ""
    assigned_ulb_name: Optional[str] = ""
    jurisdiction_type: Optional[str] = ""
    issue_type: str = "Waterlogging"
    risk_level: str = "LOW"
    water_depth: float = 0.0
    reports_number: int = 1
    intervention_type: Optional[str] = ""
    status: str = "Dispatched"
    created_at: Optional[datetime] = None
    dispatched_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @computed_field
    @property
    def created_at_formatted(self) -> str:
        dt = ensure_kolkata_tz(self.created_at)
        return dt.strftime("%b %d, %Y at %I:%M %p") if dt else ""

    @computed_field
    @property
    def dispatched_at_formatted(self) -> str:
        dt = ensure_kolkata_tz(self.dispatched_at)
        return dt.strftime("%b %d, %Y at %I:%M %p") if dt else ""

    class Config:
        from_attributes = True
        populate_by_name = True
