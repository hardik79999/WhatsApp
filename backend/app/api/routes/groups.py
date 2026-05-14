from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user_model import User
from app.models.chat_model import Chat, ChatParticipant
from app.models.group_model import GroupMember
from app.models.media_model import MediaUpload
from app.websocket.manager import manager

router = APIRouter()


# ── Permission helpers ────────────────────────────────────────────────────────

def _assert_group_member(db: Session, group_id: UUID, user_id: UUID) -> GroupMember:
    gm = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
    ).first()
    if not gm:
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    return gm


def _assert_group_admin(db: Session, group_id: UUID, user_id: UUID) -> GroupMember:
    gm = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
        GroupMember.role == "admin",
    ).first()
    if not gm:
        raise HTTPException(status_code=403, detail="Only admins can manage group members")
    return gm


# ── Schemas ───────────────────────────────────────────────────────────────────

class GroupCreateRequest(BaseModel):
    group_name: str
    group_description: Optional[str] = None
    group_pic_id: Optional[UUID] = None
    participant_ids: List[UUID]


class MemberIdsRequest(BaseModel):
    member_ids: List[UUID]


class GroupMemberResponse(BaseModel):
    user_id: UUID
    phone: str
    username: Optional[str] = None
    profile_pic: Optional[str] = None
    role: str
    joined_at: Optional[str] = None

    class Config:
        from_attributes = True


# ── POST /create ──────────────────────────────────────────────────────────────

@router.post("/create")
def create_group(
    payload: GroupCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.group_name.strip():
        raise HTTPException(status_code=400, detail="Group name is required")

    # Deduplicate and exclude creator from the list
    unique_ids = list({str(pid) for pid in payload.participant_ids
                       if str(pid) != str(current_user.id)})

    if not unique_ids:
        raise HTTPException(status_code=400, detail="Select at least one additional member")

    # Validate all participant users exist in one query
    users = db.query(User).filter(User.id.in_(unique_ids)).all()
    if len(users) != len(unique_ids):
        raise HTTPException(status_code=404, detail="One or more users not found")

    # Validate group avatar if provided
    if payload.group_pic_id:
        media = db.query(MediaUpload).filter(MediaUpload.id == payload.group_pic_id).first()
        if not media:
            raise HTTPException(status_code=404, detail="Group avatar media not found")

    new_group = Chat(
        is_group=True,
        group_name=payload.group_name.strip(),
        group_description=payload.group_description,
        group_pic_id=payload.group_pic_id,
        created_by=current_user.id,
        group_created_by_id=current_user.id,
        updated_at=datetime.now(timezone.utc),
    )
    db.add(new_group)
    db.flush()  # get new_group.id without committing

    # Add creator as admin in both tables
    db.add(ChatParticipant(chat_id=new_group.id, user_id=current_user.id, role="admin"))
    db.add(GroupMember(group_id=new_group.id, user_id=current_user.id, role="admin"))

    # Add members
    for uid in unique_ids:
        db.add(ChatParticipant(chat_id=new_group.id, user_id=uid, role="member"))
        db.add(GroupMember(group_id=new_group.id, user_id=uid, role="member"))

    db.commit()
    db.refresh(new_group)

    return {
        "id": str(new_group.id),
        "group_name": new_group.group_name,
        "group_description": new_group.group_description,
        "group_pic_id": str(new_group.group_pic_id) if new_group.group_pic_id else None,
        "created_by": str(new_group.group_created_by_id),
        "is_group": True,
    }


# ── POST /{group_id}/add-members ──────────────────────────────────────────────

@router.post("/{group_id}/add-members")
async def add_members(
    group_id: UUID,
    body: MemberIdsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_group_admin(db, group_id, current_user.id)

    group = db.query(Chat).filter(Chat.id == group_id, Chat.is_group == True).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if not body.member_ids:
        raise HTTPException(status_code=400, detail="No member IDs provided")

    # Validate users exist
    users = db.query(User).filter(User.id.in_([str(m) for m in body.member_ids])).all()
    found_ids = {str(u.id) for u in users}

    # Existing members — avoid duplicates
    existing = {
        str(r.user_id)
        for r in db.query(ChatParticipant.user_id).filter(
            ChatParticipant.chat_id == group_id
        ).all()
    }

    added = []
    for member_id in body.member_ids:
        sid = str(member_id)
        if sid not in found_ids:
            continue  # skip unknown users silently
        if sid in existing:
            continue  # already a member

        db.add(ChatParticipant(chat_id=group_id, user_id=member_id, role="member"))
        db.add(GroupMember(group_id=group_id, user_id=member_id, role="member"))
        added.append(sid)

    if added:
        db.commit()
        all_member_ids = [
            str(r.user_id)
            for r in db.query(ChatParticipant.user_id).filter(
                ChatParticipant.chat_id == group_id
            ).all()
        ]
        await manager.broadcast_to_chat(
            {
                "type": "group_members_added",
                "group_id": str(group_id),
                "added_ids": added,
                "actor_id": str(current_user.id),
            },
            all_member_ids,
        )

    return {"added": added, "skipped_already_member": len(body.member_ids) - len(added)}


# ── DELETE /{group_id}/remove-member/{member_id} ──────────────────────────────

@router.delete("/{group_id}/remove-member/{member_id}")
async def remove_member(
    group_id: UUID,
    member_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_self = str(member_id) == str(current_user.id)

    if not is_self:
        _assert_group_admin(db, group_id, current_user.id)

    # Prevent removing the last admin
    if not is_self:
        target_gm = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == member_id,
        ).first()
        if target_gm and target_gm.role == "admin":
            admin_count = db.query(GroupMember).filter(
                GroupMember.group_id == group_id,
                GroupMember.role == "admin",
            ).count()
            if admin_count <= 1:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot remove the last admin. Promote another member first.",
                )

    # Remove from chat_participants
    cp = db.query(ChatParticipant).filter(
        ChatParticipant.chat_id == group_id,
        ChatParticipant.user_id == member_id,
    ).first()
    if not cp:
        raise HTTPException(status_code=404, detail="Member not found in this group")
    db.delete(cp)

    # Remove from group_members
    gm = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == member_id,
    ).first()
    if gm:
        db.delete(gm)

    db.commit()

    # Broadcast to remaining members
    remaining_ids = [
        str(r.user_id)
        for r in db.query(ChatParticipant.user_id).filter(
            ChatParticipant.chat_id == group_id
        ).all()
    ]
    await manager.broadcast_to_chat(
        {
            "type": "group_member_removed",
            "group_id": str(group_id),
            "removed_id": str(member_id),
            "actor_id": str(current_user.id),
        },
        remaining_ids,
    )

    return {"removed_id": str(member_id)}


# ── GET /{group_id}/members ───────────────────────────────────────────────────

@router.get("/{group_id}/members", response_model=List[GroupMemberResponse])
def list_members(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_group_member(db, group_id, current_user.id)

    # Single query with join — avoids N+1
    members = (
        db.query(GroupMember)
        .options(joinedload(GroupMember.user))
        .filter(GroupMember.group_id == group_id)
        .all()
    )

    return [
        GroupMemberResponse(
            user_id=gm.user.id,
            phone=gm.user.phone,
            username=gm.user.username,
            profile_pic=gm.user.profile_pic,
            role=gm.role,
            joined_at=gm.joined_at.isoformat() if gm.joined_at else None,
        )
        for gm in members
        if gm.user  # guard against SET NULL orphans
    ]
