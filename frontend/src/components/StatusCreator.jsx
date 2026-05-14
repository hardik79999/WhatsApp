import { useState, useRef } from "react";
import api from "../api";

const BG_COLORS = [
  "#1a1a2e", "#16213e", "#0f3460",
  "#2d6a4f", "#1b4332", "#6a0572",
  "#c9184a", "#e76f51", "#264653",
];

export default function StatusCreator({ onClose, onCreated }) {
  const [mode, setMode]             = useState("text"); // "text" | "media"
  const [text, setText]             = useState("");
  const [bgColor, setBgColor]       = useState(BG_COLORS[0]);
  const [mediaFile, setMediaFile]   = useState(null);
  const [mediaPreview, setPreview]  = useState(null);
  const [caption, setCaption]       = useState("");
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState("");
  const fileRef = useRef();

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
      setError("Please enter some text.");
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

  return (
    <div style={overlay}>
      <div style={modal}>
        {/* Header */}
        <div style={header}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Add Status</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px 0" }}>
          <ModeBtn active={mode === "text"}  onClick={() => setMode("text")}>📝 Text</ModeBtn>
          <ModeBtn active={mode === "media"} onClick={() => fileRef.current?.click()}>📷 Photo / Video</ModeBtn>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Preview area */}
        <div style={{
          ...previewBox,
          background: mode === "text" ? bgColor : "#111",
        }}>
          {mode === "text" ? (
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a status..."
              maxLength={700}
              style={textArea}
            />
          ) : mediaPreview ? (
            mediaFile?.type.startsWith("video") ? (
              <video src={mediaPreview} controls style={mediaStyle} />
            ) : (
              <img src={mediaPreview} alt="preview" style={mediaStyle} />
            )
          ) : (
            <div style={{ color: "#888", fontSize: 14 }}>Select a photo or video above</div>
          )}
        </div>

        {/* Background color picker (text mode only) */}
        {mode === "text" && (
          <div style={{ display: "flex", gap: 8, padding: "0 16px 4px", flexWrap: "wrap" }}>
            {BG_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setBgColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: c, border: bgColor === c ? "3px solid #00a884" : "2px solid #555",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        )}

        {/* Caption (media mode) */}
        {mode === "media" && mediaPreview && (
          <div style={{ padding: "0 16px 4px" }}>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Add a caption..."
              maxLength={300}
              style={{
                width: "100%", background: "#2a2a2a", border: "1px solid #444",
                borderRadius: 8, padding: "8px 12px",
                color: "#fff", fontSize: 14, boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {error && (
          <p style={{ color: "#ff6b6b", padding: "0 16px", fontSize: 13, margin: "4px 0" }}>{error}</p>
        )}

        {/* Footer */}
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            style={{
              background: uploading ? "#555" : "#00a884",
              color: "#fff", border: "none",
              borderRadius: 20, padding: "10px 28px",
              fontWeight: 600, fontSize: 14, cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Posting…" : "Post Status"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#00a884" : "#2a2a2a",
        color: "#fff", border: "none",
        borderRadius: 20, padding: "6px 14px",
        fontSize: 13, fontWeight: active ? 700 : 400,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ── Styles ──────────────────────────────────────────────────

const overlay = {
  position: "fixed", inset: 0, zIndex: 8000,
  background: "rgba(0,0,0,0.75)",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const modal = {
  background: "#1f1f1f", borderRadius: 12,
  width: "min(440px, 96vw)",
  display: "flex", flexDirection: "column", gap: 12,
  overflow: "hidden",
};

const header = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "14px 16px",
  borderBottom: "1px solid #333",
  color: "#fff",
};

const closeBtn = {
  background: "none", border: "none",
  color: "#aaa", fontSize: 20, cursor: "pointer",
};

const previewBox = {
  height: 260,
  display: "flex", alignItems: "center", justifyContent: "center",
  margin: "0 16px", borderRadius: 10, overflow: "hidden",
  transition: "background 0.3s",
};

const textArea = {
  width: "100%", height: "100%",
  background: "transparent", border: "none", outline: "none",
  resize: "none", color: "#fff",
  fontSize: 22, fontWeight: 500,
  textAlign: "center", padding: 20,
  fontFamily: "inherit",
};

const mediaStyle = {
  maxWidth: "100%", maxHeight: "100%", objectFit: "contain",
};
