import React, { useContext } from 'react';
import { Icon } from './Icons';

/**
 * CallButton
 * Props:
 *   contactId      – remote user's DB id
 *   contactUser    – remote user object { id, username, profile_pic, … }
 *   callType       – 'audio' | 'video'
 *   ws             – live WebSocket ref (passed down from App)
 *   onCallStarted  – (callId, callType, contactUser) => void
 */
function CallButton({ contactId, contactUser, callType, ws, onCallStarted }) {
  const handleClick = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      alert('Connection not ready. Please try again.');
      return;
    }

    // Generate a unique call ID client-side (UUIDv4-ish)
    const callId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    ws.send(JSON.stringify({
      type: 'call_initiate',
      call_id: callId,
      target_user_id: contactId,
      call_type: callType,
    }));

    onCallStarted && onCallStarted(callId, callType, contactUser);
  };

  return (
    <button
      className="icon-btn"
      style={{ color: '#aebac1' }}
      onClick={handleClick}
      title={callType === 'video' ? 'Video call' : 'Voice call'}
    >
      {callType === 'video' ? <Icon.VideoCall /> : <Icon.Phone />}
    </button>
  );
}

export default CallButton;
