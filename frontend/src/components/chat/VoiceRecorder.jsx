import { useState, useRef, useEffect } from "react";
import api from "../../api";
import { Icon } from "../Icons";
import { showToast } from "../Toast";

export default function VoiceRecorder({ onRecorded, disabled }) {
  const [recording, setRecording] = useState(false);
  const [seconds,   setSeconds]   = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const timerRef         = useRef(null);
  const secondsRef       = useRef(0);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
  }, []);

  const startTimer = () => {
    secondsRef.current = 0;
    setSeconds(0);
    timerRef.current = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);
  };

  const stopTimer = () => clearInterval(timerRef.current);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.start(250);
      mediaRecorderRef.current = mr;
      setRecording(true);
      startTimer();
    } catch (err) {
      showToast(err.message || "Microphone access denied. Please check your browser permissions.", "error");
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    stopTimer();
  };

  const sendRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.onstop = async () => {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        const duration = secondsRef.current;
        const blob = new Blob(chunksRef.current, { type: mediaRecorderRef.current.mimeType || "audio/webm" });

        const formData = new FormData();
        formData.append("file", blob, "voice_note.webm");

        try {
          const { data } = await api.post("/media/voice", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          });
          onRecorded({ ...data, duration });
        } catch (err) {
          showToast(err.message || "Voice upload failed. Please try again.", "error");
        }
      };
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    stopTimer();
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (disabled) return null;

  if (recording) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--panel-header-background, #f0f2f5)",
        borderRadius: "24px",
        padding: "8px 16px",
        flex: 1,
        marginLeft: 8,
        marginRight: 8,
        animation: "slideIn 0.2s ease-out"
      }}>
        {/* Cancel Button (Trash icon) */}
        <button
          onClick={cancelRecording}
          style={{
            background: "none", border: "none", cursor: "pointer", color: "#8696a0", padding: "4px"
          }}
          title="Cancel"
        >
          <Icon.Trash size={20} />
        </button>

        {/* Timer with Blinking Dot */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "center" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%", background: "#e74c3c",
            animation: "pulse 1s infinite"
          }} />
          <span style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "600", color: "#111b21" }}>
            {fmt(seconds)}
          </span>
        </div>

        {/* Send Button */}
        <button
          onClick={sendRecording}
          style={{
            background: "none", border: "none", cursor: "pointer", color: "#00a884", padding: "4px",
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#00a884", color: "white"
          }}
          title="Send"
        >
          <Icon.Send size={18} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      title="Record voice note"
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: "transparent",
        color: "#8696a0",
        transition: "color 0.2s",
      }}
      onMouseOver={(e) => e.currentTarget.style.color = "#54656f"}
      onMouseOut={(e) => e.currentTarget.style.color = "#8696a0"}
    >
      <Icon.Mic size={22} />
    </button>
  );
}
