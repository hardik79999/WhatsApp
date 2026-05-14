import { useEffect, useCallback, useState, useRef } from "react";
import { createPortal } from "react-dom";

// ── Icon helpers ──────────────────────────────────────────────────────────────
const Ico = {
  Close: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  ),
  ZoomIn: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm.5-7H9v2H7v1h2v2h1v-2h2V9h-2z"/>
    </svg>
  ),
  ZoomOut: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z"/>
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
    </svg>
  ),
  Forward: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M12 8V4l8 8-8 8v-4H4V8z"/>
    </svg>
  ),
  Star: ({ filled }) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill={filled ? "#f5c518" : "currentColor"}>
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
    </svg>
  ),
  Caption: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M21 4H3v16h18V4zm-10 7H5V9h6v2zm8 4H5v-2h14v2zm0-4h-6V9h6v2z"/>
    </svg>
  ),
};

// ── Format date like WhatsApp: "11/05/2026 at 6:06 pm" ───────────────────────
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const date = d.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
  return `${date} at ${time}`;
}

// ── Main Lightbox ─────────────────────────────────────────────────────────────
export default function ImageLightbox({ images, startIndex = 0, senderName, onClose }) {
  const [idx,    setIdx]    = useState(startIndex);
  const [zoom,   setZoom]   = useState(1);
  const [pan,    setPan]    = useState({ x: 0, y: 0 });
  const [starred, setStarred] = useState({});
  const [showCaption, setShowCaption] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart  = useRef({ x: 0, y: 0 });

  const current = images[idx];

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  const setIndex = useCallback((next) => {
    setIdx((currentIdx) => (typeof next === "function" ? next(currentIdx) : next));
    resetView();
  }, [resetView]);

  // Keyboard navigation
  const handleKey = useCallback((e) => {
    if (e.key === "Escape")      onClose();
    if (e.key === "ArrowRight")  setIndex(i => Math.min(i + 1, images.length - 1));
    if (e.key === "ArrowLeft")   setIndex(i => Math.max(i - 1, 0));
    if (e.key === "+")           setZoom(z => Math.min(z + 0.25, 4));
    if (e.key === "-")           setZoom(z => Math.max(z - 0.25, 0.5));
  }, [images.length, onClose, setIndex]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Scroll-to-zoom
  const handleWheel = (e) => {
    e.preventDefault();
    setZoom(z => Math.min(Math.max(z - e.deltaY * 0.001, 0.5), 4));
  };

  // Drag-to-pan (only when zoomed in)
  const onMouseDown = (e) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current  = { ...pan };
  };
  const onMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: panStart.current.x + (e.clientX - dragStart.current.x),
      y: panStart.current.y + (e.clientY - dragStart.current.y),
    });
  };
  const onMouseUp = () => {
    setIsDragging(false);
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = current.url;
    a.download = current.filename || "image";
    a.target = "_blank";
    a.click();
  };

  const toggleStar = () => setStarred(s => ({ ...s, [idx]: !s[idx] }));

  const iconBtn = (onClick, title, children, active = false) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: active ? "#f5c518" : "#e9edef",
        width: 40, height: 40, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.1)"}
      onMouseLeave={e => e.currentTarget.style.background = "none"}
    >
      {children}
    </button>
  );

  const navBtn = (onClick, disabled, children) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: "absolute", top: "50%", transform: "translateY(-50%)",
        background: "rgba(11,20,26,.6)", border: "none", cursor: disabled ? "default" : "pointer",
        color: disabled ? "rgba(255,255,255,.2)" : "#e9edef",
        width: 44, height: 44, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background .15s, opacity .15s",
        zIndex: 10,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "rgba(11,20,26,.85)"; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = "rgba(11,20,26,.6)"; }}
    >
      {children}
    </button>
  );

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(11,20,26,.97)",
        display: "flex", flexDirection: "column",
        animation: "fadeIn .15s ease",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Top bar ── */}
      <div style={{
        height: 64, flexShrink: 0,
        display: "flex", alignItems: "center",
        padding: "0 8px 0 16px",
        background: "rgba(32,44,51,.95)",
        gap: 12,
      }}>
        {/* Sender avatar placeholder + info */}
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "#00a884", display: "flex", alignItems: "center",
          justifyContent: "center", color: "#fff", fontWeight: 700,
          fontSize: 16, flexShrink: 0,
        }}>
          {(senderName || "?")[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#e9edef", fontSize: 15, fontWeight: 500 }}>
            {senderName || "Unknown"}
          </div>
          <div style={{ color: "#8696a0", fontSize: 12 }}>
            {fmtDate(current?.created_at)}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {iconBtn(() => setZoom(z => Math.min(z + 0.25, 4)), "Zoom in",  <Ico.ZoomIn />)}
          {iconBtn(() => setZoom(z => Math.max(z - 0.25, 0.5)), "Zoom out", <Ico.ZoomOut />)}
          {iconBtn(() => setShowCaption(s => !s), "Caption", <Ico.Caption />, showCaption)}
          {iconBtn(toggleStar, "Star", <Ico.Star filled={!!starred[idx]} />, !!starred[idx])}
          {iconBtn(download, "Download", <Ico.Download />)}
          {iconBtn(() => {}, "Forward", <Ico.Forward />)}
          {iconBtn(onClose, "Close", <Ico.Close />)}
        </div>
      </div>

      {/* ── Main image area ── */}
      <div
        style={{
          flex: 1, position: "relative", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: zoom > 1 ? "grab" : "default",
        }}
        onWheel={handleWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Prev arrow */}
        <div style={{ position: "absolute", left: 12 }}>
          {navBtn(
            () => setIndex(i => Math.max(i - 1, 0)),
            idx === 0,
            <Ico.ChevronLeft />
          )}
        </div>

        {/* Image */}
        <img
          key={current?.url}
          src={current?.url}
          alt={current?.filename || "Image"}
          draggable={false}
          style={{
            maxWidth: "90vw",
            maxHeight: "calc(100vh - 64px - 110px)",
            objectFit: "contain",
            borderRadius: 4,
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transition: isDragging ? "none" : "transform .15s ease",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />

        {/* Caption overlay */}
        {showCaption && current?.caption && (
          <div style={{
            position: "absolute", bottom: 12, left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(11,20,26,.75)",
            color: "#e9edef", fontSize: 14,
            padding: "6px 16px", borderRadius: 8,
            maxWidth: "70%", textAlign: "center",
          }}>
            {current.caption}
          </div>
        )}

        {/* Next arrow */}
        <div style={{ position: "absolute", right: 12 }}>
          {navBtn(
            () => setIndex(i => Math.min(i + 1, images.length - 1)),
            idx === images.length - 1,
            <Ico.ChevronRight />
          )}
        </div>
      </div>

      {/* ── Thumbnail strip ── */}
      {images.length > 1 && (
        <div style={{
          height: 90, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, padding: "8px 16px",
          background: "rgba(11,20,26,.8)",
          overflowX: "auto",
        }}>
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: 60, height: 60, flexShrink: 0,
                padding: 0, border: "none", cursor: "pointer",
                borderRadius: 6,
                outline: i === idx ? "2px solid #00a884" : "2px solid transparent",
                outlineOffset: 2,
                overflow: "hidden",
                opacity: i === idx ? 1 : 0.55,
                transition: "opacity .15s, outline-color .15s",
              }}
            >
              <img
                src={img.url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
