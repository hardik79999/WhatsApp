import { useRef, useState, useEffect } from "react";

export default function AudioPlayer({ src, duration }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(duration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime);
    const onLoaded = () => setTotal(audio.duration || duration || 0);
    const onEnd = () => { setPlaying(false); setCurrent(0); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
    };
  }, [duration]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio || !total) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * total;
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 min-w-[180px] max-w-[260px]">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      {/* Play / Pause button */}
      <button
        onClick={toggle}
        className="w-8 h-8 flex-shrink-0 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
      >
        {playing ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      {/* Waveform / progress bar */}
      <div className="flex-1 flex flex-col gap-1">
        <div
          className="h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer relative"
          onClick={seek}
        >
          <div
            className="absolute top-0 left-0 h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          {fmt(current)} / {fmt(total)}
        </span>
      </div>
    </div>
  );
}