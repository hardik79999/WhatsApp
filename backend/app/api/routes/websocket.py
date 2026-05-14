import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import jwt, JWTError

from app.core.config import settings
from app.core.security import ALGORITHM
from app.websocket.manager import manager

from app.core.database import SessionLocal
from app.models.message_model import Message

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.cookies.get("access_token")
    if not token:
        await websocket.close(code=1008)
        return
        
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    # Connect user to WebSocket manager
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Frontend se JSON data aayega
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            
            # ======== EVENT: TYPING INDICATOR ========
            if data.get("type") == "typing":
                chat_id = data.get("chat_id")
                is_typing = data.get("is_typing", False)
                
                # Broadcast typing status to all chat participants
                await manager.broadcast({
                    "type": "typing",
                    "chat_id": chat_id,
                    "user_id": user_id,
                    "is_typing": is_typing
                })
            
            # ======== EVENT: MESSAGE READ (BLUE TICKS) ========
            elif data.get("type") == "mark_read":
                chat_id = data.get("chat_id")
                receiver_id = data.get("receiver_id")  # Jisne message bheja tha
                
                # Database session with proper cleanup
                db = SessionLocal()
                try:
                    # Only update messages where:
                    # 1. Chat matches
                    # 2. Sender is the other person (receiver_id)
                    # 3. Current user is NOT the sender (to avoid marking own messages as read)
                    # 4. Status is not already "read"
                    unread_msgs = db.query(Message).filter(
                        Message.chat_id == chat_id,
                        Message.sender_id == receiver_id,
                        Message.status != "read"
                    ).all()
                    
                    if unread_msgs:
                        for msg in unread_msgs:
                            msg.status = "read"
                        db.commit()
                        
                        # 2. Sender ko batao ki uske messages padh liye gaye hain
                        if receiver_id:
                            await manager.send_personal_message({
                                "type": "messages_read",
                                "chat_id": chat_id,
                                "reader_id": user_id
                            }, receiver_id)
                except Exception as e:
                    db.rollback()
                    print(f"Error marking messages as read: {e}")
                finally:
                    db.close()
                    
    except WebSocketDisconnect:
        # Safely disconnect user and broadcast offline status
        await manager.disconnect(user_id)
    except Exception as e:
        # Handle any other unexpected errors
        print(f"WebSocket error for user {user_id}: {e}")
        await manager.disconnect(user_id)