import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api";

const STATUS_DURATION_MS = 5000; // 5 s per story slide

export default function StatusViewer({ groups, initialGroup = 0, onClose }) {
  const [groupIdx, setGroupIdx]   = useState(initialGroup);
  const [slideIdx, setSlideIdx]   = useState(0);
  const [progress, setProgress]   = useState(0);
  const [,         setPaused]     = useState(false);

  const intervalRef  = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedRef   = useRef(0);

  const currentGroup  = groups[groupIdx];
  const currentSlide  = currentGroup?.statuses[slideIdx];
  const totalSlides   = currentGroup?.statuses.length ?? 0;

  // ── Mark viewed ──────────────────────────────────────────
  useEffect(() => {
    if (!currentSlide) return;
    if (currentSlide.is_viewed) return;
    api.post(`/statuses/${currentSlide.id}/view`).catch(() => {});
  }, [currentSlide?.id]);

  // ── Navigation ────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (slideIdx < totalSlides - 1) {
      setSlideIdx(s => s + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(g => g + 1);
      setSlideIdx(0);
    } else {
      onClose();
    }
  }, [slideIdx, totalSlides, groupIdx, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (slideIdx > 0) {
      setSlideIdx(s => s - 1);
    } else if (groupIdx > 0) {
      setGroupIdx(g => g - 1);
      // jump to last slide of previous group
      setSlideIdx(groups[groupIdx - 1].statuses.length - 1);
    }
  }, [slideIdx, groupIdx, groups]);

  // ── Progress ticker ───────────────────────────────────────
  const startTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current);
      const pct = Math.min((elapsed / STATUS_DURATION_MS) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current);
        goNext();
      }
    }, 50);
  }, [goNext]);

  const pauseTimer = () => {
    clearInterval(intervalRef.current);
    elapsedRef.current += Date.now() - startTimeRef.current;
    setPaused(true);
  };

  const resumeTimer = () => {
    startTimeRef.current = Date.now();
    setPaused(false);
    startTimer();
  };

  // Reset and start when slide changes
  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
    setPaused(false);
    startTimer();
    return () => clearInterval(intervalRef.current);
  }, [groupIdx, slideIdx]);

  // Keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft")  goPrev();
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose]);

  if (!currentGroup || !currentSlide) return null;

  const isVideo = currentSlide.media_url?.match(/\.(mp4|webm)$/i);
  const isImage = currentSlide.media_url && !isVideo;
  const isText  = !currentSlide.media_url;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#0b141a",
        display: "flex", flexDirection: "column",
        userSelect: "none",
      }}
    >
      {/* ── Progress bars ── */}
      <div style={{
        display: "flex", gap: 3, padding: "12px 12px 8px",
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 2,
      }}>
        {currentGroup.statuses.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: "rgba(255,255,255,0.35)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: 2,
              background: "#fff",
              width: i < slideIdx ? "100%"
                   : i === slideIdx ? `${progress}%`
                   : "0%",
              transition: i === slideIdx ? "none" : undefined,
            }} />
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <div style={{
        position: "absolute", top: 28, left: 0, right: 0, zIndex: 2,
        display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
      }}>
        <Avatar src={currentGroup.profile_pic} name={currentGroup.username} size={38} />
        <div>
          <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
            {currentGroup.username ?? "Unknown"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
            {formatRelative(currentSlide.created_at)}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            marginLeft: "auto", background: "none", border: "none",
            color: "#fff", fontSize: 24, cursor: "pointer", lineHeight: 1,
          }}
          aria-label="Close"
        >✕</button>
      </div>

      {/* ── Content ── */}
      <div
        style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          background: isText ? (currentSlide.background_color ?? "#1a1a2e") : "#0b141a",
          position: "relative",
        }}
        onMouseDown={pauseTimer}
        onMouseUp={resumeTimer}
        onTouchStart={pauseTimer}
        onTouchEnd={resumeTimer}
      >
        {isImage && (
          <img
            src={currentSlide.media_url}
            alt="status"
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          />
        )}
        {isVideo && (
          <video
            src={currentSlide.media_url}
            autoPlay
            muted={false}
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        )}
        {isText && (
          <p style={{
            color: "#fff", fontSize: 26, fontWeight: 500,
            textAlign: "center", padding: "0 40px", lineHeight: 1.5,
          }}>
            {currentSlide.content}
          </p>
        )}

        {/* Caption on media statuses */}
        {!isText && currentSlide.content && (
          <div style={{
            position: "absolute", bottom: 32, left: 0, right: 0,
            background: "rgba(0,0,0,0.5)",
            color: "#fff", textAlign: "center",
            padding: "12px 20px", fontSize: 15,
          }}>
            {currentSlide.content}
          </div>
        )}

        {/* Left / Right tap zones */}
        <div
          onClick={goPrev}
          style={{ position: "absolute", left: 0, top: 0, width: "30%", height: "100%", cursor: "pointer" }}
        />
        <div
          onClick={goNext}
          style={{ position: "absolute", right: 0, top: 0, width: "30%", height: "100%", cursor: "pointer" }}
        />
      </div>

      {/* ── View count (own statuses) ── */}
      {currentSlide.viewers !== undefined && (
        <div style={{
          background: "rgba(0,0,0,0.7)", color: "#fff",
          padding: "10px 16px", fontSize: 13,
          display: "flex", alignItems: "center", gap: 8,
          position: "absolute", bottom: 10, left: '50%', transform: 'translateX(-50%)',
          borderRadius: 20
        }}>
          <span>👁️</span>
          <span>{currentSlide.view_count || currentSlide.viewers.length} views</span>
        </div>
      )}
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────

function Avatar({ src, name, size }) {
  return src ? (
    <img src={src} alt={name} style={{
      width: size, height: size, borderRadius: "50%", objectFit: "cover",
    }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#25d366", display: "flex", alignItems: "center",
      justifyContent: "center", color: "#fff",
      fontWeight: 700, fontSize: size * 0.4,
    }}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function formatRelative(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "Just now";
}
