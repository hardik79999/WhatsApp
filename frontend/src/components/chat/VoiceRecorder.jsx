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
      className={`p-2 rounded-full transition-colors ${
        recording
          ? "bg-red-500 text-white animate-pulse"
          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
      }`}
      title={recording ? `Recording… ${fmt(seconds)}` : "Hold to record voice note"}
    >
      {recording ? (
        <span className="text-xs font-mono px-1">{fmt(seconds)}</span>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 3a4 4 0 014 4v4a4 4 0 01-8 0V7a4 4 0 014-4z" />
        </svg>
      )}
    </button>
  );
}