import React, { useEffect, useRef, useState } from 'react';
import Avatar from './Avatar';
import { useWebRTC } from '../hooks/useWebRTC';

/**
 * CallScreen
 * Props:
 *   callId       – unique call session id
 *   callType     – 'audio' | 'video'
 *   remoteUser   – { id, username, profile_pic }
 *   isCaller     – bool
 *   ws           – live WebSocket instance
 *   localUserId  – current user's id
 *   offerSdp     – (callee only) the offer SDP from incoming_call WS event
 *   onEnd        – () => void  – called when call ends
 */
function CallScreen({ callId, callType, remoteUser, isCaller, ws, localUserId, offerSdp, onEnd }) {
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isMuted,       setIsMuted]       = useState(false);
  const [isCameraOff,   setIsCameraOff]   = useState(false);
  const [callDuration,  setCallDuration]  = useState(0);
  const [callStatus,    setCallStatus]    = useState(isCaller ? 'Calling…' : 'Connecting…');
  const timerRef = useRef(null);

  const { startCall, answerCall, handleAnswer, handleIceCandidate, endCall, cleanup, toggleMute, toggleCamera } = useWebRTC({
    ws,
    localUserId,
    remoteUserId: remoteUser.id,
    callType,
    isCaller,
    callId,
  });

  // ── Attach local/remote streams to video elements ─────────────────────
  const attachLocal = (stream) => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  };
  const attachRemote = (stream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      setCallStatus('Connected');
      // Start timer
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
  };

  // ── Start or answer call on mount ─────────────────────────────────────
  useEffect(() => {
    if (isCaller) {
      startCall(attachLocal, attachRemote).catch(console.error);
    } else {
      answerCall(offerSdp, attachLocal, attachRemote).catch(console.error);
    }

    // ✔ Guaranteed teardown: runs whenever the component unmounts,
    // regardless of who ended the call (user click OR remote hang-up).
    return () => {
      clearInterval(timerRef.current);
      cleanup(); // stops camera/mic tracks → turns off camera LED
      // Also release the video element src so Chrome/Firefox free the device
      if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle incoming WS signalling events ─────────────────────────────
  useEffect(() => {
    if (!ws) return;

    const onMessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.call_id !== callId) return;

      if (data.type === 'call_answer') {
        await handleAnswer(data.sdp);
      } else if (data.type === 'call_ice_candidate') {
        await handleIceCandidate(data.candidate);
      } else if (data.type === 'call_ended') {
        clearInterval(timerRef.current);
        cleanup(); // remote hung up → stop our camera too
        if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        onEnd();
      }
    };

    ws.addEventListener('message', onMessage);
    return () => ws.removeEventListener('message', onMessage);
  }, [ws, callId, handleAnswer, handleIceCandidate, onEnd]);

  // ── Formatted duration ────────────────────────────────────────────────
  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEnd = () => {
    endCall();
    clearInterval(timerRef.current);
    onEnd();
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99998,
      background: 'linear-gradient(160deg, #0d1e28 0%, #0b141a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>

      {/* ── Remote video (full screen) ── */}
      {callType === 'video' && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: callStatus === 'Connected' ? 1 : 0,
            transition: 'opacity 0.5s',
          }}
        />
      )}

      {/* ── Avatar shown for audio calls or before video connects ── */}
      {(callType === 'audio' || callStatus !== 'Connected') && (
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          {/* Animated rings */}
          {['160px', '200px', '240px'].map((size, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: size, height: size,
              borderRadius: '50%',
              border: '1.5px solid rgba(0,168,132,0.3)',
              animation: `scaleRing 2s ease-out ${i * 0.6}s infinite`,
            }} />
          ))}
          <Avatar
            src={remoteUser.profile_pic}
            name={remoteUser.username || 'Unknown'}
            size={120}
            style={{ boxShadow: '0 0 0 4px rgba(0,168,132,0.3)', position: 'relative', zIndex: 1 }}
          />
        </div>
      )}

      {/* ── Status overlay ── */}
      <div style={{
        position: 'relative', zIndex: 10, textAlign: 'center',
        marginTop: callType === 'audio' ? 24 : 0,
        background: callType === 'video' && callStatus === 'Connected'
          ? 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)'
          : 'transparent',
        width: '100%', padding: '24px 0',
      }}>
        <div style={{ color: '#e9edef', fontSize: 28, fontWeight: 600, letterSpacing: 0.5 }}>
          {remoteUser.username || 'Unknown'}
        </div>
        <div style={{ color: '#8696a0', fontSize: 15, marginTop: 6 }}>
          {callStatus === 'Connected' ? formatDuration(callDuration) : callStatus}
        </div>
      </div>

      {/* ── Local video (picture-in-picture) ── */}
      {callType === 'video' && (
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          style={{
            position: 'absolute', bottom: 120, right: 20,
            width: 120, height: 180, borderRadius: 12,
            objectFit: 'cover', zIndex: 11,
            border: '2px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            display: isCameraOff ? 'none' : 'block',
          }}
        />
      )}

      {/* ── Control buttons ── */}
      <div style={{
        position: 'absolute', bottom: 40,
        display: 'flex', gap: 20, alignItems: 'center',
        zIndex: 12,
      }}>
        {/* Mute */}
        <ControlBtn
          label={isMuted ? 'Unmute' : 'Mute'}
          active={isMuted}
          onClick={() => { setIsMuted(toggleMute()); }}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              {isMuted
                ? <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                : <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              }
            </svg>
          }
        />

        {/* Camera (video only) */}
        {callType === 'video' && (
          <ControlBtn
            label={isCameraOff ? 'Camera on' : 'Camera off'}
            active={isCameraOff}
            onClick={() => { setIsCameraOff(toggleCamera()); }}
            icon={
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                {isCameraOff
                  ? <path d="M21 6.5l-4-4-15 15 1.41 1.41 2.32-2.32C6.22 16.99 7.06 17 8 17h12c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1h-.17L21 6.5zM8 15l2.52-2.52A2.5 2.5 0 0 0 12 13a2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-.48-1.47L16 7h4v8l-8.08.08L8 15zM2 4.41L3.41 3 21 20.59 19.59 22 2 4.41z"/>
                  : <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                }
              </svg>
            }
          />
        )}

        {/* End call */}
        <button
          onClick={handleEnd}
          style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
            border: 'none', cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(231,76,60,0.5)',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title="End call"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.32.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C9.61 21 3 14.39 3 6c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.26 1.02l-2.19 2.2z" transform="rotate(135 12 12)"/>
          </svg>
        </button>

        {/* Speaker (placeholder) */}
        <ControlBtn
          label="Speaker"
          onClick={() => {}}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          }
        />
      </div>

      {/* ── CSS for ring animation ── */}
      <style>{`
        @keyframes scaleRing {
          0%   { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function ControlBtn({ icon, label, active, onClick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <button
        onClick={onClick}
        style={{
          width: 52, height: 52, borderRadius: '50%',
          background: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
          color: active ? '#111b21' : '#e9edef',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          transition: 'background 0.2s, transform 0.15s',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title={label}
      >
        {icon}
      </button>
      <span style={{ color: '#8696a0', fontSize: 11 }}>{label}</span>
    </div>
  );
}

export default CallScreen;
