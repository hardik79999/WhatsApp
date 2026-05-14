import { useState, useRef, useEffect } from "react";
import api from "../../api";

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
      // Prefer audio/webm; fallback to whatever browser supports
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

      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const duration = secondsRef.current;
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });

        const formData = new FormData();
        formData.append("file", blob, "voice_note.webm");

        try {
          const { data } = await api.post("/media/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          });
          // data.file_type === "audio", data.media_url, data.file_size
          onRecorded({ ...data, duration });
        } catch (err) {
          console.error("Voice upload failed:", err);
          alert("Voice upload failed. Please try again.");
        }
      };

      mr.start(250); // collect data every 250ms
      mediaRecorderRef.current = mr;
      setRecording(true);
      startTimer();
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    stopTimer();
  };

  const handleClick = () => {
    if (recording) stopRecording();
    else startRecording();
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (disabled) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      title={recording ? `Stop recording (${fmt(seconds)})` : "Record voice note"}
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
        transition: "background 0.2s",
        animation: recording ? "pulse 1.2s ease-in-out infinite" : "none",
        position: "relative",
      }}
    >
      {recording ? (
        /* Recording indicator: red dot + timer */
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
