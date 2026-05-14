import uuid
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id", ondelete="CASCADE"), index=True, nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)

    content = Column(Text, nullable=True)

    media_url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    duration = Column(Integer, nullable=True) # Audio/Video messages ke liye
    media_id = Column(UUID(as_uuid=True), ForeignKey("media_uploads.id", ondelete="SET NULL"), nullable=True)
    caption = Column(String, nullable=True)
    
    message_type = Column(String, default="text") # text, image, video, document, audio

    # Agar kisi message ka reply diya hai, toh us original message ki ID
    reply_to_message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)

    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime(timezone=True), nullable=True)

    is_deleted = Column(Boolean, default=False)
    is_deleted_for_everyone = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    status = Column(String, default="sent") # "sent", "delivered", ya "read"

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    chat = relationship("Chat", back_populates="messages")
    media = relationship("MediaUpload", backref="messages")
    reactions = relationship("MessageReaction", back_populates="message", cascade="all, delete-orphan")
    # Ye SQLAlchemy ko batayega ki ye relationship table ke andar hi (self) hai
    replied_message = relationship("Message", remote_side=[id])




class StarredMessage(Base):
    """Association table: a user can star any message."""
    __tablename__ = "starred_messages"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), primary_key=True)
    starred_at = Column(DateTime(timezone=True), server_default=func.now())


class MessageStatus(Base):
    __tablename__ = "message_status"

    # Composite Primary Key
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    status = Column(String, default="sent") # sent, delivered, read
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())    


class MessageDeletion(Base):
    """
    Per-user deletion ("Delete for me") support.
    WhatsApp semantics: deleting a message for yourself should not affect other participants.
    """
    __tablename__ = "message_deletions"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), primary_key=True)
    deleted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
