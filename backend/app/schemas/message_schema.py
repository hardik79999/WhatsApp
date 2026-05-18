from pydantic import BaseModel, field_validator, model_validator
from typing import Literal, Optional, List
from datetime import datetime
from uuid import UUID


class MessageCreate(BaseModel):
    chat_id: UUID
    content: Optional[str] = None          # Optional for media-only messages
    message_type: Literal["text", "image", "video", "audio", "document"] = "text"
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    file_size: Optional[int] = None
    duration: Optional[int] = None         # seconds, for audio/video
    media_id: Optional[UUID] = None
    caption: Optional[str] = None
    reply_to_message_id: Optional[UUID] = None

    @field_validator("content", "caption", mode="before")
    @classmethod
    def strip_optional_text(cls, value):
        if value is None:
            return None
        return str(value).strip()

    @model_validator(mode="after")
    def validate_content_or_media(self):
        if not self.content and not self.media_url:
            raise ValueError("Message content ya media required hai")
        return self


class MessageEdit(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        content = str(value or "").strip()
        if not content:
            raise ValueError("Message content cannot be empty")
        return content


class ReplyPreview(BaseModel):
    """Embedded in MessageResponse so the frontend can render quoted text."""
    id: UUID
    content: Optional[str] = None
    sender_id: Optional[UUID] = None
    message_type: str = "text"

    class Config:
        from_attributes = True


class ReactionPreview(BaseModel):
    user_id: UUID
    reaction: str
    username: Optional[str] = None

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
    reactions: List[ReactionPreview] = []
    is_edited: bool = False
    is_deleted: bool = False
    is_deleted_for_everyone: bool = False
    created_at: datetime
    edited_at: Optional[datetime] = None
    media_id: Optional[UUID] = None
    caption: Optional[str] = None

    class Config:
        from_attributes = True


class MessagePageResponse(BaseModel):
    messages: List[MessageResponse]
    total: int
    page: int
    has_more: bool
