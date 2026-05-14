from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import os
from pathlib import Path

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user_model import User

router = APIRouter()

# Media storage directory
MEDIA_DIR = Path("media")
MEDIA_DIR.mkdir(exist_ok=True)

# Allowed file types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/ogg"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/ogg", "audio/wav", "audio/webm"}
ALLOWED_DOCUMENT_TYPES = {"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload media file (image, video, audio, or document)
    """
    # Check file size
    contents = await file.read()
    file_size = len(contents)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB")
    
    # Determine file type
    content_type = file.content_type
    if content_type in ALLOWED_IMAGE_TYPES:
        media_type = "image"
        folder = "images"
    elif content_type in ALLOWED_VIDEO_TYPES:
        media_type = "video"
        folder = "videos"
    elif content_type in ALLOWED_AUDIO_TYPES:
        media_type = "audio"
        folder = "audios"
    elif content_type in ALLOWED_DOCUMENT_TYPES:
        media_type = "document"
        folder = "documents"
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    # Create folder if it doesn't exist
    folder_path = MEDIA_DIR / folder
    folder_path.mkdir(exist_ok=True)
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = folder_path / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Generate URL (in production, this would be your CDN URL)
    media_url = f"/media/{folder}/{unique_filename}"
    
    return {
        "media_url": media_url,
        "media_type": media_type,
        "file_size": file_size,
        "filename": file.filename
    }

@router.delete("/{folder}/{filename}")
async def delete_media(
    folder: str,
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a media file
    """
    file_path = MEDIA_DIR / folder / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        os.remove(file_path)
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
