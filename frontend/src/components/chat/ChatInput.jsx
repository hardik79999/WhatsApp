import { useState, useRef } from "react";
import api from "../../api";
import MediaUploadButton from "./MediaUploadButton";
import VoiceRecorder from "./VoiceRecorder";

// ── Close (X) icon ────────────────────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

// ── Reply Preview Banner ──────────────────────────────────────────────────────
function ReplyPreviewBanner({ replyTo, onCancel }) {
  if (!replyTo) return null;

  const previewText =
    replyTo.is_deleted_for_everyone || replyTo.is_deleted
      ? 'This message was deleted'
      : replyTo.message_type !== 'text'
      ? `📎 ${replyTo.message_type}`
      : replyTo.content || '';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        background: '#1d2b33',
        borderTop: '1px solid #2a3942',
        borderBottom: '1px solid #2a3942',
      }}
    >
      {/* Accent bar */}
      <div style={{ width: 3, alignSelf: 'stretch', background: '#00a884', borderRadius: 2, flexShrink: 0 }} />

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#00a884', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
          Reply
        </div>
        <div
          style={{
            color: '#8696a0',
            fontSize: 13,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontStyle: replyTo.is_deleted_for_everyone ? 'italic' : 'normal',
          }}
        >
          {previewText}
        </div>
      </div>

      {/* Cancel button */}
      <button
        type="button"
        onClick={onCancel}
        style={{
          background: 'none',
          border: 'none',
          color: '#8696a0',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          flexShrink: 0,
        }}
        title="Cancel reply"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

// ── ChatInput ─────────────────────────────────────────────────────────────────
export default function ChatInput({ chatId, currentUserId, onMessageSent, replyTo, onCancelReply }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  const sendMessage = async (payload) => {
    setSending(true);
    try {
      const { data } = await api.post(
        "/messages/",
        {
          chat_id: chatId,
          ...payload,
          // Attach reply_to_message_id if replying
          ...(replyTo ? { reply_to_message_id: replyTo.id } : {}),
        },
        { withCredentials: true }
      );
      onMessageSent(data);
      // Clear reply after sending
      if (onCancelReply) onCancelReply();
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
    // Escape cancels reply
    if (e.key === "Escape" && replyTo && onCancelReply) {
      onCancelReply();
    }
  };

  const handleMediaUpload = async (uploadResult) => {
    // API returns `file_type` (image/video/audio/document), not `media_type`
    const msgType = uploadResult.file_type || uploadResult.media_type || "document";
    await sendMessage({
      content: uploadResult.filename || null,
      message_type: msgType,
      media_url: uploadResult.media_url,
      media_id: uploadResult.id || null,
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
    <div style={{ flexShrink: 0, zIndex: 10, position: 'relative' }}>
      {/* Reply preview banner — shown when replying */}
      <ReplyPreviewBanner replyTo={replyTo} onCancel={onCancelReply} />

      <form
        onSubmit={handleTextSend}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          background: "#202c33",
          borderTop: replyTo ? 'none' : "1px solid #2a3942",
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
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
            </svg>
          </button>
        ) : (
          <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={sending} />
        )}
      </form>
    </div>
  );
}
