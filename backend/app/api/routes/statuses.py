from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timezone, timedelta
 
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user_model import User
from app.models.status_model import Status, StatusView
from app.models.contact_model import Contact
from app.schemas.status_schema import (
    StatusCreate, StatusResponse, ContactStatusGroup, StatusViewerResponse
)
 
router = APIRouter()
 
 
def _build_status_response(
    status_obj: Status,
    db: Session,
    current_user_id,
    include_viewers: bool = False
) -> StatusResponse:
    """Helper: turn a Status ORM object into a StatusResponse."""
    owner = db.query(User).filter(User.id == status_obj.user_id).first()
 
    view_count = len(status_obj.views)
 
    is_viewed = any(
        str(v.viewer_id) == str(current_user_id)
        for v in status_obj.views
    )
 
    viewers = None
    if include_viewers:
        viewers = []
        for v in status_obj.views:
            viewer_user = db.query(User).filter(User.id == v.viewer_id).first()
            viewers.append(StatusViewerResponse(
                viewer_id=v.viewer_id,
                username=viewer_user.username if viewer_user else None,
                profile_pic=viewer_user.profile_pic if viewer_user else None,
                viewed_at=v.viewed_at,
            ))
 
    return StatusResponse(
        id=status_obj.id,
        user_id=status_obj.user_id,
        username=owner.username if owner else None,
        profile_pic=owner.profile_pic if owner else None,
        content=status_obj.content,
        media_url=status_obj.media_url,
        thumbnail_url=status_obj.thumbnail_url,
        background_color=getattr(status_obj, "background_color", "#1a1a2e"),
        expires_at=status_obj.expires_at,
        created_at=status_obj.created_at,
        view_count=view_count,
        is_viewed=is_viewed,
        viewers=viewers,
    )
 
 
# ─────────────────────────────────────────────────────────────
# POST /  →  Create a new status (24-hour expiry)
# ─────────────────────────────────────────────────────────────
@router.post("/", response_model=StatusResponse, status_code=status.HTTP_201_CREATED)
def create_status(
    request: StatusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not request.content and not request.media_url:
        raise HTTPException(
            status_code=400,
            detail="Status must have either text content or media"
        )
 
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
 
    new_status = Status(
        user_id=current_user.id,
        content=request.content,
        media_url=request.media_url,
        thumbnail_url=request.thumbnail_url,
        expires_at=expires_at,
    )
    # Store background_color if the column exists (add via migration if needed)
    if hasattr(new_status, "background_color"):
        new_status.background_color = request.background_color
 
    db.add(new_status)
    db.commit()
    db.refresh(new_status)
 
    return _build_status_response(new_status, db, current_user.id, include_viewers=True)
 
 
# ─────────────────────────────────────────────────────────────
# GET /my  →  Current user's own statuses (with viewer list)
# ─────────────────────────────────────────────────────────────
@router.get("/my", response_model=List[StatusResponse])
def get_my_statuses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    statuses = (
        db.query(Status)
        .filter(Status.user_id == current_user.id, Status.expires_at > now)
        .order_by(Status.created_at.asc())
        .all()
    )
    return [
        _build_status_response(s, db, current_user.id, include_viewers=True)
        for s in statuses
    ]
 
 
# ─────────────────────────────────────────────────────────────
# GET /  →  All statuses from contacts, grouped by user
# ─────────────────────────────────────────────────────────────
@router.get("/", response_model=List[ContactStatusGroup])
def get_contact_statuses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
 
    # Get IDs of all contacts of current user
    contact_rows = (
        db.query(Contact.contact_id)
        .filter(Contact.user_id == current_user.id)
        .all()
    )
    contact_ids = [row.contact_id for row in contact_rows]
 
    if not contact_ids:
        return []
 
    # Fetch all non-expired statuses belonging to those contacts
    all_statuses = (
        db.query(Status)
        .filter(Status.user_id.in_(contact_ids), Status.expires_at > now)
        .order_by(Status.created_at.asc())
        .all()
    )
 
    # Group by user_id
    grouped: dict = {}
    for s in all_statuses:
        uid = str(s.user_id)
        if uid not in grouped:
            grouped[uid] = []
        grouped[uid].append(s)
 
    result = []
    for uid, statuses_list in grouped.items():
        owner = db.query(User).filter(User.id == uid).first()
        status_responses = [
            _build_status_response(s, db, current_user.id)
            for s in statuses_list
        ]
        has_unviewed = any(not sr.is_viewed for sr in status_responses)
        result.append(ContactStatusGroup(
            user_id=statuses_list[0].user_id,
            username=owner.username if owner else None,
            profile_pic=owner.profile_pic if owner else None,
            has_unviewed=has_unviewed,
            statuses=status_responses,
        ))
 
    # Sort: unviewed contacts first
    result.sort(key=lambda g: (not g.has_unviewed, g.statuses[0].created_at))
    return result
 
 
# ─────────────────────────────────────────────────────────────
# POST /{status_id}/view  →  Mark a status as viewed
# ─────────────────────────────────────────────────────────────
@router.post("/{status_id}/view", status_code=status.HTTP_200_OK)
def view_status(
    status_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    status_obj = db.query(Status).filter(
        Status.id == status_id,
        Status.expires_at > now
    ).first()
 
    if not status_obj:
        raise HTTPException(status_code=404, detail="Status not found or expired")
 
    # Don't record a view on your own status
    if str(status_obj.user_id) == str(current_user.id):
        return {"message": "own status"}
 
    existing = db.query(StatusView).filter(
        StatusView.status_id == status_id,
        StatusView.viewer_id == current_user.id
    ).first()
 
    if not existing:
        view = StatusView(status_id=status_id, viewer_id=current_user.id)
        db.add(view)
        db.commit()
 
    return {"message": "viewed"}
 
 
# ─────────────────────────────────────────────────────────────
# DELETE /{status_id}  →  Delete own status
# ─────────────────────────────────────────────────────────────
@router.delete("/{status_id}", status_code=status.HTTP_200_OK)
def delete_status(
    status_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    status_obj = db.query(Status).filter(Status.id == status_id).first()
 
    if not status_obj:
        raise HTTPException(status_code=404, detail="Status not found")
 
    if str(status_obj.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Cannot delete someone else's status")
 
    db.delete(status_obj)
    db.commit()
    return {"message": "Status deleted"}