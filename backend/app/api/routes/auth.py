import random
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie, Header
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token
from app.schemas.auth_schema import SendOTPRequest, VerifyOTPRequest, TokenResponse
from app.models.user_model import User
from app.core.config import settings
from app.core.security import ALGORITHM

router = APIRouter()
otp_storage = {}

@router.post("/send-otp", status_code=status.HTTP_200_OK)
def send_otp(request: SendOTPRequest):
    mock_otp = str(random.randint(1000, 9999))
    otp_storage[request.phone] = mock_otp
    print(f"\n{'='*40}\n🚀 MOCK OTP FOR {request.phone} : {mock_otp}\n{'='*40}\n")
    return {"message": "OTP sent successfully"}

# Yahan Response object add kiya hai
@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(request: VerifyOTPRequest, response: Response, db: Session = Depends(get_db)):
    stored_otp = otp_storage.get(request.phone)
    if not stored_otp or stored_otp != request.otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
    
    user = db.query(User).filter(User.phone == request.phone).first()
    is_new_user = False
    
    if not user:
        user = User(phone=request.phone)
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True
        
    # Tokens aur unke CSRF codes banaye
    access_token, csrf_access = create_access_token(data={"sub": str(user.id)})
    refresh_token, csrf_refresh = create_refresh_token(data={"sub": str(user.id)})
    
    # HttpOnly Cookies set kiye
    response.set_cookie(
        key="access_token", value=access_token,
        httponly=True, secure=False, samesite="lax", path="/"
    )
    response.set_cookie(
        key="refresh_token", value=refresh_token,
        httponly=True, secure=False, samesite="lax", path="/"
    )
    
    del otp_storage[request.phone]
    
    # Return mein sirf CSRF tokens
    return {
        "csrf_access_token": csrf_access,
        "csrf_refresh_token": csrf_refresh,
        "is_new_user": is_new_user
    }


@router.post("/refresh", response_model=TokenResponse)
def refresh_tokens(
    response: Response,
    refresh_token: str = Cookie(None),
    x_csrf_token: str = Header(None, alias="X-CSRF-Token"),
    db: Session = Depends(get_db),
):
    """
    Rotate access token using refresh token cookie + refresh CSRF header.
    """
    if not refresh_token or not x_csrf_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token or CSRF token")

    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        if payload.get("csrf") != x_csrf_token:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF token mismatch")
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    try:
        user_uuid = UUID(str(user_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token, csrf_access = create_access_token(data={"sub": str(user.id)})
    new_refresh_token, csrf_refresh = create_refresh_token(data={"sub": str(user.id)})

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
    )

    return {
        "csrf_access_token": csrf_access,
        "csrf_refresh_token": csrf_refresh,
        "is_new_user": False,
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out"}
from uuid import UUID
