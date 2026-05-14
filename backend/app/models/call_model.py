import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class Call(Base):
    __tablename__ = "calls"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Participants
    caller_id   = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Call info — kept as plain String so no Enum migration is needed
    call_type = Column(String, default="audio")   # "audio" | "video"
    status    = Column(String, default="initiated") # initiated | ongoing | completed | missed | rejected | rejected

    # Timing
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at   = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    caller   = relationship("User", foreign_keys=[caller_id],   backref="outgoing_calls")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="incoming_calls")