import { useState, useRef } from "react";
import axios from "axios";
import MediaUploadButton from "./MediaUploadButton";
import VoiceRecorder from "./VoiceRecorder";

export default function ChatInput({ chatId, currentUserId, onMessageSent }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  const sendMessage = async (payload) => {
    setSending(true);
    try {
      const { data } = await axios.post(
        "/api/v1/messages/",
        { chat_id: chatId, ...payload },
        { withCredentials: true }
      );
      onMessageSent(data);
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setSending(false);
    }
  };

  const handleTextSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText("");
    inputRef.current?.focus();
    await sendMessage({ content: trimmed, message_type: "text" });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleTextSend(e);
    }
  };

  const handleMediaUpload = async (uploadResult) => {
    await sendMessage({
      content: uploadResult.filename,
      message_type: uploadResult.media_type,
      media_url: uploadResult.media_url,
      file_size: uploadResult.file_size,
    });
  };

  const handleVoiceRecorded = async (uploadResult) => {
    await sendMessage({
      message_type: "audio",
      media_url: uploadResult.media_url,
      file_size: uploadResult.file_size,
      duration: uploadResult.duration,
    });
  };

  return (
    <form
      onSubmit={handleTextSend}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        background: "#202c33",
        borderTop: "1px solid #2a3942",
        flexShrink: 0,
        zIndex: 10,
        position: "relative",
      }}
    >
      {/* Attach / media button */}
      <MediaUploadButton onUpload={handleMediaUpload} disabled={sending} />

      {/* Text input */}
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message"
        disabled={sending}
        style={{
          flex: 1,
          background: "#2a3942",
          border: "none",
          borderRadius: 8,
          padding: "10px 16px",
          color: "#e9edef",
          fontSize: 15,
          fontFamily: "inherit",
          outline: "none",
          caretColor: "#00a884",
          lineHeight: 1.5,
        }}
        autoComplete="off"
      />

      {/* Send button — shown when there's text */}
      {text.trim() ? (
        <button
          type="submit"
          disabled={sending}
          title="Send"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#00a884",
            border: "none",
            cursor: sending ? "not-allowed" : "pointer",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            opacity: sending ? 0.6 : 1,
            transition: "background 0.15s, transform 0.1s",
          }}
          onMouseEnter={(e) => { if (!sending) e.currentTarget.style.background = "#00c99f"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#00a884"; }}
        >
          {/* Send icon */}
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
          </svg>
        </button>
      ) : (
        /* Mic / voice recorder — shown when input is empty */
        <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={sending} />
      )}
    </form>
  );
}