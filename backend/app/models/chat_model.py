import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Chat(Base):
    __tablename__ = "chats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    is_group = Column(Boolean, default=False)
    
    group_name = Column(String, nullable=True)
    group_picture = Column(String, nullable=True)
    group_description = Column(Text, nullable=True)
    
    # Kisne group banaya
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    last_message_id = Column(UUID(as_uuid=True), nullable=True) 
    last_message_at = Column(DateTime(timezone=True), index=True, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    participants = relationship("ChatParticipant", back_populates="chat", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")


class ChatParticipant(Base):
    __tablename__ = "chat_participants"

    # Dono foreign keys ko milakar ek Primary Key (Composite PK) banayi hai
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    role = Column(String, default="member") # member, admin, super_admin
    is_muted = Column(Boolean, default=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    chat = relationship("Chat", back_populates="participants")