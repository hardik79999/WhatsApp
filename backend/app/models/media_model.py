import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class MediaUpload(Base):
    """Centralized media tracking for all uploads (images, videos, audio, documents)"""
    __tablename__ = "media_uploads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    file_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    file_path = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    uploader = relationship("User", backref="uploads")
