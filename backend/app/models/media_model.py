import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class MediaUpload(Base):
    """Centralized media tracking for all uploads (images, videos, audio, documents)"""
    __tablename__ = "media_uploads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Who uploaded
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # File metadata
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # S3 URL or local path
    mime_type = Column(String, nullable=False)  # image/png, audio/mpeg, etc.
    file_size = Column(Integer, nullable=False)  # bytes
    duration = Column(Integer, nullable=True)  # seconds (for audio/video)
    
    # Type classification
    media_type = Column(String, default="image")  # image, video, audio, document, profile_pic
    
    # Metadata
    width = Column(Integer, nullable=True)  # For images
    height = Column(Integer, nullable=True)  # For images
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    uploader = relationship("User", backref="uploads")
