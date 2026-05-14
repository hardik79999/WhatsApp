import React, { useState, useRef } from 'react';
import Avatar from './Avatar';
import { Icon } from './Icons';
import api from '../api';

export default function ProfilePanel({ isOpen, onClose, currentUser, onProfileUpdate }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.username || '');
  const [bioInput, setBioInput] = useState(currentUser?.bio || 'Hey there! I am using WhatsApp Clone.');
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  // Name Update Logic
  const handleNameSave = async () => {
    try {
      const res = await api.put('/users/me', { username: nameInput });
      onProfileUpdate(res.data);
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update name", error);
    }
  };

  // Bio Update Logic
  const handleBioSave = async () => {
    try {
      const res = await api.put('/users/me', { bio: bioInput });
      onProfileUpdate(res.data);
      setIsEditingBio(false);
    } catch (error) {
      console.error("Failed to update bio", error);
    }
  };

  // Image Upload Logic
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await api.post('/users/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onProfileUpdate(res.data);
    } catch (error) {
      console.error("Photo upload failed", error);
      alert("Photo upload failed!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: '#111b21',
      transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      zIndex: 20
    }}>
      {/* Header */}
      <div style={{
        height: 108, background: '#202c33',
        display: 'flex', alignItems: 'flex-end',
        padding: '0 20px 20px', gap: 24, flexShrink: 0
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e9edef', display: 'flex' }}>
          <Icon.Back />
        </button>
        <span style={{ color: '#e9edef', fontSize: 19, fontWeight: 500 }}>
          Profile
        </span>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#111b21' }}>
        
        {/* Profile Picture Section */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0', position: 'relative' }}>
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{ position: 'relative', cursor: 'pointer', borderRadius: '50%', overflow: 'hidden' }}
          >
            <Avatar src={currentUser?.profile_pic} name={currentUser?.username || currentUser?.phone} size={200} />
            {/* Hover Overlay */}
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: '#fff', opacity: uploading ? 1 : 0, transition: 'opacity 0.2s',
              textAlign: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => { if(!uploading) e.currentTarget.style.opacity = 0 }}
            >
              <Icon.Camera />
              <span style={{ fontSize: 13, marginTop: 8, width: 90 }}>
                {uploading ? "UPLOADING..." : "CHANGE PROFILE PHOTO"}
              </span>
            </div>
          </div>
          {/* Hidden File Input */}
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} style={{ display: 'none' }} />
        </div>

        {/* Your Name Section */}
        <div style={{ background: '#111b21', padding: '14px 30px' }}>
          <p style={{ color: '#008069', fontSize: 14, marginBottom: 14 }}>Your name</p>
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: isEditingName ? '2px solid #00a884' : '2px solid transparent' }}>
            <input 
              type="text" 
              value={nameInput} 
              onChange={(e) => setNameInput(e.target.value)}
              disabled={!isEditingName}
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#e9edef', fontSize: 17, outline: 'none', padding: '8px 0' }}
            />
            {isEditingName ? (
              <button onClick={handleNameSave} style={{ background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer' }}>✓</button>
            ) : (
              <button onClick={() => setIsEditingName(true)} style={{ background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer' }}>✎</button>
            )}
          </div>
          <p style={{ color: '#8696a0', fontSize: 13, marginTop: 14 }}>
            This is not your username or pin. This name will be visible to your WhatsApp contacts.
          </p>
        </div>

        {/* Spacer */}
        <div style={{ height: 10, background: '#0b141a' }}></div>

        {/* About Section */}
        <div style={{ background: '#111b21', padding: '14px 30px' }}>
          <p style={{ color: '#008069', fontSize: 14, marginBottom: 14 }}>About</p>
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: isEditingBio ? '2px solid #00a884' : '2px solid transparent' }}>
            <input 
              type="text" 
              value={bioInput} 
              onChange={(e) => setBioInput(e.target.value)}
              disabled={!isEditingBio}
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#e9edef', fontSize: 17, outline: 'none', padding: '8px 0' }}
            />
            {isEditingBio ? (
              <button onClick={handleBioSave} style={{ background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer' }}>✓</button>
            ) : (
              <button onClick={() => setIsEditingBio(true)} style={{ background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer' }}>✎</button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}