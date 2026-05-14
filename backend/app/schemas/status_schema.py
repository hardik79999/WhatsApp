from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class StatusCreate(BaseModel):
    content: Optional[str] = None       # Text caption or text-only status
    media_url: Optional[str] = None     # From /api/v1/media/upload
    thumbnail_url: Optional[str] = None
    background_color: Optional[str] = "#1a1a2e"  # For text-only statuses


class StatusViewerResponse(BaseModel):
    viewer_id: UUID
    username: Optional[str] = None
    profile_pic: Optional[str] = None
    viewed_at: datetime

    class Config:
        from_attributes = True


class StatusResponse(BaseModel):
    id: UUID
    user_id: UUID
    username: Optional[str] = None
    profile_pic: Optional[str] = None
    content: Optional[str] = None
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    background_color: Optional[str] = None
    expires_at: datetime
    created_at: datetime
    view_count: int = 0
    is_viewed: bool = False             # Has the requesting user viewed this?
    viewers: Optional[List[StatusViewerResponse]] = None  # Only for own statuses

    class Config:
        from_attributes = True


# Statuses grouped by contact (like WhatsApp sidebar)
class ContactStatusGroup(BaseModel):
    user_id: UUID
    username: Optional[str] = None
    profile_pic: Optional[str] = None
    has_unviewed: bool                  # Controls the colored ring
    statuses: List[StatusResponse]