from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user_model import User
from app.schemas.user_schema import UserResponse

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