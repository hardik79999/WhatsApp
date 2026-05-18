import re

from pydantic import BaseModel, field_validator
from typing import List, Optional
from uuid import UUID


PHONE_RE = re.compile(r"^[6-9]\d{9}$")


def normalize_indian_phone(value: str) -> str:
    digits = re.sub(r"\D", "", str(value or "").strip())
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if not PHONE_RE.fullmatch(digits):
        raise ValueError("Phone must be a valid 10-digit Indian mobile number")
    return digits

# Frontend se aane wala ek single contact item
class ContactItem(BaseModel):
    phone: str
    name: str  # Jo naam user ne apne phone book mein save kiya hai

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_indian_phone(value)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return str(value or "").strip()

# Request Schema for bulk sync
class SyncContactsRequest(BaseModel):
    contacts: List[ContactItem]

# Request Schema for single contact sync
class SyncSingleContactRequest(BaseModel):
    phone: str
    name: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_indian_phone(value)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return value.strip() or None

# Response Schema
class ContactResponse(BaseModel):
    id: UUID
    contact_id: UUID  # Friend ka actual User ID
    phone: str
    saved_name: Optional[str] = None
    profile_pic: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        from_attributes = True
