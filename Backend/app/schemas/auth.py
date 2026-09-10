from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, computed_field


class UserSignupRequest(BaseModel):
    email: str = Field(..., description="User municipal or personal email")
    password: str = Field(..., min_length=3, description="Password (min 3 characters)")
    fullName: Optional[str] = Field(default="", alias="full_name")
    phone: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    badgeId: Optional[str] = Field(default="", alias="badge_id")
    clearance: Optional[str] = None
    avatar: Optional[str] = "🛡️"
    wardAccess: Optional[str] = Field(default="Kolkata Metropolitan Area", alias="ward_access")
    portal: Optional[str] = "user"
    location: Optional[str] = None

    class Config:
        populate_by_name = True


class UserLoginRequest(BaseModel):
    email: str
    password: str
    portal: Optional[str] = "user"


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    full_name: str
    role: str
    department: str
    badgeId: str
    badge_id: str
    clearance: str
    avatar: str
    initials: str
    wardAccess: str
    ward_access: str
    status: str = "not active"
    portal: str = "user"
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    created_at: Optional[datetime] = None

    @computed_field
    @property
    def created_time_12hr(self) -> str:
        if not self.created_at:
            return ""
        from app.core.datetime_utils import ensure_kolkata_tz
        dt = ensure_kolkata_tz(self.created_at)
        return dt.strftime("%I:%M %p") if dt else ""

    @computed_field
    @property
    def created_at_formatted(self) -> str:
        if not self.created_at:
            return ""
        from app.core.datetime_utils import ensure_kolkata_tz
        dt = ensure_kolkata_tz(self.created_at)
        return dt.strftime("%b %d, %Y, %I:%M %p") if dt else ""

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    """Optional fields accepted by PATCH /auth/me. Only provided fields are updated."""
    full_name: Optional[str] = Field(default=None, alias="fullName")
    department: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        populate_by_name = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
