import React from 'react';
import Avatar from './Avatar';

/**
 * IncomingCallAlert
 * Props:
 *   call     – { call_id, caller_id, caller_username, caller_pic, call_type }
 *   onAccept – (callId, callType, callerObj) => void
 *   onReject – () => void
 */
function IncomingCallAlert({ call, onAccept, onReject }) {
  const { call_id, caller_id, caller_username, caller_pic, call_type } = call;

  const callerObj = { id: caller_id, username: caller_username, profile_pic: caller_pic };

  return (
    <div style={{
      position: 'fixed',
      top: 24,
      right: 24,
      zIndex: 99999,
      background: 'linear-gradient(135deg, #1a2c38 0%, #0d1e28 100%)',
      borderRadius: 20,
      padding: '20px 24px',
      minWidth: 300,
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      border: '1px solid rgba(0,168,132,0.3)',
      animation: 'pulse 1.5s infinite, fadeSlideUp 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <Avatar src={caller_pic} name={caller_username || 'Unknown'} size={48} />
          {/* Ring indicator */}
          <span style={{
            position: 'absolute', inset: -4,
            borderRadius: '50%',
            border: '2px solid rgba(37,211,102,0.6)',
            animation: 'pulse 1.5s infinite',
          }} />
        </div>
        <div>
          <div style={{ color: '#e9edef', fontWeight: 600, fontSize: 16 }}>
            {caller_username || 'Unknown'}
          </div>
          <div style={{ color: '#8696a0', fontSize: 13, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            {call_type === 'video' ? (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="#8696a0">
                <path d="M15 8v8H5V8h10m1-2H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4V7c0-.55-.45-1-1-1z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="#8696a0">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
              </svg>
            )}
            Incoming {call_type === 'video' ? 'video' : 'voice'} call
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        {/* Reject */}
        <button
          onClick={onReject}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
            color: '#fff', border: 'none', borderRadius: 50,
            padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            boxShadow: '0 4px 12px rgba(231,76,60,0.4)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.32.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C9.61 21 3 14.39 3 6c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.26 1.02l-2.19 2.2z" transform="rotate(135 12 12)"/>
          </svg>
          Decline
        </button>

        {/* Accept */}
        <button
          onClick={() => onAccept(call_id, call_type, callerObj)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #00a884, #25d366)',
            color: '#fff', border: 'none', borderRadius: 50,
            padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            boxShadow: '0 4px 12px rgba(37,211,102,0.4)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
          </svg>
          Accept
        </button>
      </div>
    </div>
  );
}

export default IncomingCallAlert;
