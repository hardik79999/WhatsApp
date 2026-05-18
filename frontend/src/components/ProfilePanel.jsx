// ProfilePanel.jsx
// WhatsApp-style settings panel with profile photo, name, about, and settings rows.

import { useState, useRef, useEffect } from "react";
import Avatar from "./Avatar";
import { Icon } from "./Icons";
import api from "../api";
import { showToast } from "./Toast";
import { validateFileUpload, validateUsername } from "../utils/validators";

const SETTINGS_ITEMS = [
  { icon: "👤", label: "Profile",       sub: "Name, profile photo",           key: "profile" },
  { icon: "🔑", label: "Account",       sub: "Security notifications, account info", key: "account" },
  { icon: "🔒", label: "Privacy",       sub: "Blocked contacts, disappearing messages", key: "privacy" },
  { icon: "💬", label: "Chats",         sub: "Theme, wallpaper, chat settings", key: "chats" },
  { icon: "🔔", label: "Notifications", sub: "Messages, groups, sounds",       key: "notifications" },
  { icon: "⌨️", label: "Keyboard shortcuts", sub: "Quick actions",             key: "keyboard" },
  { icon: "❓", label: "Help and feedback", sub: "FAQ, contact us, privacy policy", key: "help" },
];

export default function ProfilePanel({ isOpen, onClose, currentUser, onProfileUpdate }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio,  setIsEditingBio]  = useState(false);
  const [nameInput,     setNameInput]     = useState(currentUser?.username || "");
  const [bioInput,      setBioInput]      = useState(currentUser?.bio || "Hey there! I am using WhatsApp.");
  const [uploading,     setUploading]     = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [profileError,  setProfileError]  = useState("");

  const fileInputRef = useRef(null);
  const nameRef      = useRef(null);
  const bioRef       = useRef(null);

  // Sync inputs when currentUser changes
  useEffect(() => {
    setNameInput(currentUser?.username || "");
    setBioInput(currentUser?.bio || "Hey there! I am using WhatsApp.");
  }, [currentUser?.username, currentUser?.bio]);

  // Auto-focus when editing starts
  useEffect(() => { if (isEditingName) nameRef.current?.focus(); }, [isEditingName]);
  useEffect(() => { if (isEditingBio)  bioRef.current?.focus();  }, [isEditingBio]);

  const handleNameSave = async () => {
    const validation = validateUsername(nameInput);
    if (!validation.valid) {
      setProfileError(validation.error);
      return;
    }
    setProfileError("");
    try {
      const res = await api.put("/users/me", { username: validation.value });
      onProfileUpdate(res.data);
      setIsEditingName(false);
    } catch (err) {
      showToast(err.message || "Failed to update name", "error");
    }
  };

  const handleBioSave = async () => {
    if (bioInput.trim().length > 200) {
      setProfileError("Bio 200 characters se chhota hona chahiye");
      return;
    }
    setProfileError("");
    try {
      const res = await api.put("/users/me", { bio: bioInput.trim() });
      onProfileUpdate(res.data);
      setIsEditingBio(false);
    } catch (err) {
      showToast(err.message || "Failed to update bio", "error");
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileError("Profile photo image file hona chahiye");
      return;
    }
    const validation = validateFileUpload(file);
    if (!validation.valid) {
      setProfileError(validation.error);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await api.post("/users/me/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onProfileUpdate(res.data);
    } catch (err) {
      showToast(err.message || "Photo upload failed!", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleKeyDown = (e, saveFn, cancelFn) => {
    if (e.key === "Enter") saveFn();
    if (e.key === "Escape") cancelFn();
  };

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      background: "#111b21",
      transition: "transform .3s cubic-bezier(.4,0,.2,1)",
      transform: isOpen ? "translateX(0)" : "translateX(-100%)",
      zIndex: 20,
    }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{
        height: 108, background: "#202c33",
        display: "flex", alignItems: "flex-end",
        padding: "0 20px 20px", gap: 20, flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#e9edef", display: "flex", padding: 0 }}
        >
          <Icon.Back />
        </button>
        <span style={{ color: "#e9edef", fontSize: 19, fontWeight: 500 }}>
          {currentUser?.username || "Profile"}
        </span>
      </div>

      {/* ── Scrollable content ─────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Search bar */}
        <div style={{ padding: "12px 16px", background: "#111b21" }}>
          <div style={{
            background: "#202c33", borderRadius: 8,
            display: "flex", alignItems: "center", padding: "8px 14px", gap: 10,
          }}>
            <span style={{ color: "#8696a0", fontSize: 16 }}>🔍</span>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: "#e9edef", fontSize: 15, caretColor: "#00a884",
              }}
            />
          </div>
        </div>

        {/* ── Profile photo + name ─────────────────────────── */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "16px 0 24px", gap: 12,
        }}>
          {/* Avatar with hover overlay */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{ position: "relative", cursor: "pointer" }}
          >
            <div style={{ borderRadius: "50%", overflow: "hidden", width: 160, height: 160 }}>
              <Avatar
                src={currentUser?.profile_pic}
                name={currentUser?.username || currentUser?.phone}
                size={160}
              />
            </div>
            {/* Hover overlay */}
            <div
              className="photo-overlay"
              style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "rgba(0,0,0,0.55)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                color: "#fff", opacity: uploading ? 1 : 0,
                transition: "opacity 0.2s", textAlign: "center",
                gap: 6,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => { if (!uploading) e.currentTarget.style.opacity = 0; }}
            >
              <span style={{ fontSize: 28 }}>📷</span>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, width: 80, lineHeight: 1.3 }}>
                {uploading ? "UPLOADING…" : "CHANGE PROFILE PHOTO"}
              </span>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            style={{ display: "none" }}
          />

          {/* Name display */}
          <div style={{ color: "#e9edef", fontSize: 20, fontWeight: 600 }}>
            {currentUser?.username || currentUser?.phone || "You"}
          </div>
          {profileError && (
            <div style={{ color: "#f15c6d", fontSize: 13, padding: "0 30px", textAlign: "center" }}>
              {profileError}
            </div>
          )}
        </div>

        {/* ── Your name ────────────────────────────────────── */}
        <div style={{ background: "#111b21", padding: "0 30px 16px" }}>
          <p style={{ color: "#00a884", fontSize: 13, marginBottom: 8, fontWeight: 500 }}>Your name</p>
          <div style={{
            display: "flex", alignItems: "center",
            borderBottom: `2px solid ${isEditingName ? "#00a884" : "#2a3942"}`,
            paddingBottom: 6,
          }}>
            <input
              ref={nameRef}
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => handleKeyDown(e, handleNameSave, () => { setIsEditingName(false); setNameInput(currentUser?.username || ""); })}
              disabled={!isEditingName}
              style={{
                flex: 1, background: "transparent", border: "none",
                color: "#e9edef", fontSize: 17, outline: "none", padding: "6px 0",
              }}
            />
            {isEditingName ? (
              <div style={{ display: "flex", gap: 4 }}>
                <IconBtn onClick={() => { setIsEditingName(false); setNameInput(currentUser?.username || ""); }} title="Cancel">✕</IconBtn>
                <IconBtn onClick={handleNameSave} title="Save" green>✓</IconBtn>
              </div>
            ) : (
              <IconBtn onClick={() => setIsEditingName(true)} title="Edit">✎</IconBtn>
            )}
          </div>
          <p style={{ color: "#8696a0", fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
            This is not your username or pin. This name will be visible to your WhatsApp contacts.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 8, background: "#0b141a" }} />

        {/* ── About ────────────────────────────────────────── */}
        <div style={{ background: "#111b21", padding: "14px 30px 16px" }}>
          <p style={{ color: "#00a884", fontSize: 13, marginBottom: 8, fontWeight: 500 }}>About</p>
          <div style={{
            display: "flex", alignItems: "center",
            borderBottom: `2px solid ${isEditingBio ? "#00a884" : "#2a3942"}`,
            paddingBottom: 6,
          }}>
            <input
              ref={bioRef}
              type="text"
              value={bioInput}
              onChange={e => setBioInput(e.target.value)}
              onKeyDown={e => handleKeyDown(e, handleBioSave, () => { setIsEditingBio(false); setBioInput(currentUser?.bio || "Hey there! I am using WhatsApp."); })}
              disabled={!isEditingBio}
              style={{
                flex: 1, background: "transparent", border: "none",
                color: "#e9edef", fontSize: 17, outline: "none", padding: "6px 0",
              }}
            />
            {isEditingBio ? (
              <div style={{ display: "flex", gap: 4 }}>
                <IconBtn onClick={() => { setIsEditingBio(false); setBioInput(currentUser?.bio || "Hey there! I am using WhatsApp."); }} title="Cancel">✕</IconBtn>
                <IconBtn onClick={handleBioSave} title="Save" green>✓</IconBtn>
              </div>
            ) : (
              <IconBtn onClick={() => setIsEditingBio(true)} title="Edit">✎</IconBtn>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 8, background: "#0b141a" }} />

        {/* ── Settings rows ─────────────────────────────────── */}
        <div style={{ background: "#111b21" }}>
          {SETTINGS_ITEMS
            .filter(item =>
              !searchQuery.trim() ||
              item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.sub.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(item => (
              <SettingsRow key={item.key} icon={item.icon} label={item.label} sub={item.sub} />
            ))
          }
        </div>

        {/* Bottom padding */}
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

function SettingsRow({ icon, label, sub }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 20,
        padding: "14px 24px", cursor: "pointer",
        transition: "background .15s",
        borderBottom: "1px solid #1f2c34",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#182229"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "#2a3942",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#e9edef", fontSize: 15, fontWeight: 500 }}>{label}</div>
        <div style={{ color: "#8696a0", fontSize: 13, marginTop: 2 }}>{sub}</div>
      </div>
      <span style={{ color: "#8696a0", fontSize: 18 }}>›</span>
    </div>
  );
}

function IconBtn({ onClick, title, green, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "none", border: "none",
        color: green ? "#00a884" : "#8696a0",
        fontSize: 18, cursor: "pointer",
        width: 32, height: 32,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "50%", transition: "background .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#2a3942"}
      onMouseLeave={e => e.currentTarget.style.background = "none"}
    >
      {children}
    </button>
  );
}
