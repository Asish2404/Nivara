from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr


class UserSignupRequest(BaseModel):
    email: str = Field(..., description="User municipal or personal email")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    fullName: Optional[str] = Field(default="", alias="full_name")
    role: Optional[str] = "Kolkata Water Intelligence Officer"
    department: Optional[str] = "Kolkata Water Intelligence"
    badgeId: Optional[str] = Field(default="", alias="badge_id")
    clearance: Optional[str] = ""
    avatar: Optional[str] = "🛡️"
    wardAccess: Optional[str] = Field(default="Kolkata Metropolitan Area", alias="ward_access")

    class Config:
        populate_by_name = True


class UserLoginRequest(BaseModel):
    email: str
    password: str


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
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    created_at: Optional[datetime] = None

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
