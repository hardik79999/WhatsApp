from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user_model import User
from app.models.reaction_model import MessageReaction
from app.models.message_model import Message
from app.models.chat_model import ChatParticipant
from app.websocket.manager import manager

router = APIRouter()

class ReactionCreate(BaseModel):
    message_id: UUID
    reaction: str  # Emoji

class ReactionResponse(BaseModel):
    id: UUID
    message_id: UUID
    user_id: UUID
    reaction: str
    username: str
    
    class Config:
        from_attributes = True

@router.post("/", response_model=ReactionResponse)
async def add_reaction(
    request: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add or update a reaction to a message
    """
    # Check if message exists
    message = db.query(Message).filter(Message.id == request.message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Permission: user must be a participant of the message's chat
    is_participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_id == message.chat_id,
        ChatParticipant.user_id == current_user.id,
    ).first()
    if not is_participant:
        raise HTTPException(status_code=403, detail="You are not in this chat")
    
    # Check if user already reacted
    existing_reaction = db.query(MessageReaction).filter(
        MessageReaction.message_id == request.message_id,
        MessageReaction.user_id == current_user.id
    ).first()
    
    if existing_reaction:
        # Update existing reaction
        existing_reaction.reaction = request.reaction
        db.commit()
        db.refresh(existing_reaction)
        reaction = existing_reaction
    else:
        # Create new reaction
        new_reaction = MessageReaction(
            message_id=request.message_id,
            user_id=current_user.id,
            reaction=request.reaction
        )
        db.add(new_reaction)
        db.commit()
        db.refresh(new_reaction)
        reaction = new_reaction
    
    participant_ids = [
        str(r.user_id)
        for r in db.query(ChatParticipant.user_id).filter(
            ChatParticipant.chat_id == message.chat_id
        ).all()
    ]

    # Broadcast reaction only to chat participants
    await manager.broadcast_to_chat(
        {
            "type": "message_reaction",
            "message_id": str(request.message_id),
            "user_id": str(current_user.id),
            "username": current_user.username or current_user.phone,
            "reaction": request.reaction,
            "chat_id": str(message.chat_id),
        },
        participant_ids,
    )
    
    return {
        "id": reaction.id,
        "message_id": reaction.message_id,
        "user_id": reaction.user_id,
        "reaction": reaction.reaction,
        "username": current_user.username
    }

@router.delete("/{message_id}")
async def remove_reaction(
    message_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a reaction from a message
    """
    reaction = db.query(MessageReaction).filter(
        MessageReaction.message_id == message_id,
        MessageReaction.user_id == current_user.id
    ).first()
    
    if not reaction:
        raise HTTPException(status_code=404, detail="Reaction not found")
    
    message = db.query(Message).filter(Message.id == message_id).first()

    if message:
        is_participant = db.query(ChatParticipant).filter(
            ChatParticipant.chat_id == message.chat_id,
            ChatParticipant.user_id == current_user.id,
        ).first()
        if not is_participant:
            raise HTTPException(status_code=403, detail="You are not in this chat")
    
    db.delete(reaction)
    db.commit()
    
    participant_ids = []
    if message:
        participant_ids = [
            str(r.user_id)
            for r in db.query(ChatParticipant.user_id).filter(
                ChatParticipant.chat_id == message.chat_id
            ).all()
        ]

    # Broadcast reaction removal only to chat participants
    if participant_ids:
        await manager.broadcast_to_chat(
            {
                "type": "message_reaction_removed",
                "message_id": str(message_id),
                "user_id": str(current_user.id),
                "chat_id": str(message.chat_id),
            },
            participant_ids,
        )
    
    return {"message": "Reaction removed"}

@router.get("/{message_id}", response_model=List[ReactionResponse])
def get_message_reactions(
    message_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all reactions for a message
    """
    # Permission: current user must be a participant of the message's chat
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    is_participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_id == msg.chat_id,
        ChatParticipant.user_id == current_user.id,
    ).first()
    if not is_participant:
        raise HTTPException(status_code=403, detail="You are not in this chat")

    reactions = db.query(MessageReaction).filter(
        MessageReaction.message_id == message_id
    ).all()
    
    result = []
    for reaction in reactions:
        user = db.query(User).filter(User.id == reaction.user_id).first()
        result.append({
            "id": reaction.id,
            "message_id": reaction.message_id,
            "user_id": reaction.user_id,
            "reaction": reaction.reaction,
            "username": user.username if user else "Unknown"
        })
    
    return result
