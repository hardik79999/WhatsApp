from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from typing import Optional

# Frontend se aane wala ek single contact item
class ContactItem(BaseModel):
    phone: str
    name: str  # Jo naam user ne apne phone book mein save kiya hai

# Request Schema for bulk sync
class SyncContactsRequest(BaseModel):
    contacts: List[ContactItem]

# Request Schema for single contact sync
class SyncSingleContactRequest(BaseModel):
    phone: str
    name: Optional[str] = None

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
