from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class MessageCreate(BaseModel):
    chat_id: UUID
    content: str
    message_type: str = "text" # aage chalkar image/video ke liye kaam aayega

class MessageResponse(BaseModel):
    id: UUID
    chat_id: UUID
    sender_id: UUID
    content: str
    message_type: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True