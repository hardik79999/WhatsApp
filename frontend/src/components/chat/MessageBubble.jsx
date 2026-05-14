import AudioPlayer from "./AudioPlayer";

// ── Tick icons (WhatsApp-exact SVG paths) ─────────────────────────────────────
function Ticks({ status }) {
  if (status === "sent") {
    return (
      <svg viewBox="0 0 16 15" width="16" height="15" fill="#8696a0">
        <path d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.74a.366.366 0 0 0-.516.005l-.427.428a.364.364 0 0 0-.002.514l3.127 3.126c.192.191.514.173.684-.044l6.082-7.942a.363.363 0 0 0-.063-.51z" />
      </svg>
    );
  }
  const color = status === "read" ? "#53bdeb" : "#8696a0";
  return (
    <svg viewBox="0 0 16 15" width="16" height="15" fill={color}>
      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.54l1.32 1.267c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.74a.366.366 0 0 0-.516.005l-.427.428a.364.364 0 0 0-.002.514l3.127 3.126c.192.191.514.173.684-.044l6.082-7.942a.363.363 0 0 0-.063-.51z" />
    </svg>
  );
}

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Timestamp + ticks row ─────────────────────────────────────────────────────
function MetaRow({ message, isMine, overlay = false }) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const style = overlay
    ? {
        position: "absolute",
        bottom: 6,
        right: 8,
        display: "flex",
        alignItems: "center",
        gap: 3,
        background: "rgba(11,20,26,.55)",
        borderRadius: 6,
        padding: "2px 5px",
      }
    : {
        display: "flex",
        alignItems: "center",
        gap: 3,
        float: "right",
        marginTop: 2,
        marginLeft: 8,
        height: 15,
      };

  return (
    <div style={style}>
      <span style={{ fontSize: 11, color: overlay ? "#fff" : "#8696a0", lineHeight: 1 }}>
        {time}
      </span>
      {isMine && <Ticks status={message.status} />}
    </div>
  );
}

// ── File icon ─────────────────────────────────────────────────────────────────
function FileIcon() {
  return (
    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  );
}

