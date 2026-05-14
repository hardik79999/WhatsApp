import shutil
import uuid

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user_model import User
from app.schemas.user_schema import UserResponse
from app.schemas.user_schema import UserResponse, UserUpdate # UserUpdate import kar lena

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/search", response_model=List[UserResponse])
def search_users(
    q: str = Query(..., min_length=3, description="Phone number ya naam se search karo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Phone number se registered users dhundo.
    Khud ko (current_user) result mein mat dikhao.
    """
    users = db.query(User).filter(
        User.phone.ilike(f"%{q}%"),
        User.id != current_user.id
    ).limit(20).all()
    
    return users




# 1. Profile Name aur Bio update karne ke liye
@router.put("/me", response_model=UserResponse)
def update_profile(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if update_data.username:
        current_user.username = update_data.username
    if update_data.bio:
        current_user.bio = update_data.bio
        
    db.commit()
    db.refresh(current_user)
    return current_user

# 2. Profile Photo (DP) upload karne ke liye
@router.post("/me/photo", response_model=UserResponse)
def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Unique naam generate karo image ke liye taaki purani overwrite na ho
    file_extension = file.filename.split(".")[-1]
    new_filename = f"{uuid.uuid4()}.{file_extension}"
    file_location = f"uploads/profiles/{new_filename}"
    
    # Image ko local folder mein save karo
    with open(file_location, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Database mein image ka URL save kardo 
    # (Abhi localhost hai, production me asli domain aayega)
    current_user.profile_pic = f"http://localhost:8000/uploads/profiles/{new_filename}"
    db.commit()
    db.refresh(current_user)
    
    return current_user