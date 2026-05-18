from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime
from uuid import UUID
 
 
class CallInitiate(BaseModel):
    receiver_id: UUID
    call_type: Literal["audio", "video"]
 
 
class CallResponse(BaseModel):
    id: UUID
    caller_id: UUID
    receiver_id: Optional[UUID] = None
    call_type: str
    status: str             # initiated | ongoing | completed | missed | rejected
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime
 
    class Config:
        from_attributes = True
 
 
class CallHistoryResponse(BaseModel):
    id: UUID
    call_type: str
    status: str
    direction: str          # "outgoing" | "incoming"
    other_user_id: UUID
    other_username: Optional[str] = None
    other_profile_pic: Optional[str] = None
    duration_seconds: Optional[int] = None
    created_at: datetime
 
    class Config:
        from_attributes = True
