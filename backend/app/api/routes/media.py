import uuid
import os
import aiofiles
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import get_user_or_remote_address, limiter
from app.api.deps import get_current_user
from app.models.user_model import User
from app.models.media_model import MediaUpload

router = APIRouter()

# ── Storage root — resolved to absolute path at startup ──────────────────────
MEDIA_DIR = settings.media_storage_path
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES: dict[str, tuple[str, str]] = {
    "image/jpeg":       ("image",    "images"),
    "image/png":        ("image",    "images"),
    "image/gif":        ("image",    "images"),
    "image/webp":       ("image",    "images"),
    "video/mp4":        ("video",    "videos"),
    "video/webm":       ("video",    "videos"),
    "audio/mpeg":       ("audio",    "audios"),
    "audio/ogg":        ("audio",    "audios"),
    "audio/wav":        ("audio",    "audios"),
    "application/pdf":  ("document", "documents"),
}

# Allowed folder names — used to validate path parameters
ALLOWED_FOLDERS = {"images", "videos", "audios", "documents", "voice"}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

BASE_URL = settings.BASE_URL


class MediaUploadResponse(BaseModel):
    id: uuid.UUID
    media_url: str
    file_type: str
    file_size: int
    filename: str
    thumbnail_url: Optional[str] = None
    duration: Optional[int] = None


def _safe_resolve(folder: str, filename: str) -> Path:
    """
    Resolve the target path and verify it stays inside MEDIA_DIR.
    Raises HTTPException 400 on path traversal attempts.
    """
    if folder not in ALLOWED_FOLDERS:
        raise HTTPException(status_code=400, detail="Invalid folder")
    # Reject any path separators or dots in the filename component
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    resolved = (MEDIA_DIR / folder / filename).resolve()
    if not str(resolved).startswith(str(MEDIA_DIR)):
        raise HTTPException(status_code=400, detail="Path traversal detected")
    return resolved


@router.post("/upload", response_model=MediaUploadResponse)
@limiter.limit("20/minute", key_func=get_user_or_remote_address)
async def upload_media(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.size is not None and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")

    contents = await file.read()
    file_size = len(contents)

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")

    # Validate MIME type from the header (not the filename extension)
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")

    file_type, folder = ALLOWED_TYPES[content_type]
    folder_path = MEDIA_DIR / folder
    folder_path.mkdir(parents=True, exist_ok=True)

    # Generate a UUID-based filename — never trust the original name for storage
    original_suffix = Path(file.filename or "file").suffix.lower()
    # Whitelist safe extensions
    safe_suffixes = {".jpg", ".jpeg", ".png", ".gif", ".webp",
                     ".mp4", ".webm", ".mp3", ".ogg", ".wav",
                     ".pdf"}
    default_suffixes = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "video/mp4": ".mp4",
        "video/webm": ".webm",
        "audio/mpeg": ".mp3",
        "audio/ogg": ".ogg",
        "audio/wav": ".wav",
        "application/pdf": ".pdf",
    }
    suffix = original_suffix if original_suffix in safe_suffixes else default_suffixes[content_type]
    unique_name = f"{uuid.uuid4()}{suffix}"
    file_path = folder_path / unique_name

    # Async write — avoids blocking the event loop
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(contents)

    file_url = f"{BASE_URL}/media/{folder}/{unique_name}"
    thumbnail_url = file_url if file_type == "image" else None

    media = MediaUpload(
        uploaded_by_id=current_user.id,
        file_name=unique_name,
        file_type=file_type,
        mime_type=content_type,
        file_size=file_size,
        file_url=file_url,
        thumbnail_url=thumbnail_url,
        file_path=str(file_path),
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    return MediaUploadResponse(
        id=media.id,
        media_url=media.file_url,
        file_type=media.file_type,
        file_size=media.file_size,
        filename=media.file_name,
        thumbnail_url=media.thumbnail_url,
    )


@router.post("/voice", response_model=MediaUploadResponse)
async def upload_voice_note(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contents = await file.read()
    file_size = len(contents)

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Empty voice note")

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Voice note too large")

    content_type = (file.content_type or "").split(";")[0].strip().lower()
    
    # We allow standard audio types from MediaRecorder
    allowed_voice_types = {"audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"}
    if content_type not in allowed_voice_types and not content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail=f"Unsupported voice type: {content_type}")

    folder_path = MEDIA_DIR / "voice"
    folder_path.mkdir(parents=True, exist_ok=True)

    original_suffix = Path(file.filename or "voice").suffix.lower()
    safe_suffixes = {".webm", ".ogg", ".mp4", ".mp3", ".wav"}
    suffix = original_suffix if original_suffix in safe_suffixes else ".webm"
    unique_name = f"voice_{uuid.uuid4()}{suffix}"
    file_path = folder_path / unique_name

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(contents)

    file_url = f"{BASE_URL}/media/voice/{unique_name}"

    media = MediaUpload(
        uploaded_by_id=current_user.id,
        file_name=unique_name,
        file_type="audio",
        mime_type=content_type,
        file_size=file_size,
        file_url=file_url,
        file_path=str(file_path),
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    return MediaUploadResponse(
        id=media.id,
        media_url=media.file_url,
        file_type=media.file_type,
        file_size=media.file_size,
        filename=media.file_name,
    )


@router.delete("/{folder}/{filename}", status_code=204)
async def delete_media(
    folder: str,
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_path = _safe_resolve(folder, filename)

    media = db.query(MediaUpload).filter(
        MediaUpload.file_path == str(file_path)
    ).first()

    if not media:
        raise HTTPException(status_code=404, detail="Media record not found")

    # Ownership check — only uploader can delete
    if str(media.uploaded_by_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your file")

    db.delete(media)
    db.commit()

    if file_path.exists():
        os.remove(file_path)
