import re

from pydantic import BaseModel, Field, field_validator


PHONE_RE = re.compile(r"^[6-9]\d{9}$")


def normalize_indian_phone(value: str) -> str:
    digits = re.sub(r"\D", "", str(value or "").strip())
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if not PHONE_RE.fullmatch(digits):
        raise ValueError("Phone must be a valid 10-digit Indian mobile number")
    return digits

class SendOTPRequest(BaseModel):
    phone: str = Field(..., example="+919876543210")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_indian_phone(value)

class VerifyOTPRequest(BaseModel):
    phone: str = Field(..., example="+919876543210")
    otp: str = Field(..., min_length=6, max_length=6, example="123456")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_indian_phone(value)

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, value: str) -> str:
        otp = str(value or "").strip()
        if not re.fullmatch(r"\d{6}", otp):
            raise ValueError("OTP must be exactly 6 digits")
        return otp

# Ye response frontend ko jayega
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    csrf_access_token: str
    csrf_refresh_token: str
    is_new_user: bool
