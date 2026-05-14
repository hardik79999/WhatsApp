import { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function VoiceRecorder({ onRecorded, disabled }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => () => stopTimer(), []);

  const startTimer = () => {
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const duration = seconds;

        const formData = new FormData();
        formData.append("file", blob, "voice_note.webm");

        try {
          const { data } = await axios.post("/api/v1/media/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          });
          onRecorded({ ...data, duration });
        } catch (err) {
          console.error("Voice upload failed:", err);
        }
      };

      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      startTimer();
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    stopTimer();
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (disabled) return null;

  return (
    <button
      type="button"
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      title={recording ? `Recording… ${fmt(seconds)}` : "Hold to record voice note"}
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
        background: recording ? "#e74c3c" : "rgba(134,150,160,0.15)",
        color: recording ? "#fff" : "#8696a0",
        transition: "background 0.2s, transform 0.1s",
        animation: recording ? "pulse 1s infinite" : "none",
      }}
    >
      {recording ? (
        /* Show timer while recording */
        <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>
          {fmt(seconds)}
        </span>
      ) : (
        /* Mic icon */
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z"/>
        </svg>
      )}
    </button>
  );
}