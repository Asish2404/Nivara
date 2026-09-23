from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, computed_field
from app.core.datetime_utils import ensure_kolkata_tz, get_current_time


class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    message: str
    location: Optional[str] = ""
    ward: Optional[str] = ""
    report_id: Optional[str] = ""
    work_id: Optional[str] = ""


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = True


class NotificationResponse(BaseModel):
    id: int
    notification_id: str
    user_id: str
    type: str
    title: str
    message: str
    location: Optional[str] = ""
    ward: Optional[str] = ""
    is_read: bool = False
    report_id: Optional[str] = ""
    work_id: Optional[str] = ""
    created_at: Optional[datetime] = None

    @computed_field
    @property
    def isRead(self) -> bool:
        return bool(self.is_read)

    @computed_field
    @property
    def timestamp(self) -> str:
        if not self.created_at:
            return "Just now"
        dt = ensure_kolkata_tz(self.created_at)
        now = get_current_time()
        elapsed = (now - dt).total_seconds() if dt and now else 0
        if elapsed < 60:
            return "Just now"
        elif elapsed < 3600:
            return f"{int(elapsed // 60)}m ago"
        elif elapsed < 86400:
            return f"{int(elapsed // 3600)}h ago"
        else:
            return dt.strftime("%b %d, %Y")

    @computed_field
    @property
    def created_at_formatted(self) -> str:
        if not self.created_at:
            return ""
        dt = ensure_kolkata_tz(self.created_at)
        return dt.strftime("%b %d, %Y at %I:%M %p")

    class Config:
        from_attributes = True
        populate_by_name = True
