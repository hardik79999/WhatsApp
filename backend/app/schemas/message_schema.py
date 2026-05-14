from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class MessageCreate(BaseModel):
    chat_id: UUID
    content: Optional[str] = None          # Optional for media-only messages
    message_type: str = "text"             # text | image | video | audio | document
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    file_size: Optional[int] = None
    duration: Optional[int] = None         # seconds, for audio/video
    reply_to_message_id: Optional[UUID] = None

class MessageResponse(BaseModel):
    id: UUID
    chat_id: UUID
    sender_id: UUID
    content: Optional[str] = None
    message_type: str
    status: str
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    file_size: Optional[int] = None
    duration: Optional[int] = None
    reply_to_message_id: Optional[UUID] = None
    is_deleted: bool
    created_at: datetime

    class Config:
        from_attributes = True