# Created by: Master Fix Pass
from fastapi import Request
from jose import JWTError, jwt
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.security import ALGORITHM


def get_user_or_remote_address(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    token = None

    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    else:
        token = request.cookies.get("access_token")

    if token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                return f"user:{user_id}"
        except JWTError:
            pass

    return f"ip:{get_remote_address(request)}"


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
)
