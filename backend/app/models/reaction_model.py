import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class MessageReaction(Base):
    __tablename__ = "message_reactions"
    
    # Composite primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    reaction = Column(String, nullable=False)  # Emoji
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Ensure one reaction per user per message
    __table_args__ = (
        UniqueConstraint('message_id', 'user_id', name='unique_user_message_reaction'),
    )
