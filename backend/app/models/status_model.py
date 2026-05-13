import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Status(Base):
    __tablename__ = "statuses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    media_url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    content = Column(Text, nullable=True)

    # Status kab expire hoga (e.g., 24 hours after creation)
    expires_at = Column(DateTime(timezone=True), index=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    views = relationship("StatusView", back_populates="status", cascade="all, delete-orphan")


class StatusView(Base):
    __tablename__ = "status_views"

    status_id = Column(UUID(as_uuid=True), ForeignKey("statuses.id", ondelete="CASCADE"), primary_key=True)
    viewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    viewed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    status = relationship("Status", back_populates="views")