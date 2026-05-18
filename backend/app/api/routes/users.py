import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user_model import User
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
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    max_size = 10 * 1024 * 1024  # 10 MB
    contents = file.file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(contents) > max_size:
        raise HTTPException(status_code=413, detail="File too large. Max 10 MB")

    # Unique naam generate karo image ke liye taaki purani overwrite na ho
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        suffix = ".jpg"
    new_filename = f"{uuid.uuid4()}{suffix}"
    file_location = f"uploads/profiles/{new_filename}"

    os.makedirs("uploads/profiles", exist_ok=True)
    with open(file_location, "wb") as buffer:
        buffer.write(contents)

    scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("host", request.url.netloc)
    base_url = f"{scheme}://{host}"
    current_user.profile_pic = f"{base_url}/uploads/profiles/{new_filename}"
    db.commit()
    db.refresh(current_user)
    
    return current_user
