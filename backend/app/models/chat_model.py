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
    group_description = Column(Text, nullable=True)
    group_picture = Column(String, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    group_pic_id = Column(UUID(as_uuid=True), ForeignKey("media_uploads.id", ondelete="SET NULL"), nullable=True)
    group_created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    last_message_id = Column(UUID(as_uuid=True), nullable=True)
    last_message_at = Column(DateTime(timezone=True), index=True, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    participants = relationship("ChatParticipant", back_populates="chat", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")
    members = relationship("GroupMember", back_populates="chat", cascade="all, delete-orphan")
    group_pic = relationship("MediaUpload", backref="group_chats")
    group_creator = relationship("User", foreign_keys=[group_created_by_id], backref="created_groups")


class ChatParticipant(Base):
    __tablename__ = "chat_participants"

    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    role = Column(String, default="member")
    is_muted = Column(Boolean, default=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    chat = relationship("Chat", back_populates="participants")