// ── Bubble tail SVG ───────────────────────────────────────────────────────────
function Tail({ isMine }) {
  return isMine ? (
    <svg viewBox="0 0 8 13" width="8" height="13"
      style={{ position:"absolute", bottom:0, right:-8, color:"#005c4b" }}
      fill="currentColor">
      <path d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z"/>
    </svg>
  ) : (
    <svg viewBox="0 0 8 13" width="8" height="13"
      style={{ position:"absolute", bottom:0, left:-8, color:"#202c33" }}
      fill="currentColor">
      <path d="M2.812 0H8v11.193L1.533 2.568C.474 1.156 1.042 0 2.812 0z"/>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MessageBubble({ message, isMine, onImageClick }) {
  const bgColor  = isMine ? "#005c4b" : "#202c33";
  const textColor = "#e9edef";

  const bubbleStyle = {
    position: "relative",
    maxWidth: "75%",
    borderRadius: 7.5,
    background: bgColor,
    color: textColor,
    boxShadow: "0 1px 0.5px rgba(11,20,26,.13)",
    // Remove the corner on the tail side
    ...(isMine
      ? { borderBottomRightRadius: 0 }
      : { borderBottomLeftRadius: 0 }),
  };

  const { message_type, media_url, content, file_size, duration } = message;

  // ── Deleted message ──────────────────────────────────────────────────────
  if (message.is_deleted || message.is_deleted_for_everyone) {
    return (
      <div style={{ display:"flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom:2 }}>
        <div style={{ ...bubbleStyle, padding:"6px 10px 8px" }}>
          <Tail isMine={isMine} />
          <p style={{ fontSize:14, fontStyle:"italic", color:"#8696a0", margin:0 }}>
            🚫 This message was deleted
          </p>
          <MetaRow message={message} isMine={isMine} />
          <div style={{ clear:"both" }} />
        </div>
      </div>
    );
  }

  // ── Image ────────────────────────────────────────────────────────────────
  if (message_type === "image") {
    return (
      <div style={{ display:"flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom:2 }}>
        <div style={{ ...bubbleStyle, padding:0, overflow:"hidden", minWidth:100 }}>
          <Tail isMine={isMine} />
          <div
            onClick={() => onImageClick && onImageClick(message)}
            style={{ display:"block", cursor:"pointer" }}
          >
            <img
              src={media_url}
              alt="Image"
              style={{
                display:"block",
                maxWidth:280,
                maxHeight:280,
                minWidth:100,
                width:"100%",
                objectFit:"cover",
                borderRadius: isMine
                  ? "7.5px 7.5px 0 7.5px"
                  : "7.5px 7.5px 7.5px 0",
                transition:"filter .15s",
              }}
              onMouseEnter={e => e.target.style.filter = "brightness(0.88)"}
              onMouseLeave={e => e.target.style.filter = "none"}
              onError={e => { e.target.style.display="none"; }}
            />
          </div>
          {content && (
            <p style={{ margin:"4px 10px 2px", fontSize:14, lineHeight:1.5 }}>{content}</p>
          )}
          {/* Overlay timestamp on image */}
          <MetaRow message={message} isMine={isMine} overlay={!content} />
          {content && <div style={{ clear:"both", paddingBottom:4 }} />}
        </div>
      </div>
    );
  }

  // ── Audio / Voice note ───────────────────────────────────────────────────
  if (message_type === "audio") {
    return (
      <div style={{ display:"flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom:2 }}>
        <div style={{ ...bubbleStyle, padding:"8px 10px 6px" }}>
          <Tail isMine={isMine} />
          <AudioPlayer src={media_url} duration={duration} isMine={isMine} />
          <MetaRow message={message} isMine={isMine} />
          <div style={{ clear:"both" }} />
        </div>
      </div>
    );
  }

  // ── Video ────────────────────────────────────────────────────────────────
  if (message_type === "video") {
    return (
      <div style={{ display:"flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom:2 }}>
        <div style={{ ...bubbleStyle, padding:0, overflow:"hidden" }}>
          <Tail isMine={isMine} />
          <video
            src={media_url}
            controls
            style={{
              display:"block",
              maxWidth:280,
              maxHeight:220,
              borderRadius: isMine ? "7.5px 7.5px 0 7.5px" : "7.5px 7.5px 7.5px 0",
            }}
          />
          {content && (
            <p style={{ margin:"4px 10px 2px", fontSize:14 }}>{content}</p>
          )}
          <MetaRow message={message} isMine={isMine} />
          <div style={{ clear:"both", paddingBottom:4 }} />
        </div>
      </div>
    );
  }

  // ── Document ─────────────────────────────────────────────────────────────
  if (message_type === "document") {
    return (
      <div style={{ display:"flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom:2 }}>
        <div style={{ ...bubbleStyle, padding:"6px 10px 8px" }}>
          <Tail isMine={isMine} />
          <a
            href={media_url}
            target="_blank"
            rel="noreferrer"
            style={{
              display:"flex", alignItems:"center", gap:10,
              background:"rgba(0,0,0,0.15)", borderRadius:8,
              padding:"8px 10px", textDecoration:"none", color:"inherit",
              marginBottom:4,
            }}
          >
            <span style={{ opacity:0.7, flexShrink:0 }}><FileIcon /></span>
            <div style={{ minWidth:0 }}>
              <p style={{ margin:0, fontSize:14, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160 }}>
                {content || "Document"}
              </p>
              {file_size && (
                <p style={{ margin:0, fontSize:12, color:"#8696a0" }}>{formatSize(file_size)}</p>
              )}
            </div>
          </a>
          <MetaRow message={message} isMine={isMine} />
          <div style={{ clear:"both" }} />
        </div>
      </div>
    );
  }

  // ── Text (default) ───────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom:2 }}>
      <div style={{ ...bubbleStyle, padding:"6px 10px 8px", minWidth:80 }}>
        <Tail isMine={isMine} />
        <p style={{ margin:0, fontSize:14.5, lineHeight:1.5, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
          {content}
        </p>
        <MetaRow message={message} isMine={isMine} />
        <div style={{ clear:"both" }} />
      </div>
    </div>
  );
}
