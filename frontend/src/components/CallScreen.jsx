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
//   localUserId – current user's id
//   onEnd       – () => void

import React, { useEffect, useRef, useState } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import Avatar from "./Avatar";
import api from "../api";

export default function CallScreen({
  callId, callType, remoteUser, isCaller, ws, localUserId, onEnd,
}) {
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const [status,       setStatus]       = useState(isCaller ? "Calling…" : "Connecting…");
  const [duration,     setDuration]     = useState(0);
  const timerRef = useRef(null);

  const rtc = useWebRTC({
    callId,
    localUserId,
    remoteUserId: remoteUser?.id,
    callType,
    ws,
  });

  // ── Attach streams to video elements ─────────────────────
  useEffect(() => {
    if (localVideoRef.current && rtc.localStream) {
      localVideoRef.current.srcObject = rtc.localStream;
    }
  }, [rtc.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && rtc.remoteStream) {
      remoteVideoRef.current.srcObject = rtc.remoteStream;
      setStatus("Connected");
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
  }, [rtc.remoteStream]);

  // ── Start or answer on mount ──────────────────────────────
  useEffect(() => {
    // Caller: waits for call_accepted WS event before sending offer (handled below).
    // Callee: waits for webrtc_offer WS event (handled below).
    // Nothing to do here on mount — the WS listener drives everything.

    return () => {
      clearInterval(timerRef.current);
      rtc.hangUp();
      if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };
  }, []); // eslint-disable-line

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
            rtc.startAsCallerAfterAccept().catch(console.error);
          }
          break;

        case "webrtc_offer":
          // Receiver gets the offer (in case offerSdp wasn't passed as prop)
          if (!isCaller) {
            rtc.handleOffer(data.sdp).catch(console.error);
          }
          break;

        case "webrtc_answer":
          if (isCaller) {
            rtc.handleAnswer(data.sdp).catch(console.error);
          }
          break;

        case "webrtc_ice_candidate":
          rtc.handleIceCandidate(data.candidate).catch(console.error);
          break;

        case "call_ended":
        case "call_rejected":
          clearInterval(timerRef.current);
          rtc.hangUp();
          onEnd();
          break;

        default:
          break;
      }
    };

    ws.addEventListener("message", onMessage);
    return () => ws.removeEventListener("message", onMessage);
  }, [ws, callId, isCaller, rtc, onEnd]); // eslint-disable-line

  // ── Hang up button handler ────────────────────────────────
  const handleEnd = async () => {
    try {
      await api.post(`/calls/${callId}/end`);
    } catch (e) {
      console.error("End call API error:", e);
    }
    clearInterval(timerRef.current);
    rtc.hangUp();
    onEnd();
  };

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
      {/* Remote video (full screen for video calls) */}
      {callType === "video" && (
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
            display: rtc.isCamOff ? "none" : "block",
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
          active={rtc.isMuted}
          label={rtc.isMuted ? "Unmute" : "Mute"}
          onClick={rtc.toggleMute}
          icon={rtc.isMuted ? "🔇" : "🎤"}
        />

        {/* Camera toggle (video only) */}
        {callType === "video" && (
          <ControlBtn
            active={rtc.isCamOff}
            label={rtc.isCamOff ? "Cam On" : "Cam Off"}
            onClick={rtc.toggleCamera}
            icon={rtc.isCamOff ? "📷" : "📹"}
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
