from pydantic import BaseModel, Field

class SendOTPRequest(BaseModel):
    phone: str = Field(..., example="+919876543210")

class VerifyOTPRequest(BaseModel):
    phone: str = Field(..., example="+919876543210")
    otp: str = Field(..., min_length=4, max_length=6, example="1234")

# Ye response frontend ko jayega
class TokenResponse(BaseModel):
    csrf_access_token: str
    csrf_refresh_token: str
    is_new_user: bool