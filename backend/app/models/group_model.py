import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class GroupMemberRole(str, enum.Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    MEMBER = "member"

class GroupMember(Base):
    """Tracks users in group chats with roles"""
    __tablename__ = "group_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    role = Column(Enum(GroupMemberRole), default=GroupMemberRole.MEMBER)
    
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Soft delete (removed from group)
    is_active = Column(Boolean, default=True)
    removed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    chat = relationship("Chat", back_populates="members")
    user = relationship("User", backref="group_memberships")
