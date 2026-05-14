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
 
    await manager.connect(websocket, user_id)
 
    try:
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            event_type = data.get("type")
 
            # ════════════════════════════════════════════════
            # TYPING INDICATOR
            # ════════════════════════════════════════════════
            if event_type == "typing":
                await manager.broadcast({
                    "type": "typing",
                    "chat_id": data.get("chat_id"),
                    "user_id": user_id,
                    "is_typing": data.get("is_typing", False),
                })
 
            # ════════════════════════════════════════════════
            # MESSAGE READ (BLUE TICKS)
            # ════════════════════════════════════════════════
            elif event_type == "mark_read":
                chat_id = data.get("chat_id")
                receiver_id = data.get("receiver_id")
 
                db = SessionLocal()
                try:
                    unread_msgs = db.query(Message).filter(
                        Message.chat_id == chat_id,
                        Message.sender_id == receiver_id,
                        Message.status != "read"
                    ).all()
 
                    if unread_msgs:
                        for msg in unread_msgs:
                            msg.status = "read"
                        db.commit()
 
                        if receiver_id:
                            await manager.send_personal_message({
                                "type": "messages_read",
                                "chat_id": chat_id,
                                "reader_id": user_id,
                            }, receiver_id)
                except Exception as e:
                    db.rollback()
                    print(f"Error marking messages as read: {e}")
                finally:
                    db.close()
 
            # ════════════════════════════════════════════════
            # WEBRTC SIGNALING — pure relay, no DB writes here
            # REST endpoints handle status updates
            # ════════════════════════════════════════════════
 
            # Caller → sends offer to receiver
            elif event_type == "webrtc_offer":
                target_id = data.get("target_id")   # receiver's user_id
                if target_id:
                    await manager.send_personal_message({
                        "type": "webrtc_offer",
                        "call_id": data.get("call_id"),
                        "sdp": data.get("sdp"),
                        "from_id": user_id,
                    }, target_id)
 
            # Receiver → sends answer back to caller
            elif event_type == "webrtc_answer":
                target_id = data.get("target_id")   # caller's user_id
                if target_id:
                    await manager.send_personal_message({
                        "type": "webrtc_answer",
                        "call_id": data.get("call_id"),
                        "sdp": data.get("sdp"),
                        "from_id": user_id,
                    }, target_id)
 
            # ICE candidate exchange (both directions)
            elif event_type == "webrtc_ice_candidate":
                target_id = data.get("target_id")
                if target_id:
                    await manager.send_personal_message({
                        "type": "webrtc_ice_candidate",
                        "call_id": data.get("call_id"),
                        "candidate": data.get("candidate"),
                        "from_id": user_id,
                    }, target_id)
 
    except WebSocketDisconnect:
        await manager.disconnect(user_id)
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        await manager.disconnect(user_id)