from fastapi import Depends, HTTPException, status, Cookie, Header
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user_model import User
from app.core.security import ALGORITHM

# Ab hum custom logic use kar rahe hain, isliye OAuth2PasswordBearer hata diya
def get_current_user(
    # FastAPI automatically 'access_token' cookie padh lega
    access_token: str = Cookie(None), 
    # FastAPI automatically 'X-CSRF-Token' header padh lega
    x_csrf_token: str = Header(None, alias="X-CSRF-Token"),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or missing CSRF token",
    )
    
    # Agar cookie ya CSRF header missing hai toh reject karo
    if not access_token or not x_csrf_token:
        raise credentials_exception

    try:
        payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != "access":
            raise credentials_exception
            
        # Double Submit Check: Jo CSRF header mein aaya hai, wahi JWT ke andar hona chahiye
        if payload.get("csrf") != x_csrf_token:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF token mismatch")
            
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return user