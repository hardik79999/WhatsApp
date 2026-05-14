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

# 1. Naya message bhejna
@router.post("/", response_model=MessageResponse)
async def send_message(  # <-- Yahan 'async' add kiya
    request: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_id == request.chat_id,
        ChatParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=403, detail="Tum is chat ka hissa nahi ho!")

    # Message Database mein save kiya
    new_message = Message(
        chat_id=request.chat_id,
        sender_id=current_user.id,
        content=request.content,
        message_type=request.message_type
    )
    db.add(new_message)
    
    chat = db.query(Chat).filter(Chat.id == request.chat_id).first()
    if chat:
        chat.updated_at = new_message.created_at
        
    db.commit()
    db.refresh(new_message)
    
    # ======== WEBSOCKET MAGIC START ========
    message_data = {
        "type": "new_message", # <--- YE LINE NAYI ADD KARNI HAI
        "id": str(new_message.id),
        "chat_id": str(new_message.chat_id),
        "sender_id": str(new_message.sender_id),
        "content": new_message.content,
        "message_type": new_message.message_type,
        "created_at": new_message.created_at.isoformat()
    }
    
    # Is chat ke saare logo ko dhundo
    chat_participants = db.query(ChatParticipant).filter(ChatParticipant.chat_id == request.chat_id).all()
    for p in chat_participants:
        if str(p.user_id) != str(current_user.id):
            # Samne wale user ko message PUSH kardo
            await manager.send_personal_message(message_data, str(p.user_id))
    # ======== WEBSOCKET MAGIC END ========

    return new_message

# 2. Kisi chat ke purane messages fetch karna
@router.get("/{chat_id}", response_model=List[MessageResponse])
def get_messages(
    chat_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Phirse check karo ki user is chat me hai ya nahi
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_id == chat_id,
        ChatParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=403, detail="Access denied")

    # Messages nikalo aur time ke hisaab se sort karo (Purane pehle, naye baad me)
    messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at.asc()).all()
    return messages