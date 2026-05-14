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
    media_id: Optional[UUID] = None
    caption: Optional[str] = None
    reply_to_message_id: Optional[UUID] = None


class MessageEdit(BaseModel):
    content: str


class ReplyPreview(BaseModel):
    """Embedded in MessageResponse so the frontend can render quoted text."""
    id: UUID
    content: Optional[str] = None
    sender_id: Optional[UUID] = None
    message_type: str = "text"

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: UUID
    chat_id: UUID
    sender_id: Optional[UUID] = None
    content: Optional[str] = None
    message_type: str
    status: str
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    file_size: Optional[int] = None
    duration: Optional[int] = None
    reply_to_message_id: Optional[UUID] = None
    replied_message: Optional[ReplyPreview] = None   # eagerly loaded for UI
    is_edited: bool = False
    is_deleted: bool = False
    is_deleted_for_everyone: bool = False
    created_at: datetime
    edited_at: Optional[datetime] = None
    media_id: Optional[UUID] = None
    caption: Optional[str] = None

    class Config:
        from_attributes = True
