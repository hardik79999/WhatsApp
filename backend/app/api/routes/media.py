from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid
import os
from pathlib import Path

from app.api.deps import get_current_user
from app.models.user_model import User

router = APIRouter()

MEDIA_DIR = Path("media")
MEDIA_DIR.mkdir(exist_ok=True)

ALLOWED_TYPES = {
    "image/jpeg":       ("image",    "images"),
    "image/png":        ("image",    "images"),
    "image/gif":        ("image",    "images"),
    "image/webp":       ("image",    "images"),
    "video/mp4":        ("video",    "videos"),
    "video/webm":       ("video",    "videos"),
    "audio/mpeg":       ("audio",    "audios"),
    "audio/ogg":        ("audio",    "audios"),
    "audio/wav":        ("audio",    "audios"),
    "audio/webm":       ("audio",    "audios"),   # MediaRecorder default
    "application/pdf":  ("document", "documents"),
    "application/msword": ("document", "documents"),
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                        ("document", "documents"),
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


class MediaUploadResponse(BaseModel):
    media_url: str
    media_type: str      # image | video | audio | document
    file_size: int
    filename: str
    duration: Optional[int] = None  # seconds (populated client-side for audio)


@router.post("/upload", response_model=MediaUploadResponse)
async def upload_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    contents = await file.read()
    file_size = len(contents)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 50 MB")

    content_type = file.content_type or ""
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")

    media_type, folder = ALLOWED_TYPES[content_type]

    folder_path = MEDIA_DIR / folder
    folder_path.mkdir(exist_ok=True)

    suffix = Path(file.filename or "file").suffix or ".bin"
    unique_name = f"{uuid.uuid4()}{suffix}"
    file_path = folder_path / unique_name

    with open(file_path, "wb") as f:
        f.write(contents)

    media_url = f"{BASE_URL}/media/{folder}/{unique_name}"

    return MediaUploadResponse(
        media_url=media_url,
        media_type=media_type,
        file_size=file_size,
        filename=file.filename or unique_name,
    )


@router.delete("/{folder}/{filename}", status_code=204)
async def delete_media(
    folder: str,
    filename: str,
    current_user: User = Depends(get_current_user)
):
    # Basic path traversal guard
    if ".." in folder or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid path")

    file_path = MEDIA_DIR / folder / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    os.remove(file_path)