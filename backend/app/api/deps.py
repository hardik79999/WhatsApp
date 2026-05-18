from fastapi import Depends, HTTPException, status, Cookie, Header
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from uuid import UUID

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
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or missing CSRF token",
    )

    bearer_token = None
    if authorization and authorization.lower().startswith("bearer "):
        bearer_token = authorization.split(" ", 1)[1].strip()

    token = bearer_token or access_token

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != "access":
            raise credentials_exception

        # Cookie auth keeps the double-submit CSRF check. Bearer auth is already
        # tied to the Authorization header and is used by the React API client.
        if not bearer_token:
            if not x_csrf_token:
                raise credentials_exception
            if payload.get("csrf") != x_csrf_token:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF token mismatch")
            
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    try:
        user_uuid = UUID(str(user_id))
    except Exception:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_uuid).first()
    if user is None:
        raise credentials_exception
        
    return user
