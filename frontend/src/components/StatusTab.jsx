import { useState, useEffect, useCallback } from "react";
import api from "../api";
import StatusViewer  from "./StatusViewer";
import StatusCreator from "./StatusCreator";

export default function StatusTab({ currentUser }) {
  const [myStatuses,      setMyStatuses]      = useState([]);  // StatusResponse[]
  const [contactGroups,   setContactGroups]   = useState([]);  // ContactStatusGroup[]
  const [viewerOpen,      setViewerOpen]      = useState(false);
  const [viewerGroups,    setViewerGroups]    = useState([]);
  const [viewerInitIdx,   setViewerInitIdx]   = useState(0);
  const [creatorOpen,     setCreatorOpen]     = useState(false);
  const [loading,         setLoading]         = useState(true);

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

  // ── Open viewer ───────────────────────────────────────────
  const openMyStatuses = () => {
    if (!myStatuses.length) { setCreatorOpen(true); return; }
    // Wrap my statuses in a "ContactStatusGroup" shape for the viewer
    setViewerGroups([{
      user_id:     currentUser.id,
      username:    currentUser.username ?? "You",
      profile_pic: currentUser.profile_pic,
      has_unviewed: false,
      statuses:    myStatuses,
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
    fetchAll(); // Refresh view counts / ring colors
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#111b21", color: "#fff" }}>
      {/* ── My Status ─────────────────────────────────────── */}
      <div style={section}>
        <div style={sectionLabel}>MY STATUS</div>

        <div style={rowStyle} onClick={openMyStatuses}>
          {/* Avatar with ring if I have active statuses */}
          <RingAvatar
            src={currentUser.profile_pic}
            name={currentUser.username ?? "Me"}
            hasStatus={myStatuses.length > 0}
            hasUnviewed={false}   // own statuses are always "viewed"
            size={50}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>My Status</div>
            <div style={{ color: "#8696a0", fontSize: 13 }}>
              {myStatuses.length > 0
                ? `${myStatuses.length} update${myStatuses.length > 1 ? "s" : ""} · Tap to view`
                : "Tap to add status update"}
            </div>
          </div>
          {/* Add button */}
          <button
            onClick={(e) => { e.stopPropagation(); setCreatorOpen(true); }}
            style={addBtn}
            title="Add status"
          >
            +
          </button>
        </div>
      </div>

      {/* ── Recent updates ────────────────────────────────── */}
      {loading ? (
        <div style={{ color: "#8696a0", padding: "20px 16px", fontSize: 14 }}>
          Loading statuses…
        </div>
      ) : contactGroups.length === 0 ? (
        <div style={{ color: "#8696a0", padding: "20px 16px", fontSize: 14 }}>
          No recent updates from contacts.
        </div>
      ) : (
        <>
          {/* Unviewed first */}
          {contactGroups.some(g => g.has_unviewed) && (
            <div style={section}>
              <div style={sectionLabel}>RECENT UPDATES</div>
              {contactGroups
                .filter(g => g.has_unviewed)
                .map((group, i) => (
                  <ContactRow
                    key={String(group.user_id)}
                    group={group}
                    onClick={() => openContactStatus(contactGroups.indexOf(group))}
                  />
                ))}
            </div>
          )}

          {/* Viewed */}
          {contactGroups.some(g => !g.has_unviewed) && (
            <div style={section}>
              <div style={sectionLabel}>VIEWED UPDATES</div>
              {contactGroups
                .filter(g => !g.has_unviewed)
                .map((group) => (
                  <ContactRow
                    key={String(group.user_id)}
                    group={group}
                    onClick={() => openContactStatus(contactGroups.indexOf(group))}
                  />
                ))}
            </div>
          )}
        </>
      )}

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
          onClose={() => setCreatorOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

// ── Contact row ───────────────────────────────────────────

function ContactRow({ group, onClick }) {
  const latest = group.statuses[group.statuses.length - 1];
  return (
    <div style={rowStyle} onClick={onClick}>
      <RingAvatar
        src={group.profile_pic}
        name={group.username}
        hasStatus={true}
        hasUnviewed={group.has_unviewed}
        size={50}
      />
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ fontWeight: 600 }}>{group.username ?? "Unknown"}</div>
        <div style={{ color: "#8696a0", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {formatRelative(latest?.created_at)} · {group.statuses.length} update{group.statuses.length > 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

// ── Ring Avatar ────────────────────────────────────────────
// Shows a colored ring when hasStatus=true, green if unviewed, grey if viewed

function RingAvatar({ src, name, hasStatus, hasUnviewed, size }) {
  const ringColor = !hasStatus ? "transparent"
    : hasUnviewed ? "#00a884"
    : "#8696a0";

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
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
          background: "#2a2a2a",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: size * 0.36,
        }}>
          {name?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────

const section = { padding: "4px 0" };

const sectionLabel = {
  fontSize: 12, fontWeight: 600, color: "#8696a0",
  padding: "12px 16px 4px", letterSpacing: 0.5,
};

const rowStyle = {
  display: "flex", alignItems: "center", gap: 14,
  padding: "10px 16px", cursor: "pointer",
  transition: "background 0.15s",
};

const addBtn = {
  width: 32, height: 32, borderRadius: "50%",
  background: "#00a884", border: "none",
  color: "#fff", fontSize: 22, lineHeight: 1,
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", flexShrink: 0,
};

function formatRelative(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "Just now";
}
