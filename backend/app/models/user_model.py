import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    # id ke liye native UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    phone = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    profile_pic = Column(String, nullable=True)

    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime(timezone=True), nullable=True)

    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # onupdate automatically time update karega jab bhi record change hoga
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships (jab contact model ban jayega tab connect karne ke liye)
    contacts = relationship("Contact", foreign_keys="Contact.user_id", back_populates="owner", cascade="all, delete-orphan")