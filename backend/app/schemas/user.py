from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    username: str
    display_name: str
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None


class UserPublic(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    reputation: int
    gold_badges: int
    silver_badges: int
    bronze_badges: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserPrivate(UserPublic):
    email: EmailStr
    is_active: bool
    is_verified: bool
    is_admin: bool
    last_seen_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None


class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str
