from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user_model import User
from app.models.chat_model import Chat, ChatParticipant
from app.models.message_model import Message
from app.schemas.chat_schema import ChatCreate, ChatResponse, ChatParticipantResponse, GroupChatCreate

router = APIRouter()

# Helper function: Chat object ko properly format karne ke liye
def format_chat_response(chat: Chat, db: Session, current_user_id=None):
    participants = []
    chat_parts = db.query(ChatParticipant).filter(ChatParticipant.chat_id == chat.id).all()
    
    for cp in chat_parts:
        user = db.query(User).filter(User.id == cp.user_id).first()
        if user:
            participants.append(ChatParticipantResponse(
                user_id=user.id,
                phone=user.phone,
                username=user.username,
                profile_pic=user.profile_pic,
                role=cp.role,
                is_online=user.is_online
            ))

    # Last message
    last_msg = db.query(Message).filter(
        Message.chat_id == chat.id,
        Message.is_deleted == False
    ).order_by(Message.created_at.desc()).first()

    last_message_data = None
    if last_msg:
        last_message_data = {
            "id": str(last_msg.id),
            "content": last_msg.content,
            "message_type": last_msg.message_type,
            "sender_id": str(last_msg.sender_id),
            "status": last_msg.status,
            "created_at": last_msg.created_at.isoformat() if last_msg.created_at else None,
        }

    # Unread count — messages not sent by current user with status != 'read'
    unread_count = 0
    if current_user_id:
        unread_count = db.query(func.count(Message.id)).filter(
            Message.chat_id == chat.id,
            Message.sender_id != current_user_id,
            Message.status != 'read',
            Message.is_deleted == False
        ).scalar() or 0

    return ChatResponse(
        id=chat.id,
        is_group=chat.is_group,
        group_name=chat.group_name,
        group_picture=chat.group_picture,
        group_description=chat.group_description,
        created_by=chat.created_by,
        updated_at=chat.updated_at or chat.created_at or datetime.now(timezone.utc),
        participants=participants,
        last_message=last_message_data,
        unread_count=unread_count,
    )

@router.post("/", response_model=ChatResponse)
def create_or_get_direct_chat(
    request: ChatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if str(current_user.id) == str(request.contact_id):
        raise HTTPException(status_code=400, detail="Tum khud se chat nahi kar sakte!")

    # 1. Check karo dusra user exist karta hai ya nahi
    other_user = db.query(User).filter(User.id == request.contact_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User nahi mila")

    # 2. Check karo ki kya dono ke beech pehle se koi 1-on-1 chat hai
    my_chat_ids = select(ChatParticipant.chat_id).where(ChatParticipant.user_id == current_user.id)
    
    existing_chat = db.query(Chat).join(ChatParticipant, Chat.id == ChatParticipant.chat_id).filter(
        Chat.id.in_(my_chat_ids),
        ChatParticipant.user_id == request.contact_id,
        Chat.is_group == False
    ).first()

    if existing_chat:
        return format_chat_response(existing_chat, db, current_user.id)

    # 3. Agar chat nahi hai, toh Nayi Chat banao
    new_chat = Chat(is_group=False, updated_at=datetime.now(timezone.utc))
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)

    # 4. Dono users ko is chat me add karo (Participants)
    p1 = ChatParticipant(chat_id=new_chat.id, user_id=current_user.id)
    p2 = ChatParticipant(chat_id=new_chat.id, user_id=request.contact_id)
    db.add_all([p1, p2])
    db.commit()

    return format_chat_response(new_chat, db, current_user.id)

@router.post("/group", response_model=ChatResponse)
def create_group_chat(
    request: GroupChatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Group chat banane ke liye endpoint
    """
    # Validate: Kam se kam 2 participants hone chahiye (creator ke alawa)
    if not request.participant_ids or len(request.participant_ids) < 1:
        raise HTTPException(
            status_code=400, 
            detail="Group mein kam se kam 2 members hone chahiye (aap + 1 aur)"
        )
    
    # Validate: Group name required hai
    if not request.group_name or not request.group_name.strip():
        raise HTTPException(status_code=400, detail="Group name zaroori hai")
    
    # Check karo saare participants exist karte hain
    for participant_id in request.participant_ids:
        user = db.query(User).filter(User.id == participant_id).first()
        if not user:
            raise HTTPException(
                status_code=404, 
                detail=f"User with ID {participant_id} nahi mila"
            )
    
    # Naya group chat banao
    new_group = Chat(
        is_group=True,
        group_name=request.group_name.strip(),
        group_description=request.group_description,
        group_picture=request.group_picture,
        created_by=current_user.id,
        updated_at=datetime.now(timezone.utc)
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    
    # Creator ko admin ke role ke sath add karo
    creator_participant = ChatParticipant(
        chat_id=new_group.id,
        user_id=current_user.id,
        role="admin"
    )
    db.add(creator_participant)
    
    # Baaki saare participants ko member ke role ke sath add karo
    for participant_id in request.participant_ids:
        if str(participant_id) != str(current_user.id):  # Creator ko dobara add mat karo
            participant = ChatParticipant(
                chat_id=new_group.id,
                user_id=participant_id,
                role="member"
            )
            db.add(participant)
    
    db.commit()
    
    return format_chat_response(new_group, db, current_user.id)

@router.get("/", response_model=List[ChatResponse])
def get_my_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    my_chat_ids = select(ChatParticipant.chat_id).where(ChatParticipant.user_id == current_user.id)
    chats = db.query(Chat).filter(Chat.id.in_(my_chat_ids)).order_by(Chat.updated_at.desc().nullslast()).all()
    return [format_chat_response(chat, db, current_user.id) for chat in chats]

@router.get("/{chat_id}", response_model=ChatResponse)
def get_chat_details(
    chat_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    participant = db.query(ChatParticipant).filter(
        ChatParticipant.chat_id == chat_id,
        ChatParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=403, detail="Tum is chat ka hissa nahi ho")
    
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat nahi mila")
    
    return format_chat_response(chat, db, current_user.id)

# Group mein naye log add karne ke liye (Admin only)
@router.post("/{chat_id}/participants")
def add_member(
    chat_id: UUID,
    user_to_add: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if current user is admin
    admin_check = db.query(ChatParticipant).filter(
        ChatParticipant.chat_id == chat_id, 
        ChatParticipant.user_id == current_user.id,
        ChatParticipant.role == "admin"
    ).first()
    
    if not admin_check:
        raise HTTPException(status_code=403, detail="Sirf admin hi naye members add kar sakta hai")

    # Check if user is already a member
    existing_member = db.query(ChatParticipant).filter(
        ChatParticipant.chat_id == chat_id,
        ChatParticipant.user_id == user_to_add
    ).first()
    
    if existing_member:
        return {"message": "Member is already in the group"}

    new_member = ChatParticipant(chat_id=chat_id, user_id=user_to_add, role="member")
    db.add(new_member)
    db.commit()
    return {"message": "Member added successfully"}