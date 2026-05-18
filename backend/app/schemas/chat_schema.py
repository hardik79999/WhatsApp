from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Any, Dict
from datetime import datetime
from uuid import UUID

# Naya chat start karne ke liye request
class ChatCreate(BaseModel):
    contact_id: UUID

# Group chat banane ke liye request
class GroupChatCreate(BaseModel):
    group_name: str = Field(..., min_length=1, max_length=100)
    group_description: Optional[str] = Field(default=None, max_length=500)
    group_picture: Optional[str] = None
    participant_ids: List[UUID] = Field(..., min_length=1, max_length=256)

    @field_validator("group_name")
    @classmethod
    def validate_group_name(cls, value: str) -> str:
        name = str(value or "").strip()
        if not name:
            raise ValueError("Group name is required")
        if len(name) > 100:
            raise ValueError("Group name must be 100 characters or less")
        return name

    @field_validator("group_description")
    @classmethod
    def validate_group_description(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        description = value.strip()
        if len(description) > 500:
            raise ValueError("Group description must be 500 characters or less")
        return description or None

    @field_validator("participant_ids")
    @classmethod
    def validate_participant_ids(cls, value: List[UUID]) -> List[UUID]:
        if len(value) != len(set(value)):
            raise ValueError("Participant IDs cannot contain duplicates")
        return value


class GroupUpdate(BaseModel):
    group_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    group_description: Optional[str] = Field(default=None, max_length=500)
    group_picture: Optional[str] = None

    @field_validator("group_name")
    @classmethod
    def validate_group_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        name = value.strip()
        if not name:
            raise ValueError("Group name is required")
        return name

    @field_validator("group_description")
    @classmethod
    def validate_group_description(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        description = value.strip()
        if len(description) > 500:
            raise ValueError("Group description must be 500 characters or less")
        return description or None

# Chat ke andar user ki basic details
class ChatParticipantResponse(BaseModel):
    user_id: UUID
    phone: str
    username: Optional[str] = None
    profile_pic: Optional[str] = None
    role: Optional[str] = "member"
    is_online: Optional[bool] = False

# Final Chat ka response
class ChatResponse(BaseModel):
    id: UUID
    is_group: bool
    group_name: Optional[str] = None
    group_picture: Optional[str] = None
    group_description: Optional[str] = None
    created_by: Optional[UUID] = None
    updated_at: Optional[datetime] = None
    participants: List[ChatParticipantResponse] = []
    last_message: Optional[Dict[str, Any]] = None
    unread_count: int = 0

    class Config:
        from_attributes = True
