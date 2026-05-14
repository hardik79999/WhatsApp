import random
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token
from app.schemas.auth_schema import SendOTPRequest, VerifyOTPRequest, TokenResponse
from app.models.user_model import User

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