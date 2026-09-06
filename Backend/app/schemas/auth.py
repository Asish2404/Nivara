from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr


class UserSignupRequest(BaseModel):
    email: str = Field(..., description="User municipal or personal email")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    fullName: Optional[str] = Field(default="Officer Devjyoti Sen", alias="full_name")
    role: Optional[str] = "Chief Drainage Officer"
    department: Optional[str] = "KMC Sewerage & Drainage Directorate"
    badgeId: Optional[str] = Field(default="KMC-DIR-7049", alias="badge_id")
    clearance: Optional[str] = "Level 4 // Command Clearance"
    avatar: Optional[str] = "👨‍✈️"
    wardAccess: Optional[str] = Field(default="All Boroughs (I - XVI)", alias="ward_access")

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
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
