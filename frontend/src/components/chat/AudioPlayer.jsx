import { useRef, useState, useEffect } from "react";
import { Icon } from "../Icons";

// Fake waveform bars — same visual as WhatsApp voice notes
const BARS = [3,5,8,6,10,7,12,9,14,11,13,8,10,6,9,12,7,11,8,5,9,13,10,7,12,8,6,10,9,11];

export default function AudioPlayer({ src, duration, isMine, children }) {
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
    if (!s || !isFinite(s) || isNaN(s)) return "0:00";
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const progress = total > 0 && isFinite(total) ? current / total : 0;
  const activeColor  = isMine ? "#94ecd0" : "#00a884";
  const inactiveColor = isMine ? "rgba(255,255,255,0.18)" : "rgba(134,150,160,0.22)";

  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:260, maxWidth:320, padding:"2px 0" }}>
      <audio ref={audioRef} src={src} preload="metadata" style={{ display:"none" }} />

      {/* Avatar placeholder */}
      <div style={{ position: "relative", flexShrink: 0, marginLeft: 2 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: isMine ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
           <Icon.Mic color={isMine ? "#fff" : "#8696a0"} size={22} />
        </div>
        <div style={{ 
          position: "absolute", bottom: -2, right: -4, 
          background: isMine ? "#005c4b" : "#202c33", 
          borderRadius: "50%", padding: 2, 
          border: `2px solid ${isMine ? "#005c4b" : "#202c33"}` 
        }}>
          <Icon.Mic color={isMine ? "#53bdeb" : "#8696a0"} size={10} />
        </div>
      </div>

      {/* Play / Pause */}
      <div style={{ flexShrink: 0, marginLeft: 4 }}>
        <button
          onClick={toggle}
          style={{
            width:36, height:36,
            background: "none",
            border:"none", cursor:"pointer", color: isMine ? "#fff" : "#8696a0",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"transform .1s",
            padding: 0,
          }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.92)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        >
          {playing ? (
            <Icon.Pause style={{ width: 24, height: 24 }} />
          ) : (
            <Icon.Play style={{ width: 24, height: 24 }} />
          )}
        </button>
      </div>

      {/* Waveform + time */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", gap:4, marginRight: 2 }}>
        {/* Waveform bars — clickable seek */}
        <div
          onClick={seek}
          style={{ 
            display:"flex", 
            alignItems:"center", 
            gap:2, 
            height:30, 
            cursor:"pointer",
            paddingTop: 8,
          }}
        >
          {BARS.map((h, i) => {
            const barProgress = i / BARS.length;
            const filled = barProgress <= progress;
            return (
              <div
                key={i}
                style={{
                  width:3, borderRadius:2,
                  height: `${Math.round(h * 1.5)}px`,
                  background: filled ? activeColor : inactiveColor,
                  transition:"background .15s",
                  flexShrink:0,
                }}
              />
            );
          })}
        </div>

        {/* Info Row: Time + Ticks (passed as children) */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:11, color: isMine ? "rgba(255,255,255,0.7)" : "#8696a0", fontWeight: 400 }}>
            {playing || current > 0 ? fmt(current) : (total && isFinite(total) ? fmt(total) : "0:00")}
          </span>
          {children}
        </div>
      </div>
    </div>
  );
}
