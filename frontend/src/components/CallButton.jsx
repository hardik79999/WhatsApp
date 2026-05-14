// frontend/src/components/CallButton.jsx
// Used in ChatWindow header for 1-on-1 chats.
// Initiates a call via REST, then the receiver gets an "incoming_call" WS event.

import React, { useState } from "react";
import { Icon } from "./Icons";
import api from "../api";

function CallButton({ contactId, contactUser, callType, ws, onCallStarted }) {
  const [calling, setCalling] = useState(false);

  const handleClick = async () => {
    if (calling) return;
    setCalling(true);
    try {
      // POST to REST — backend pushes "incoming_call" WS event to receiver
      const { data } = await api.post("/calls/initiate", {
        receiver_id: contactId,
        call_type: callType,
      });
      // Caller enters CallScreen immediately; sends webrtc_offer after call_accepted WS event
      onCallStarted && onCallStarted(data.id, callType, contactUser);
    } catch (e) {
      console.error("Call initiation error:", e);
      alert("Could not start call. Please try again.");
    } finally {
      setCalling(false);
    }
  };

  return (
    <button
      className="icon-btn"
      style={{ color: "#aebac1", opacity: calling ? 0.5 : 1 }}
      onClick={handleClick}
      disabled={calling}
      title={callType === "video" ? "Video call" : "Voice call"}
    >
      {callType === "video" ? <Icon.VideoCall /> : <Icon.Phone />}
    </button>
  );
}

export default CallButton;
