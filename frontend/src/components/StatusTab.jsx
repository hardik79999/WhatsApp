import { useState, useEffect, useCallback, useRef } from "react";
import api from "../api";
import StatusViewer  from "./StatusViewer";
import StatusCreator from "./StatusCreator";

export default function StatusTab({ currentUser }) {
  const [myStatuses,    setMyStatuses]    = useState([]);
  const [contactGroups, setContactGroups] = useState([]);
  const [viewerOpen,    setViewerOpen]    = useState(false);
  const [viewerGroups,  setViewerGroups]  = useState([]);
  const [viewerInitIdx, setViewerInitIdx] = useState(0);
  const [creatorOpen,   setCreatorOpen]   = useState(false);
  const [creatorMode,   setCreatorMode]   = useState("text"); // "text" | "media"
  const [loading,       setLoading]       = useState(true);
  const [menuOpen,      setMenuOpen]      = useState(false);  // ⊕ dropdown
  const [headerMenu,    setHeaderMenu]    = useState(false);  // ⋮ dropdown
  const menuRef   = useRef(null);
  const headerRef = useRef(null);

  // ── Fetch ────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [myRes, groupsRes] = await Promise.all([
        api.get("/statuses/my"),
        api.get("/statuses/"),
      ]);
      setMyStatuses(myRes.data);
      setContactGroups(groupsRes.data);
    } catch (err) {
      console.error("Status fetch error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (headerRef.current && !headerRef.current.contains(e.target)) setHeaderMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Open viewer ───────────────────────────────────────────
  const openMyStatuses = () => {
    if (!myStatuses.length) {
      setCreatorMode("text");
      setCreatorOpen(true);
      return;
    }
    setViewerGroups([{
      user_id:      currentUser.id,
      username:     currentUser.username ?? "You",
      profile_pic:  currentUser.profile_pic,
      has_unviewed: false,
      statuses:     myStatuses,
    }]);
    setViewerInitIdx(0);
    setViewerOpen(true);
  };

  const openContactStatus = (groupIdx) => {
    setViewerGroups(contactGroups);
    setViewerInitIdx(groupIdx);
    setViewerOpen(true);
  };

  const handleCreated = (newStatus) => {
    setMyStatuses(prev => [...prev, newStatus]);
  };

  const handleViewerClose = () => {
    setViewerOpen(false);
    fetchAll();
  };

  const openCreator = (mode) => {
    setCreatorMode(mode);
    setMenuOpen(false);
    setCreatorOpen(true);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#111b21", color: "#fff", overflow: "hidden" }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 16px 12px", flexShrink: 0,
      }}>
        <span style={{ fontSize: 20, fontWeight: 600, color: "#e9edef" }}>Status</span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {/* ⊕ Add button with dropdown */}
          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "none", border: "none",
                color: "#aebac1", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}
              title="Add status"
            >
              ⊕
            </button>
            {menuOpen && (
              <div style={{
                position: "absolute", top: 42, right: 0, zIndex: 100,
                background: "#233138", borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                minWidth: 200, overflow: "hidden",
                animation: "fadeIn .15s ease",
              }}>
                <MenuItem
                  icon="🖼️"
                  label="Photos & videos"
                  onClick={() => openCreator("media")}
                />
                <MenuItem
                  icon="✏️"
                  label="Text"
                  onClick={() => openCreator("text")}
                />
              </div>
            )}
          </div>

          {/* ⋮ Header menu */}
          <div style={{ position: "relative" }} ref={headerRef}>
            <button
              onClick={() => setHeaderMenu(o => !o)}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "none", border: "none",
                color: "#aebac1", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}
            >
              ⋮
            </button>
            {headerMenu && (
              <div style={{
                position: "absolute", top: 42, right: 0, zIndex: 100,
                background: "#233138", borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                minWidth: 180, overflow: "hidden",
              }}>
                <MenuItem label="Status privacy" onClick={() => setHeaderMenu(false)} />
                <MenuItem label="Create channel" onClick={() => setHeaderMenu(false)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* My Status row */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "10px 16px", cursor: "pointer",
            transition: "background .15s",
          }}
          onClick={openMyStatuses}
          onMouseEnter={e => e.currentTarget.style.background = "#182229"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          {/* Avatar with + badge */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <RingAvatar
              src={currentUser?.profile_pic}
              name={currentUser?.username ?? "Me"}
              hasStatus={myStatuses.length > 0}
              hasUnviewed={false}
              size={50}
            />
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              width: 20, height: 20, borderRadius: "50%",
              background: "#00a884", border: "2px solid #111b21",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 14, fontWeight: 700, lineHeight: 1,
            }}>+</div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#e9edef", fontWeight: 600, fontSize: 15 }}>My status</div>
            <div style={{ color: "#8696a0", fontSize: 13, marginTop: 2 }}>
              {myStatuses.length > 0
                ? `${myStatuses.length} update${myStatuses.length > 1 ? "s" : ""} · Tap to view`
                : "Click to add status update"}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#2a3942", margin: "4px 0" }} />

        {/* Contact statuses */}
        {loading ? (
          <div style={{ color: "#8696a0", padding: "20px 16px", fontSize: 14 }}>
            Loading statuses…
          </div>
        ) : contactGroups.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "48px 24px", gap: 12, textAlign: "center",
          }}>
            <div style={{ fontSize: 48, opacity: 0.3 }}>◎</div>
            <div style={{ color: "#e9edef", fontSize: 18, fontWeight: 500 }}>Share status updates</div>
            <div style={{ color: "#8696a0", fontSize: 14, lineHeight: 1.5 }}>
              Share photos, videos and text that disappear after 24 hours.
            </div>
          </div>
        ) : (
          <>
            {contactGroups.some(g => g.has_unviewed) && (
              <>
                <SectionLabel>Recent</SectionLabel>
                {contactGroups
                  .filter(g => g.has_unviewed)
                  .map(group => (
                    <ContactRow
                      key={String(group.user_id)}
                      group={group}
                      onClick={() => openContactStatus(contactGroups.indexOf(group))}
                    />
                  ))}
              </>
            )}
            {contactGroups.some(g => !g.has_unviewed) && (
              <>
                <SectionLabel>Viewed</SectionLabel>
                {contactGroups
                  .filter(g => !g.has_unviewed)
                  .map(group => (
                    <ContactRow
                      key={String(group.user_id)}
                      group={group}
                      onClick={() => openContactStatus(contactGroups.indexOf(group))}
                    />
                  ))}
              </>
            )}
          </>
        )}

        {/* Bottom encryption note */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, padding: "20px 16px", color: "#8696a0", fontSize: 12,
        }}>
          <span>🔒</span>
          <span>Your status updates are end-to-end encrypted</span>
        </div>
      </div>

      {/* Modals */}
      {viewerOpen && (
        <StatusViewer
          groups={viewerGroups}
          initialGroup={viewerInitIdx}
          onClose={handleViewerClose}
        />
      )}
      {creatorOpen && (
        <StatusCreator
          initialMode={creatorMode}
          onClose={() => setCreatorOpen(false)}
          onCreated={handleCreated}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 600, color: "#8696a0",
      padding: "10px 16px 4px", letterSpacing: 0.3,
    }}>
      {children}
    </div>
  );
}

