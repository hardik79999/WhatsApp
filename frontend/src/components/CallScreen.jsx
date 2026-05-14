// frontend/src/components/CallScreen.jsx
// Full-screen call UI. Works for both audio and video calls.
// Uses the new useWebRTC hook that matches websocket.py signaling.
//
// Props:
//   callId      – UUID string from REST API
//   callType    – "audio" | "video"
//   remoteUser  – { id, username, profile_pic }
//   isCaller    – bool
//   ws          – live WebSocket instance from App.jsx
//   onEnd       – () => void

import { useEffect, useRef, useState } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import Avatar from "./Avatar";
import api from "../api";

export default function CallScreen({
  callId, callType, remoteUser, isCaller, ws, onEnd,
}) {
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const [status,       setStatus]       = useState(isCaller ? "Calling…" : "Connecting…");
  const [duration,     setDuration]     = useState(0);
  const timerRef = useRef(null);

  const {
    localStream,
    remoteStream,
    isMuted,
    isCamOff,
    startAsCallerAfterAccept,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    toggleMute,
    toggleCamera,
    hangUp,
  } = useWebRTC({
    callId,
    remoteUserId: remoteUser?.id,
    callType,
    ws,
  });

  // ── Attach streams to video elements ─────────────────────
  useEffect(() => {
    const el = localVideoRef.current;
    if (el && localStream) el.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    const el = remoteVideoRef.current;
    if (el && remoteStream) {
      el.srcObject = remoteStream;
      setStatus("Connected");
      if (!timerRef.current) {
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      }
    }
  }, [remoteStream]);

  // ── Start or answer on mount ──────────────────────────────
  useEffect(() => {
    const localEl = localVideoRef.current;
    const remoteEl = remoteVideoRef.current;

    // Caller: waits for call_accepted WS event before sending offer (handled below).
    // Callee: waits for webrtc_offer WS event (handled below).
    // Nothing to do here on mount — the WS listener drives everything.

    return () => {
      clearInterval(timerRef.current);
      timerRef.current = null;
      hangUp();
      if (localEl) localEl.srcObject = null;
      if (remoteEl) remoteEl.srcObject = null;
    };
  }, [hangUp]);

  // ── Listen for WebRTC signaling events on the WS ─────────
  useEffect(() => {
    if (!ws) return;

    const onMessage = async (e) => {
      const data = JSON.parse(e.data);
      if (data.call_id !== callId && data.call_id !== undefined) return;

      switch (data.type) {
        case "call_accepted":
          // Caller now sends the WebRTC offer
          if (isCaller) {
            startAsCallerAfterAccept().catch(console.error);
          }
          break;

        case "webrtc_offer":
          // Receiver gets the offer (in case offerSdp wasn't passed as prop)
          if (!isCaller) {
            handleOffer(data.sdp).catch(console.error);
          }
          break;

        case "webrtc_answer":
          if (isCaller) {
            handleAnswer(data.sdp).catch(console.error);
          }
          break;

        case "webrtc_ice_candidate":
          handleIceCandidate(data.candidate).catch(console.error);
          break;

        case "call_ended":
        case "call_rejected":
          clearInterval(timerRef.current);
          timerRef.current = null;
          hangUp();
          onEnd();
          break;

        default:
          break;
      }
    };

    ws.addEventListener("message", onMessage);
    return () => ws.removeEventListener("message", onMessage);
  }, [
    ws,
    callId,
    isCaller,
    startAsCallerAfterAccept,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    hangUp,
    onEnd,
  ]);

  // ── Hang up button handler ────────────────────────────────
  const handleEnd = async () => {
    try {
      await api.post(`/calls/${callId}/end`);
    } catch (e) {
      console.error("End call API error:", e);
    }
    clearInterval(timerRef.current);
    timerRef.current = null;
    hangUp();
    onEnd();
  };

  // ── Handle page refresh / close ───────────────────────────
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Synchronously tell the backend to end the call before the page dies
      const token = localStorage.getItem('csrf_access_token') || sessionStorage.getItem('csrf_access_token');
      if (token) {
        // Use sendBeacon for reliable delivery during page unload
        navigator.sendBeacon(`/api/v1/calls/${callId}/end`, new Blob([], { type: 'application/json' }));
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [callId]);

  const fmt = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99998,
      background: "linear-gradient(160deg, #0d1e28 0%, #0b141a 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      {/* Remote video/audio */}
      {callType === "video" ? (
        <video
          ref={remoteVideoRef}
          autoPlay playsInline
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            opacity: status === "Connected" ? 1 : 0,
            transition: "opacity 0.5s",
          }}
        />
      ) : (
        <audio ref={remoteVideoRef} autoPlay playsInline style={{ display: "none" }} />
      )}

      {/* Avatar / status overlay */}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "0 24px" }}>
        {/* Animated rings */}
        {status !== "Connected" && ["160px","200px","240px"].map((size, i) => (
          <div key={i} style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: size, height: size, borderRadius: "50%",
            border: "1.5px solid rgba(0,168,132,0.3)",
            animation: `scaleRing 2s ease-out ${i * 0.6}s infinite`,
            pointerEvents: "none",
          }} />
        ))}

        {(callType === "audio" || status !== "Connected") && (
          <div style={{ marginBottom: 24, position: "relative" }}>
            <Avatar src={remoteUser?.profile_pic} name={remoteUser?.username || "?"} size={120} />
          </div>
        )}

        <div style={{ color: "#e9edef", fontSize: 28, fontWeight: 600 }}>
          {remoteUser?.username || "Unknown"}
        </div>
        <div style={{ color: "#8696a0", fontSize: 15, marginTop: 6 }}>
          {status === "Connected" ? fmt(duration) : status}
        </div>
      </div>

      {/* Local video (PiP) */}
      {callType === "video" && (
        <video
          ref={localVideoRef}
          autoPlay muted playsInline
          style={{
            position: "absolute", bottom: 120, right: 20,
            width: 120, height: 180, borderRadius: 12,
            objectFit: "cover", zIndex: 11,
            border: "2px solid rgba(255,255,255,0.2)",
            display: isCamOff ? "none" : "block",
          }}
        />
      )}

      {/* Controls */}
      <div style={{
        position: "absolute", bottom: 40,
        display: "flex", gap: 24, alignItems: "center", zIndex: 12,
      }}>
        {/* Mute */}
        <ControlBtn
          active={isMuted}
          label={isMuted ? "Unmute" : "Mute"}
          onClick={toggleMute}
          icon={isMuted ? "🔇" : "🎤"}
        />

        {/* Camera toggle (video only) */}
        {callType === "video" && (
          <ControlBtn
            active={isCamOff}
            label={isCamOff ? "Cam On" : "Cam Off"}
            onClick={toggleCamera}
            icon={isCamOff ? "📷" : "📹"}
          />
        )}

        {/* End call */}
        <button
          onClick={handleEnd}
          style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #e74c3c, #c0392b)",
            border: "none", cursor: "pointer", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28,
            boxShadow: "0 6px 20px rgba(231,76,60,0.5)",
          }}
          title="End call"
        >
          📵
        </button>
      </div>

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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <button
        onClick={onClick}
        style={{
          width: 52, height: 52, borderRadius: "50%",
          background: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)",
          border: "none", cursor: "pointer",
          fontSize: 22,
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(10px)",
        }}
        title={label}
      >
        {icon}
      </button>
      <span style={{ color: "#8696a0", fontSize: 11 }}>{label}</span>
    </div>
  );
}
