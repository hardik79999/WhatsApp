from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user_model import User
from app.models.chat_model import ChatParticipant, Chat
from app.models.message_model import Message
from app.schemas.message_schema import MessageCreate, MessageResponse
from app.websocket.manager import manager

router = APIRouter()


def _get_participant_ids(db: Session, chat_id) -> list[str]:
    rows = db.query(ChatParticipant.user_id).filter(
        ChatParticipant.chat_id == chat_id
    ).all()
    return [str(r.user_id) for r in rows]


@router.post("/", response_model=MessageResponse)
async def send_message(
    request: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not request.content and not request.media_url:
        raise HTTPException(status_code=400, detail="Message must have content or media")

    participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_id == request.chat_id,
        ChatParticipant.user_id == current_user.id
    ).first()

    if not participant:
        raise HTTPException(status_code=403, detail="You are not in this chat")

    new_message = Message(
        chat_id=request.chat_id,
        sender_id=current_user.id,
        content=request.content,
        message_type=request.message_type,
        media_url=request.media_url,
        thumbnail_url=request.thumbnail_url,
        file_size=request.file_size,
        duration=request.duration,
        reply_to_message_id=request.reply_to_message_id,
    )
    db.add(new_message)

    chat = db.query(Chat).filter(Chat.id == request.chat_id).first()
    if chat:
        chat.updated_at = new_message.created_at

    db.commit()
    db.refresh(new_message)

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
        "reply_to_message_id": str(new_message.reply_to_message_id) if new_message.reply_to_message_id else None,
        "status": new_message.status,
        "is_deleted": new_message.is_deleted,
        "created_at": new_message.created_at.isoformat(),
    }

    # ✅ Uses broadcast_to_chat — works for both DMs and groups
    participant_ids = _get_participant_ids(db, request.chat_id)
    await manager.broadcast_to_chat(
        message_data,
        participant_ids,
        exclude_user_id=str(current_user.id)
    )

    return new_message


@router.get("/{chat_id}", response_model=List[MessageResponse])
def get_messages(
    chat_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_id == chat_id,
        ChatParticipant.user_id == current_user.id
    ).first()

    if not participant:
        raise HTTPException(status_code=403, detail="Access denied")

    messages = db.query(Message).filter(
        Message.chat_id == chat_id,
        Message.is_deleted == False
    ).order_by(Message.created_at.asc()).all()
    return messages


@router.delete("/{message_id}")
async def delete_message(
    message_id: UUID,
    delete_for_everyone: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if str(message.sender_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Can only delete your own messages")

    message.is_deleted = True
    message.content = None
    message.media_url = None
    db.commit()

    if delete_for_everyone:
        participant_ids = _get_participant_ids(db, message.chat_id)
        await manager.broadcast_to_chat(
            {"type": "message_deleted", "message_id": str(message_id), "chat_id": str(message.chat_id)},
            participant_ids
        )

    return {"message": "Deleted"}