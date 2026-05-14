import { useRef, useState, useEffect } from "react";

// Fake waveform bars — same visual as WhatsApp voice notes
const BARS = [3,5,8,6,10,7,12,9,14,11,13,8,10,6,9,12,7,11,8,5,9,13,10,7,12,8,6,10,9,11];

export default function AudioPlayer({ src, duration, isMine }) {
  const audioRef  = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [current, setCurrent]   = useState(0);
  const [total,   setTotal]     = useState(duration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime    = () => setCurrent(audio.currentTime);
    const onLoaded  = () => setTotal(audio.duration || duration || 0);
    const onEnd     = () => { setPlaying(false); setCurrent(0); };
    audio.addEventListener("timeupdate",    onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended",         onEnd);
    return () => {
      audio.removeEventListener("timeupdate",    onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended",         onEnd);
    };
  }, [duration]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else         { audio.play();  setPlaying(true);  }
  };

  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio || !total) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * total;
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const progress = total > 0 ? current / total : 0;
  const activeColor  = isMine ? "#a8d5c2" : "#00a884";
  const inactiveColor = isMine ? "rgba(255,255,255,0.25)" : "rgba(134,150,160,0.35)";

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:200, maxWidth:280, padding:"2px 0" }}>
      <audio ref={audioRef} src={src} preload="metadata" style={{ display:"none" }} />

      {/* Play / Pause */}
      <button
        onClick={toggle}
        style={{
          width:38, height:38, borderRadius:"50%",
          background: isMine ? "rgba(255,255,255,0.2)" : "rgba(0,168,132,0.15)",
          border:"none", cursor:"pointer", color: isMine ? "#fff" : "#00a884",
          display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0, transition:"background .15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = isMine ? "rgba(255,255,255,0.3)" : "rgba(0,168,132,0.25)"}
        onMouseLeave={e => e.currentTarget.style.background = isMine ? "rgba(255,255,255,0.2)" : "rgba(0,168,132,0.15)"}
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft:2 }}>
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      {/* Waveform + time */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
        {/* Waveform bars — clickable seek */}
        <div
          onClick={seek}
          style={{ display:"flex", alignItems:"center", gap:1.5, height:28, cursor:"pointer" }}
        >
          {BARS.map((h, i) => {
            const barProgress = i / BARS.length;
            const filled = barProgress <= progress;
            return (
              <div
                key={i}
                style={{
                  width:3, borderRadius:2,
                  height: `${Math.round(h * 1.6)}px`,
                  background: filled ? activeColor : inactiveColor,
                  transition:"background .1s",
                  flexShrink:0,
                }}
              />
            );
          })}
        </div>

        {/* Time */}
        <span style={{ fontSize:11, color: isMine ? "rgba(255,255,255,0.6)" : "#8696a0", lineHeight:1 }}>
          {playing || current > 0 ? fmt(current) : fmt(total)}
        </span>
      </div>
    </div>
  );
}
