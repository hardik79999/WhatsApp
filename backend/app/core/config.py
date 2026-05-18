from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "WhatsApp Clone API"
    DATABASE_URL: str

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    ALLOWED_ORIGIN_REGEX: str = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https?://.*\.(ngrok\.io|ngrok-free\.app)$"
    MEDIA_STORAGE_PATH: str = "./media"
    BASE_URL: str = "http://localhost:8000"

    model_config = SettingsConfigDict(env_file=str(ENV_FILE), env_file_encoding="utf-8", extra="ignore")

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return value

    @property
    def allowed_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.ALLOWED_ORIGINS.split(",")
            if origin.strip()
        ]

    @property
    def allowed_origin_regex(self) -> str | None:
        return self.ALLOWED_ORIGIN_REGEX

    @property
    def media_storage_path(self) -> Path:
        path = Path(self.MEDIA_STORAGE_PATH)
        if not path.is_absolute():
            path = ENV_FILE.parent / path
        return path.resolve()

settings = Settings()
