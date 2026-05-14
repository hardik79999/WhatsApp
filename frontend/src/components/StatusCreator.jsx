// StatusCreator.jsx
// Full-screen WhatsApp-style status composer.
// Supports text (colored background) and photo/video modes.

import { useState, useRef, useEffect } from "react";
import api from "../api";

const BG_COLORS = [
  "#6b4c9a", "#1a1a2e", "#16213e", "#0f3460",
  "#2d6a4f", "#1b4332", "#c9184a", "#e76f51",
  "#264653", "#7b2d8b", "#b5451b", "#1565c0",
];

const FONT_SIZES = [18, 22, 28, 36];

export default function StatusCreator({ initialMode = "text", onClose, onCreated }) {
  const [mode,        setMode]        = useState(initialMode); // "text" | "media"
  const [text,        setText]        = useState("");
  const [bgColor,     setBgColor]     = useState(BG_COLORS[0]);
  const [fontIdx,     setFontIdx]     = useState(1);
  const [mediaFile,   setMediaFile]   = useState(null);
  const [mediaPreview,setPreview]     = useState(null);
  const [caption,     setCaption]     = useState("");
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState("");
  const [showEmoji,   setShowEmoji]   = useState(false);

  const fileRef    = useRef();
  const textareaRef = useRef();

  // Auto-focus textarea in text mode
  useEffect(() => {
    if (mode === "text") textareaRef.current?.focus();
  }, [mode]);

  // ── Pick a media file ──────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setPreview(URL.createObjectURL(file));
    setMode("media");
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");
    if (mode === "text" && !text.trim()) {
      setError("Please type something.");
      return;
    }
    if (mode === "media" && !mediaFile) {
      setError("Please select a photo or video.");
      return;
    }

    setUploading(true);
    try {
      let media_url = null;
      let thumbnail_url = null;

      if (mode === "media" && mediaFile) {
        const form = new FormData();
        form.append("file", mediaFile);
        const { data: uploadData } = await api.post("/media/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        media_url     = uploadData.media_url;
        thumbnail_url = uploadData.thumbnail_url ?? null;
      }

      const payload = {
        content:          mode === "text" ? text.trim() : (caption.trim() || null),
        media_url,
        thumbnail_url,
        background_color: mode === "text" ? bgColor : null,
      };

      const { data } = await api.post("/statuses/", payload);
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail ?? "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Emoji insert ──────────────────────────────────────────
  const insertEmoji = (emoji) => {
    setText(t => t + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  const QUICK_EMOJIS = ["😀","😂","❤️","🔥","👍","🎉","😍","🙏","💯","✨","😎","🥳","😭","🤔","👀","💪","🌟","🎶","🍕","🚀"];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      display: "flex", flexDirection: "column",
      background: mode === "text" ? bgColor : "#0b141a",
      transition: "background 0.3s",
    }}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", flexShrink: 0,
        background: "rgba(0,0,0,0.25)",
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", color: "#fff",
            fontSize: 22, cursor: "pointer", lineHeight: 1,
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label="Close"
        >✕</button>

        {/* Right tools (text mode only) */}
        {mode === "text" && (
          <div style={{ display: "flex", gap: 4 }}>
            {/* Emoji */}
            <div style={{ position: "relative" }}>
              <ToolBtn onClick={() => setShowEmoji(s => !s)} title="Emoji">😊</ToolBtn>
              {showEmoji && (
                <div style={{
                  position: "absolute", top: 44, right: 0, zIndex: 10,
                  background: "#1f2c34", borderRadius: 12,
                  padding: 12, display: "flex", flexWrap: "wrap",
                  gap: 6, width: 240,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}>
                  {QUICK_EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => insertEmoji(e)}
                      style={{
                        background: "none", border: "none", fontSize: 22,
                        cursor: "pointer", padding: 4, borderRadius: 6,
                        transition: "background .1s",
                      }}
                      onMouseEnter={ev => ev.currentTarget.style.background = "#2a3942"}
                      onMouseLeave={ev => ev.currentTarget.style.background = "none"}
                    >{e}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Font size cycle */}
            <ToolBtn
              onClick={() => setFontIdx(i => (i + 1) % FONT_SIZES.length)}
              title="Font size"
            >
              <span style={{ fontSize: 13, fontWeight: 700 }}>Aa</span>
            </ToolBtn>

            {/* Switch to media */}
            <ToolBtn onClick={() => fileRef.current?.click()} title="Add photo/video">🖼️</ToolBtn>
          </div>
        )}

        {mode === "media" && (
          <div style={{ display: "flex", gap: 4 }}>
            <ToolBtn onClick={() => fileRef.current?.click()} title="Change photo/video">🔄</ToolBtn>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* ── Main content area ────────────────────────────────── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {mode === "text" ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a status"
            maxLength={700}
            style={{
              background: "transparent", border: "none", outline: "none",
              resize: "none", color: "#fff",
              fontSize: FONT_SIZES[fontIdx],
              fontWeight: 500, textAlign: "center",
              padding: "0 40px",
              width: "100%", maxWidth: 600,
              lineHeight: 1.5,
              caretColor: "#fff",
              fontFamily: "inherit",
              // Vertically centered via flex parent
            }}
            rows={4}
          />
        ) : mediaPreview ? (
          mediaFile?.type.startsWith("video") ? (
            <video
              src={mediaPreview}
              controls
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <img
              src={mediaPreview}
              alt="preview"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          )
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 12, cursor: "pointer", color: "#8696a0",
            }}
          >
            <span style={{ fontSize: 48 }}>🖼️</span>
            <span style={{ fontSize: 15 }}>Tap to select a photo or video</span>
          </div>
        )}
      </div>

      {/* ── Background color picker (text mode) ─────────────── */}
      {mode === "text" && (
        <div style={{
          display: "flex", gap: 8, padding: "8px 16px",
          justifyContent: "center", flexWrap: "wrap", flexShrink: 0,
        }}>
          {BG_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setBgColor(c)}
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: c,
                border: bgColor === c ? "3px solid #fff" : "2px solid rgba(255,255,255,0.2)",
                cursor: "pointer", transition: "transform .1s",
                transform: bgColor === c ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}

      {/* ── Caption (media mode) ─────────────────────────────── */}
      {mode === "media" && mediaPreview && (
        <div style={{ padding: "8px 16px", flexShrink: 0 }}>
          <input
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption…"
            maxLength={300}
            style={{
              width: "100%", background: "rgba(255,255,255,0.1)",
              border: "none", borderRadius: 24,
              padding: "10px 16px", color: "#fff",
              fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────── */}
      {error && (
        <div style={{
          color: "#ff6b6b", textAlign: "center",
          padding: "4px 16px", fontSize: 13, flexShrink: 0,
        }}>
          {error}
        </div>
      )}

      {/* ── Bottom bar ───────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px 20px", flexShrink: 0,
        background: "rgba(0,0,0,0.25)",
      }}>
        {/* Privacy label */}
        <button style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.1)", border: "none",
          borderRadius: 20, padding: "8px 14px",
          color: "#fff", fontSize: 13, cursor: "pointer",
        }}>
          <span>🔄</span>
          <span>Status (Contacts)</span>
        </button>

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={uploading}
          style={{
            width: 52, height: 52, borderRadius: "50%",
            background: uploading ? "#555" : "#00a884",
            border: "none", cursor: uploading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,168,132,0.4)",
            transition: "background .2s",
          }}
          title="Post status"
        >
          {uploading ? (
            <span style={{ color: "#fff", fontSize: 18 }}>⏳</span>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <path d="M2 12L22 2L12 22L10 14L2 12Z" fill="#fff" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function ToolBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "rgba(255,255,255,0.15)", border: "none",
        color: "#fff", fontSize: 18, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
        transition: "background .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
    >
      {children}
    </button>
  );
}
