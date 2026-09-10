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
    otp: Optional[str] = Field(default=None, description="2FA OTP code for administrative registration")

    class Config:
        populate_by_name = True


class UserLoginRequest(BaseModel):
    email: str
    password: str
    portal: Optional[str] = "user"
    otp: Optional[str] = Field(default=None, description="2FA OTP code for administrative login")


class GenerateOtpRequest(BaseModel):
    name: Optional[str] = Field(default=None, description="User or admin full name for personalized messaging")
    email: Optional[str] = Field(default=None, description="Target email for OTP dispatch")
    phone: Optional[str] = Field(default=None, description="Target mobile phone number for SMS OTP dispatch")
    purpose: str = Field(default="login", description="'login' or 'signup'")
    portal: Optional[str] = Field(default="user", description="Login portal: 'user' or 'admin'")
    password: Optional[str] = Field(default=None, description="Optional password for credential verification")


class VerifyOtpRequest(BaseModel):
    otp: str = Field(..., min_length=4, max_length=8, description="Verification OTP code")
    email: Optional[str] = Field(default=None, description="Target email")
    phone: Optional[str] = Field(default=None, description="Target mobile phone number")
    purpose: str = Field(default="login", description="'login' or 'signup'")


class OtpResponse(BaseModel):
    status: str = "ok"
    message: str
    phone: Optional[str] = None
    email: Optional[str] = None
    expires_in: int = 300
    sms_preview: Optional[str] = None
    otp: Optional[str] = None


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
