from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timezone
 
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user_model import User
from app.models.call_model import Call
from app.schemas.call_schema import CallInitiate, CallResponse, CallHistoryResponse
from app.websocket.manager import manager
 
router = APIRouter()
 
 
# ─────────────────────────────────────────────────────────────
# POST /initiate  →  Start a call; push "incoming_call" to receiver via WS
# ─────────────────────────────────────────────────────────────
@router.post("/initiate", response_model=CallResponse)
async def initiate_call(
    request: CallInitiate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if str(request.receiver_id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot call yourself")
 
    receiver = db.query(User).filter(User.id == request.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")
 
    if request.call_type not in ("audio", "video"):
        raise HTTPException(status_code=400, detail="call_type must be 'audio' or 'video'")
 
    new_call = Call(
        caller_id=current_user.id,
        receiver_id=request.receiver_id,
        call_type=request.call_type,
        status="initiated",
    )
    db.add(new_call)
    db.commit()
    db.refresh(new_call)
 
 
    # Push real-time notification to receiver
    await manager.send_personal_message({
        "type": "incoming_call",
        "call_id": str(new_call.id),
        "caller_id": str(current_user.id),
        "caller_name": current_user.username or current_user.phone,
        "caller_pic": current_user.profile_pic,
        "call_type": request.call_type,
    }, str(request.receiver_id))
 
    return new_call
 
 
# ─────────────────────────────────────────────────────────────
# POST /{call_id}/accept  →  Receiver accepts; notify caller via WS
# ─────────────────────────────────────────────────────────────
@router.post("/{call_id}/accept", response_model=CallResponse)
async def accept_call(
    call_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
 
    if str(call.receiver_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only the receiver can accept")
 
    if call.status != "initiated":
        raise HTTPException(status_code=400, detail=f"Call is already {call.status}")
 
    call.status = "ongoing"
    call.started_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(call)
 
    # Notify caller so they know to start WebRTC offer
    await manager.send_personal_message({
        "type": "call_accepted",
        "call_id": str(call_id),
        "receiver_id": str(current_user.id),
    }, str(call.caller_id))
 
    return call
 
 
# ─────────────────────────────────────────────────────────────
# POST /{call_id}/reject  →  Receiver rejects; update DB + notify caller
# ─────────────────────────────────────────────────────────────
@router.post("/{call_id}/reject", response_model=CallResponse)
async def reject_call(
    call_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
 
    if str(call.receiver_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only the receiver can reject")
 
    call.status = "rejected"
    call.ended_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(call)
 
    await manager.send_personal_message({
        "type": "call_rejected",
        "call_id": str(call_id),
    }, str(call.caller_id))
 
    return call
 
 
# ─────────────────────────────────────────────────────────────
# POST /{call_id}/end  →  Either party ends the call
# ─────────────────────────────────────────────────────────────
@router.post("/{call_id}/end", response_model=CallResponse)
async def end_call(
    call_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
 
    is_participant = (
        str(call.caller_id) == str(current_user.id) or
        str(call.receiver_id) == str(current_user.id)
    )
    if not is_participant:
        raise HTTPException(status_code=403, detail="Not a participant")
 
    was_ongoing = call.status == "ongoing"
    if call.status == "initiated":
        call.status = "missed"      # Caller hung up before receiver answered
    elif call.status == "ongoing":
        call.status = "completed"
 
    call.ended_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(call)
 
    # Notify the OTHER party
    other_id = str(call.receiver_id) if str(call.caller_id) == str(current_user.id) else str(call.caller_id)
    await manager.send_personal_message({
        "type": "call_ended",
        "call_id": str(call_id),
        "ended_by": str(current_user.id),
    }, other_id)
 
    return call
 
 
# ─────────────────────────────────────────────────────────────
# GET /history  →  Paginated call log for the current user
# ─────────────────────────────────────────────────────────────
@router.get("/history", response_model=List[CallHistoryResponse])
def get_call_history(
    skip: int = 0,
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    calls = (
        db.query(Call)
        .filter(
            (Call.caller_id == current_user.id) |
            (Call.receiver_id == current_user.id)
        )
        .order_by(Call.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
 
    result = []
    for call in calls:
        is_outgoing = str(call.caller_id) == str(current_user.id)
        other_id = call.receiver_id if is_outgoing else call.caller_id
        other_user = db.query(User).filter(User.id == other_id).first()
 
        duration = None
        if call.started_at and call.ended_at:
            duration = int((call.ended_at - call.started_at).total_seconds())
 
        result.append(CallHistoryResponse(
            id=call.id,
            call_type=call.call_type,
            status=call.status,
            direction="outgoing" if is_outgoing else "incoming",
            other_user_id=other_id,
            other_username=other_user.username if other_user else None,
            other_profile_pic=other_user.profile_pic if other_user else None,
            duration_seconds=duration,
            created_at=call.created_at,
        ))
 
    return result