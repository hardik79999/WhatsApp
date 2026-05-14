from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user_model import User
from app.models.contact_model import Contact
from app.schemas.contact_schema import SyncContactsRequest, ContactResponse, SyncSingleContactRequest

router = APIRouter()

@router.post("/sync", response_model=List[ContactResponse])
def sync_contacts(
    request: SyncContactsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Frontend se aaye saare phone numbers nikal lo
    phone_numbers = [item.phone for item in request.contacts]
    
    # 2. Database mein check karo ki inmein se kaun-kaun app par already registered hai
    registered_users = db.query(User).filter(User.phone.in_(phone_numbers)).all()
    
    # 3. Phone number ke sath naam map karne ke liye ek dictionary bana lo
    phone_to_name = {item.phone: item.name for item in request.contacts}
    
    synced_contacts = []
    
    for user in registered_users:
        # User khud ko hi contact mein save na kar le
        if user.id == current_user.id:
            continue
            
        # Check karo ki kahin ye contact pehle se toh add nahi hai
        existing_contact = db.query(Contact).filter(
            Contact.user_id == current_user.id,
            Contact.contact_id == user.id
        ).first()
        
        saved_name = phone_to_name.get(user.phone, user.username)
        
        if existing_contact:
            # Agar pehle se hai toh sirf naam update kardo (in case phonebook me naam change hua ho)
            existing_contact.saved_name = saved_name
            synced_contacts.append(existing_contact)
        else:
            # Naya contact database mein add karo
            new_contact = Contact(
                user_id=current_user.id,
                contact_id=user.id,
                saved_name=saved_name
            )
            db.add(new_contact)
            synced_contacts.append(new_contact)
            
    db.commit()
    
    # 4. Response prepare karo jisme contact ki profile pic aur bio bhi ho
    response_data = []
    for contact in synced_contacts:
        contact_user = db.query(User).filter(User.id == contact.contact_id).first()
        response_data.append({
            "id": contact.id,
            "contact_id": contact.contact_id,
            "phone": contact_user.phone,
            "saved_name": contact.saved_name,
            "profile_pic": contact_user.profile_pic,
            "bio": contact_user.bio
        })
        
    return response_data

@router.post("/sync-single", response_model=ContactResponse)
def sync_single_contact(
    request: SyncSingleContactRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ek single phone number ko sync karne ke liye endpoint
    """
    # Check karo ye phone number registered hai ya nahi
    user = db.query(User).filter(User.phone == request.phone).first()
    
    if not user:
        raise HTTPException(
            status_code=404, 
            detail=f"Phone number {request.phone} WhatsApp par registered nahi hai"
        )
    
    # User khud ko contact mein add na kare
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Tum khud ko contact mein add nahi kar sakte"
        )
    
    # Check karo pehle se contact hai ya nahi
    existing_contact = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.contact_id == user.id
    ).first()
    
    saved_name = request.name if request.name else user.username
    
    if existing_contact:
        # Update existing contact
        existing_contact.saved_name = saved_name
        db.commit()
        contact = existing_contact
    else:
        # Create new contact
        new_contact = Contact(
            user_id=current_user.id,
            contact_id=user.id,
            saved_name=saved_name
        )
        db.add(new_contact)
        db.commit()
        db.refresh(new_contact)
        contact = new_contact
    
    return {
        "id": contact.id,
        "contact_id": contact.contact_id,
        "phone": user.phone,
        "saved_name": contact.saved_name,
        "profile_pic": user.profile_pic,
        "bio": user.bio
    }

# Saare contacts fetch karne ke liye (jab user app open karega)
@router.get("/", response_model=List[ContactResponse])
def get_my_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contacts = db.query(Contact).filter(Contact.user_id == current_user.id).all()
    
    response_data = []
    for contact in contacts:
        contact_user = db.query(User).filter(User.id == contact.contact_id).first()
        response_data.append({
            "id": contact.id,
            "contact_id": contact.contact_id,
            "phone": contact_user.phone,
            "saved_name": contact.saved_name,
            "profile_pic": contact_user.profile_pic,
            "bio": contact_user.bio
        })
    return response_data