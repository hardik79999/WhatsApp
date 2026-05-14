import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class CallType(str, enum.Enum):
    AUDIO = "audio"
    VIDEO = "video"

class CallStatus(str, enum.Enum):
    RINGING = "ringing"
    ACTIVE = "active"
    ENDED = "ended"
    MISSED = "missed"
    REJECTED = "rejected"

class Call(Base):
    __tablename__ = "calls"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Participants
    caller_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    callee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Call info
    call_type = Column(Enum(CallType), default=CallType.AUDIO)
    status = Column(Enum(CallStatus), default=CallStatus.RINGING)
    
    # Timing
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration = Column(String, nullable=True)  # Format: MM:SS
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    caller = relationship("User", foreign_keys=[caller_id], backref="outgoing_calls")
    callee = relationship("User", foreign_keys=[callee_id], backref="incoming_calls")