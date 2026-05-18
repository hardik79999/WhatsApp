import re

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID

# Jo data update karna allowed hai (Name, Bio, Pic)
class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=1, max_length=50)
    bio: Optional[str] = Field(default=None, max_length=200)
    profile_pic: Optional[str] = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        username = value.strip()
        if not username:
            raise ValueError("Username is required")
        if not re.fullmatch(r"[A-Za-z0-9 ]+", username):
            raise ValueError("Username can contain only letters, numbers, and spaces")
        return username

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        bio = value.strip()
        if len(bio) > 200:
            raise ValueError("Bio must be 200 characters or less")
        return bio

# Jo data hum response mein denge
class UserResponse(BaseModel):
    id: UUID
    phone: str
    username: Optional[str] = None
    bio: Optional[str] = None
    profile_pic: Optional[str] = None
    is_online: bool
    last_seen: Optional[datetime] = None

    class Config:
        from_attributes = True # SQLAlchemy model ko JSON mein convert karne ke liye zaroori
