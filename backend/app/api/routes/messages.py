from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, exists
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user_model import User
from app.models.chat_model import ChatParticipant, Chat
from app.models.message_model import Message, StarredMessage, MessageDeletion
from app.models.reaction_model import MessageReaction
from app.schemas.message_schema import MessageCreate, MessageEdit, MessagePageResponse, MessageResponse
from app.websocket.manager import manager

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_participant_ids(db: Session, chat_id) -> list[str]:
    rows = db.query(ChatParticipant.user_id).filter(
        ChatParticipant.chat_id == chat_id
    ).all()
    return [str(r.user_id) for r in rows]


def _assert_participant(db: Session, chat_id, user_id):
    p = db.query(ChatParticipant).filter(
        ChatParticipant.chat_id == chat_id,
        ChatParticipant.user_id == user_id,
    ).first()
    if not p:
        raise HTTPException(status_code=403, detail="You are not in this chat")


# ─────────────────────────────────────────────────────────────────────────────
# POST /  — Send a message
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/", response_model=MessageResponse)
async def send_message(
    request: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not request.content and not request.media_url:
        raise HTTPException(status_code=400, detail="Message must have content or media")

    _assert_participant(db, request.chat_id, current_user.id)

    # Validate reply target exists in the same chat
    if request.reply_to_message_id:
        parent = db.query(Message).filter(
            Message.id == request.reply_to_message_id,
            Message.chat_id == request.chat_id,
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Replied-to message not found in this chat")

    new_message = Message(
        chat_id=request.chat_id,
        sender_id=current_user.id,
        content=request.content,
        message_type=request.message_type,
        media_url=request.media_url,
        thumbnail_url=request.thumbnail_url,
        file_size=request.file_size,
        duration=request.duration,
        media_id=request.media_id,
        caption=request.caption,
        reply_to_message_id=request.reply_to_message_id,
    )
    db.add(new_message)

    chat = db.query(Chat).filter(Chat.id == request.chat_id).first()
    if chat:
        chat.updated_at = new_message.created_at

    db.commit()
    db.refresh(new_message)

    # Build reply preview for broadcast payload
    reply_preview = None
    if new_message.reply_to_message_id:
        parent = db.query(Message).filter(Message.id == new_message.reply_to_message_id).first()
        if parent:
            reply_preview = {
                "id": str(parent.id),
                "content": parent.content,
                "sender_id": str(parent.sender_id) if parent.sender_id else None,
                "message_type": parent.message_type,
            }

    message_data = {
        "type": "new_message",
        "id": str(new_message.id),
        "chat_id": str(new_message.chat_id),
        "sender_id": str(new_message.sender_id),
        "sender_name": current_user.username or current_user.phone,
        "sender_pic": current_user.profile_pic,
        "content": new_message.content,
        "message_type": new_message.message_type,
        "media_url": new_message.media_url,
        "thumbnail_url": new_message.thumbnail_url,
        "file_size": new_message.file_size,
        "duration": new_message.duration,
        "media_id": str(new_message.media_id) if new_message.media_id else None,
        "caption": new_message.caption,
        "reply_to_message_id": str(new_message.reply_to_message_id) if new_message.reply_to_message_id else None,
        "replied_message": reply_preview,
        "status": new_message.status,
        "is_edited": False,
        "is_deleted": False,
        "is_deleted_for_everyone": False,
        "created_at": new_message.created_at.isoformat(),
    }

    participant_ids = _get_participant_ids(db, request.chat_id)
    await manager.broadcast_to_chat(
        message_data,
        participant_ids,
        exclude_user_id=str(current_user.id),
    )

    # Delivery receipts (direct chats only): if the other user is currently online,
    # promote status from "sent" → "delivered" for the sender's UI.
    if chat and not chat.is_group and new_message.status == "sent":
        other_ids = [uid for uid in participant_ids if uid != str(current_user.id)]
        if other_ids and await manager.is_online(other_ids[0]):
            new_message.status = "delivered"
            db.commit()
            db.refresh(new_message)

    # Eagerly load replied_message for the response
    db.refresh(new_message)
    return new_message


# ─────────────────────────────────────────────────────────────────────────────
# GET /{chat_id}  — Fetch messages for a chat
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/{chat_id}", response_model=MessagePageResponse)
def get_messages(
    chat_id: UUID,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_participant(db, chat_id, current_user.id)

    deleted_for_me = exists().where(and_(
        MessageDeletion.message_id == Message.id,
        MessageDeletion.user_id == current_user.id,
    ))

    base_query = (
        db.query(Message)
        .options(
            joinedload(Message.replied_message),
            joinedload(Message.reactions).joinedload(MessageReaction.user),
        )
        .filter(Message.chat_id == chat_id)
        .filter(~deleted_for_me)
    )
    total = base_query.count()
    offset = (page - 1) * limit
    messages = (
        base_query
        .order_by(Message.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    messages.reverse()
    return {
        "messages": messages,
        "total": total,
        "page": page,
        "has_more": offset + limit < total,
    }


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /{message_id}  — Edit a message
# ─────────────────────────────────────────────────────────────────────────────

@router.patch("/{message_id}", response_model=MessageResponse)
async def edit_message(
    message_id: UUID,
    body: MessageEdit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if str(message.sender_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Can only edit your own messages")
    if message.is_deleted or message.is_deleted_for_everyone:
        raise HTTPException(status_code=400, detail="Cannot edit a deleted message")
    if message.message_type != "text":
        raise HTTPException(status_code=400, detail="Only text messages can be edited")

    message.content = body.content.strip()
    message.is_edited = True
    message.edited_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(message)

    participant_ids = _get_participant_ids(db, message.chat_id)
    await manager.broadcast_to_chat(
        {
            "type": "message_edited",
            "message_id": str(message_id),
            "chat_id": str(message.chat_id),
            "new_content": message.content,
            "edited_at": message.edited_at.isoformat(),
        },
        participant_ids,
    )

    return message


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /{message_id}  — Delete a message
# ─────────────────────────────────────────────────────────────────────────────

@router.delete("/{message_id}")
async def delete_message(
    message_id: UUID,
    delete_for_everyone: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Delete for everyone (WhatsApp semantics): only the sender can do this.
    if delete_for_everyone:
        if str(message.sender_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Can only delete for everyone if you sent the message")

        message.is_deleted_for_everyone = True
        message.deleted_at = datetime.now(timezone.utc)
        message.content = "This message was deleted"
        message.media_url = None
        message.thumbnail_url = None
        db.commit()

        participant_ids = _get_participant_ids(db, message.chat_id)
        await manager.broadcast_to_chat(
            {
                "type": "message_deleted",
                "message_id": str(message_id),
                "chat_id": str(message.chat_id),
            },
            participant_ids,
        )

        return {"message": "Deleted for everyone"}

    # Delete for me: any chat participant can hide a message from their own view.
    _assert_participant(db, message.chat_id, current_user.id)
    existing = db.query(MessageDeletion).filter(
        MessageDeletion.user_id == current_user.id,
        MessageDeletion.message_id == message_id,
    ).first()
    if not existing:
        db.add(MessageDeletion(user_id=current_user.id, message_id=message_id))
        db.commit()

    return {"message": "Deleted for me"}


# ─────────────────────────────────────────────────────────────────────────────
# POST /{message_id}/star  — Star / unstar a message
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/{message_id}/star")
def star_message(
    message_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    existing = db.query(StarredMessage).filter(
        StarredMessage.user_id == current_user.id,
        StarredMessage.message_id == message_id,
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"starred": False}

    db.add(StarredMessage(user_id=current_user.id, message_id=message_id))
    db.commit()
    return {"starred": True}


# ─────────────────────────────────────────────────────────────────────────────
# GET /starred/list  — Get all starred messages for current user
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/starred/list", response_model=List[MessageResponse])
def get_starred_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    starred_ids = db.query(StarredMessage.message_id).filter(
        StarredMessage.user_id == current_user.id
    ).all()
    ids = [r.message_id for r in starred_ids]
    if not ids:
        return []
    messages = (
        db.query(Message)
        .options(
            joinedload(Message.replied_message),
            joinedload(Message.reactions).joinedload(MessageReaction.user),
        )
        .filter(Message.id.in_(ids))
        .filter(~exists().where(and_(
            MessageDeletion.message_id == Message.id,
            MessageDeletion.user_id == current_user.id,
        )))
        .order_by(Message.created_at.desc())
        .all()
    )
    return messages
