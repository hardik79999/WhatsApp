from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

# Jo data update karna allowed hai (Name, Bio, Pic)
class UserUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None
    profile_pic: Optional[str] = None

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


class UserUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None