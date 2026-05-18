import json
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import jwt, JWTError
from uuid import UUID

from app.core.config import settings
from app.core.security import ALGORITHM
from app.websocket.manager import manager

from app.core.database import SessionLocal
from app.models.message_model import Message
from app.models.user_model import User
from app.models.chat_model import ChatParticipant, Chat

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.cookies.get("access_token")
    if not token:
        await websocket.close(code=1008)
        return

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            await websocket.close(code=1008)
            return
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    try:
        user_uuid = UUID(str(user_id))
    except Exception:
        await websocket.close(code=1008)
        return

    became_online = await manager.connect(websocket, str(user_uuid))

    # Mark user online in DB only when first session connects
    if became_online:
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_uuid).first()
            if user:
                user.is_online = True
                db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    try:
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            event_type = data.get("type")

            if event_type == "ping":
                await websocket.send_json({"type": "pong"})

            # ════════════════════════════════════════════════
            # TYPING INDICATOR
            # ════════════════════════════════════════════════
            elif event_type == "typing":
                chat_id = data.get("chat_id")
                is_typing = bool(data.get("is_typing", False))
                if not chat_id:
                    continue
                try:
                    chat_uuid = UUID(str(chat_id))
                except Exception:
                    continue

                db = SessionLocal()
                try:
                    # Authorization: only participants can emit typing events for the chat
                    is_participant = db.query(ChatParticipant).filter(
                        ChatParticipant.chat_id == chat_uuid,
                        ChatParticipant.user_id == user_uuid,
                    ).first()
                    if not is_participant:
                        continue

                    participant_ids = [
                        str(r.user_id)
                        for r in db.query(ChatParticipant.user_id).filter(
                            ChatParticipant.chat_id == chat_uuid
                        ).all()
                    ]
                finally:
                    db.close()

                await manager.broadcast_to_chat(
                    {
                        "type": "typing",
                        "chat_id": str(chat_uuid),
                        "user_id": str(user_uuid),
                        "is_typing": is_typing,
                    },
                    participant_ids,
                    exclude_user_id=str(user_uuid),
                )

            # ════════════════════════════════════════════════
            # MESSAGE READ (BLUE TICKS)
            # ════════════════════════════════════════════════
            elif event_type == "mark_read":
                chat_id = data.get("chat_id")
                receiver_id = data.get("receiver_id")
                if not chat_id or not receiver_id:
                    continue
                try:
                    chat_uuid = UUID(str(chat_id))
                    receiver_uuid = UUID(str(receiver_id))
                except Exception:
                    continue

                db = SessionLocal()
                try:
                    # Authorization: reader must be part of the chat
                    is_participant = db.query(ChatParticipant).filter(
                        ChatParticipant.chat_id == chat_uuid,
                        ChatParticipant.user_id == user_uuid,
                    ).first()
                    if not is_participant:
                        continue

                    chat = db.query(Chat).filter(Chat.id == chat_uuid).first()
                    if not chat or chat.is_group:
                        continue

                    unread_msgs = db.query(Message).filter(
                        Message.chat_id == chat_uuid,
                        Message.sender_id == receiver_uuid,
                        Message.status != "read"
                    ).all()

                    if unread_msgs:
                        for msg in unread_msgs:
                            msg.status = "read"
                        db.commit()

                        if receiver_id:
                            await manager.send_personal_message({
                                "type": "messages_read",
                                "chat_id": str(chat_uuid),
                                "reader_id": str(user_uuid),
                            }, str(receiver_uuid))
                except Exception as e:
                    db.rollback()
                    print(f"Error marking messages as read: {e}")
                finally:
                    db.close()

            # ════════════════════════════════════════════════
            # WEBRTC SIGNALING — pure relay, no DB writes here
            # ════════════════════════════════════════════════

            elif event_type == "webrtc_offer":
                target_id = data.get("target_id")
                if target_id:
                    await manager.send_personal_message({
                        "type": "webrtc_offer",
                        "call_id": data.get("call_id"),
                        "sdp": data.get("sdp"),
                        "from_id": str(user_uuid),
                    }, target_id)

            elif event_type == "webrtc_answer":
                target_id = data.get("target_id")
                if target_id:
                    await manager.send_personal_message({
                        "type": "webrtc_answer",
                        "call_id": data.get("call_id"),
                        "sdp": data.get("sdp"),
                        "from_id": str(user_uuid),
                    }, target_id)

            elif event_type == "webrtc_ice_candidate":
                target_id = data.get("target_id")
                if target_id:
                    await manager.send_personal_message({
                        "type": "webrtc_ice_candidate",
                        "call_id": data.get("call_id"),
                        "candidate": data.get("candidate"),
                        "from_id": str(user_uuid),
                    }, target_id)

            elif event_type == "call_end":
                target_id = data.get("target_id")
                if target_id:
                    await manager.send_personal_message({
                        "type": "call_end",
                        "call_id": data.get("call_id"),
                        "from_id": str(user_uuid),
                    }, target_id)

            elif event_type == "call_rejected":
                target_id = data.get("target_id")
                if target_id:
                    await manager.send_personal_message({
                        "type": "call_rejected",
                        "call_id": data.get("call_id"),
                        "from_id": str(user_uuid),
                    }, target_id)

    except WebSocketDisconnect:
        await _handle_disconnect(str(user_uuid), websocket)
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        await _handle_disconnect(str(user_uuid), websocket)


async def _handle_disconnect(user_id: str, websocket: WebSocket):
    """Update last_seen in DB and broadcast offline status (only if last session closed)."""
    now = datetime.now(timezone.utc)

    went_offline = await manager.disconnect(user_id, websocket)
    if not went_offline:
        return

    db = SessionLocal()
    calls_to_notify = []
    try:
        user = db.query(User).filter(User.id == UUID(str(user_id))).first()
        if user:
            user.is_online = False
            user.last_seen = now

        # End any active calls for this user
        from app.models.call_model import Call
        from sqlalchemy import or_
        active_calls = db.query(Call).filter(
            or_(Call.caller_id == UUID(str(user_id)), Call.receiver_id == UUID(str(user_id))),
            Call.status.in_(["initiated", "ongoing"])
        ).all()

        for call in active_calls:
            call.status = "missed" if call.status == "initiated" else "completed"
            call.ended_at = now
            other_id = str(call.receiver_id) if str(call.caller_id) == str(user_id) else str(call.caller_id)
            calls_to_notify.append((str(call.id), other_id))

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error updating last_seen and ending calls for {user_id}: {e}")
    finally:
        db.close()

    # Notify the other party for each ended call
    for call_id, other_id in calls_to_notify:
        await manager.send_personal_message({
            "type": "call_ended",
            "call_id": call_id,
            "ended_by": user_id,
        }, other_id)

    # Broadcast last_seen timestamp so other clients can update their UI
    await manager.broadcast({
        "type": "user_offline",
        "user_id": user_id,
        "last_seen": now.isoformat(),
    })