function MenuItem({ icon, label, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 20px", cursor: "pointer", color: "#e9edef",
        fontSize: 15, transition: "background .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#2a3942"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      <span>{label}</span>
    </div>
  );
}

function ContactRow({ group, onClick }) {
  const latest = group.statuses[group.statuses.length - 1];
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "10px 16px", cursor: "pointer",
        transition: "background .15s",
      }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.background = "#182229"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <RingAvatar
        src={group.profile_pic}
        name={group.username}
        hasStatus={true}
        hasUnviewed={group.has_unviewed}
        size={50}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#e9edef", fontWeight: 600, fontSize: 15 }}>
          {group.username ?? "Unknown"}
        </div>
        <div style={{ color: "#8696a0", fontSize: 13, marginTop: 2 }}>
          {formatRelative(latest?.created_at)}
        </div>
      </div>
    </div>
  );
}

function RingAvatar({ src, name, hasStatus, hasUnviewed, size }) {
  const ringColor = !hasStatus ? "transparent"
    : hasUnviewed ? "#00a884"
    : "#8696a0";

  return (
    <div style={{
      width: size + 6, height: size + 6, borderRadius: "50%",
      border: `2.5px solid ${ringColor}`,
      padding: 2, flexShrink: 0,
      boxSizing: "border-box",
    }}>
      {src ? (
        <img src={src} alt={name} style={{
          width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover",
        }} />
      ) : (
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%",
          background: "#2a3942",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: size * 0.36,
        }}>
          {name?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );
}

function formatRelative(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `Today at ${new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (m > 0) return `${m}m ago`;
  return "Just now";
}
