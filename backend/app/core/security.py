import uuid
from datetime import datetime, timedelta
from jose import jwt
from app.core.config import settings

ALGORITHM = "HS256"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Generate CSRF token
    csrf_token = str(uuid.uuid4())
    
    # Add type and csrf to payload
    to_encode.update({"exp": expire, "type": "access", "csrf": csrf_token})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt, csrf_token

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Generate CSRF token
    csrf_token = str(uuid.uuid4())
    
    to_encode.update({"exp": expire, "type": "refresh", "csrf": csrf_token})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt, csrf_token