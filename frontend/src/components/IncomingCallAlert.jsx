// frontend/src/components/IncomingCallAlert.jsx
// Renders when a "incoming_call" WS event arrives.
//
// Integration in App.jsx WebSocket handler:
//   else if (incomingData.type === "incoming_call") {
//     setIncomingCall(incomingData);
//   }
//   else if (incomingData.type === "call_ended" || incomingData.type === "call_rejected") {
//     setActiveCall(prev => prev?.callId === incomingData.call_id ? null : prev);
//     setIncomingCall(null);
//   }
//
// In JSX:
//   {incomingCall && (
//     <IncomingCallAlert
//       call={incomingCall}
//       onAccept={(callId, callType, caller) => {
//         setIncomingCall(null);
//         setActiveCall({ callId, callType, remoteUser: caller, isCaller: false });
//       }}
//       onReject={() => setIncomingCall(null)}
//     />
//   )}

import { useEffect, useState } from "react";
import api from "../api";    // ← correct import for this project
import Avatar from "./Avatar";

export default function IncomingCallAlert({ call, onAccept, onReject }) {
  const [ringing, setRinging] = useState(true);

  // Auto-dismiss after 30s (missed call)
  useEffect(() => {
    const t = setTimeout(() => {
      setRinging(false);
      onReject();
    }, 30_000);
    return () => clearTimeout(t);
  }, [onReject]);

  if (!ringing) return null;

  const handleAccept = async () => {
    try {
      await api.post(`/calls/${call.call_id}/accept`);  // baseURL is /api/v1
      onAccept(call.call_id, call.call_type, {
        id:          call.caller_id,
        username:    call.caller_name,
        profile_pic: call.caller_pic,
      });
    } catch (e) {
      console.error("Accept call error:", e);
    }
  };

  const handleReject = async () => {
    try {
      await api.post(`/calls/${call.call_id}/reject`);
    } catch (e) {
      console.error("Reject call error:", e);
    } finally {
      onReject();
    }
  };

  const isVideo = call.call_type === "video";

  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 99999,
      background: "linear-gradient(135deg, #1a2c38 0%, #0d1e28 100%)",
      borderRadius: 20, padding: "20px 24px", minWidth: 300,
      boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
      border: "1px solid rgba(0,168,132,0.3)",
      display: "flex", flexDirection: "column", gap: 16,
      animation: "fadeSlideUp 0.3s ease",
    }}>
      {/* Caller info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative" }}>
          <Avatar src={call.caller_pic} name={call.caller_name || "Unknown"} size={48} />
          <span style={{
            position: "absolute", inset: -4, borderRadius: "50%",
            border: "2px solid rgba(37,211,102,0.6)",
            animation: "pulse 1.5s infinite",
          }} />
        </div>
        <div>
          <div style={{ color: "#e9edef", fontWeight: 600, fontSize: 16 }}>
            {call.caller_name || "Unknown"}
          </div>
          <div style={{ color: "#8696a0", fontSize: 13, marginTop: 2 }}>
            Incoming {isVideo ? "video" : "voice"} call
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        {/* Reject */}
        <button
          onClick={handleReject}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg, #c0392b, #e74c3c)",
            color: "#fff", border: "none", borderRadius: 50,
            padding: "10px 20px", cursor: "pointer",
            fontSize: 14, fontWeight: 600,
            boxShadow: "0 4px 12px rgba(231,76,60,0.4)",
          }}
        >
          📵 Decline
        </button>

        {/* Accept */}
        <button
          onClick={handleAccept}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg, #00a884, #25d366)",
            color: "#fff", border: "none", borderRadius: 50,
            padding: "10px 20px", cursor: "pointer",
            fontSize: 14, fontWeight: 600,
            boxShadow: "0 4px 12px rgba(37,211,102,0.4)",
          }}
        >
          {isVideo ? "📹" : "📞"} Accept
        </button>
      </div>
    </div>
  );
}
