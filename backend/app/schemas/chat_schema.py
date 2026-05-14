from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime
from uuid import UUID

# Naya chat start karne ke liye request
class ChatCreate(BaseModel):
    contact_id: UUID

# Group chat banane ke liye request
class GroupChatCreate(BaseModel):
    group_name: str
    group_description: Optional[str] = None
    group_picture: Optional[str] = None
    participant_ids: List[UUID]

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