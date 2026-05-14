// ContactInfoPanel.jsx
// WhatsApp-style "Contact info" slide-in panel for 1-on-1 chats

import { useState, useEffect } from 'react';
import Avatar from './Avatar';
import { Icon } from './Icons';
import api from '../api';

export default function ContactInfoPanel({ contact, isOpen, onClose }) {
  const [sharedImages, setSharedImages] = useState([]);
  const [mediaCount, setMediaCount] = useState(0);
  const [mediaChatId, setMediaChatId] = useState(null);
  const loadingMedia =
    !!isOpen &&
    !!contact?.chat_id &&
    String(mediaChatId) !== String(contact.chat_id);

  // Fetch shared media when panel opens
  useEffect(() => {
    if (!isOpen || !contact?.chat_id) return;

    const chatId = contact.chat_id;
    // If we already loaded this chat's media and panel just reopened, skip refetch.
    if (String(mediaChatId) === String(chatId)) return;

    let cancelled = false;
    api.get(`/messages/${chatId}`)
      .then(res => {
        if (cancelled) return;
        const imgs = (res.data || []).filter(
          m => m.message_type === 'image' && m.media_url
        );
        setMediaCount(imgs.length);
        // Show last 9 as thumbnails
        setSharedImages(imgs.slice(-9).reverse());
        setMediaChatId(chatId);
      })
      .catch(() => {
        if (cancelled) return;
        setSharedImages([]);
        setMediaCount(0);
        setMediaChatId(chatId);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, contact?.chat_id, mediaChatId]);

  if (!contact) return null;

  const displayName = contact.username || contact.phone || 'Unknown';
  const phone       = contact.phone || '';
  const bio         = contact.bio || 'Hey there! I am using WhatsApp.';
  const isOnline    = contact.is_online;

  return (
    <div
      style={{
        width: isOpen ? 380 : 0,
        minWidth: 0,
        background: '#111b21',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: isOpen ? '1px solid #2a3942' : 'none',
        overflow: 'hidden',
        transition: 'width .25s cubic-bezier(.4,0,.2,1)',
        flexShrink: 0,
      }}
    >
      {isOpen && (
        <>
          {/* ── Header ── */}
          <div style={{
            background: '#202c33',
            padding: '0 16px',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexShrink: 0,
            borderBottom: '1px solid #2a3942',
          }}>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aebac1', display: 'flex', padding: 4, borderRadius: 4 }}
            >
              <Icon.Back />
            </button>
            <span style={{ color: '#e9edef', fontSize: 19, fontWeight: 500 }}>Contact info</span>
          </div>

          {/* ── Scrollable body ── */}
          <div style={{ flex: 1, overflowY: 'auto' }}>

            {/* ── Profile card ── */}
            <div style={{
              background: '#202c33',
              padding: '32px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}>
              {/* Avatar with online ring */}
              <div style={{ position: 'relative', marginBottom: 4 }}>
                <div style={{
                  borderRadius: '50%',
                  overflow: 'hidden',
                  width: 120,
                  height: 120,
                  outline: isOnline ? '3px solid #00a884' : 'none',
                  outlineOffset: 2,
                }}>
                  <Avatar src={contact.profile_pic} name={displayName} size={120} />
                </div>
                {isOnline && (
                  <span style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#00a884',
                    border: '2.5px solid #202c33',
                  }} />
                )}
              </div>

              {/* Name */}
              <div style={{ color: '#e9edef', fontSize: 22, fontWeight: 500, textAlign: 'center', marginTop: 4 }}>
                {displayName}
              </div>

              {/* Phone */}
              {phone && (
                <div style={{ color: '#8696a0', fontSize: 14 }}>{phone}</div>
              )}

              {/* Online status badge */}
              <div style={{
                fontSize: 13,
                color: isOnline ? '#00a884' : '#8696a0',
                fontWeight: isOnline ? 500 : 400,
                marginTop: 2,
              }}>
                {isOnline ? 'online' : 'last seen recently'}
              </div>
            </div>

            {/* ── About ── */}
            <div style={{ background: '#202c33', padding: '16px 24px 18px', marginTop: 8 }}>
              <div style={{ color: '#00a884', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>About</div>
              <div style={{ color: '#e9edef', fontSize: 15, lineHeight: 1.6 }}>{bio}</div>
            </div>

            {/* ── Media, links and docs ── */}
            <div style={{ background: '#202c33', marginTop: 8 }}>
              {/* Row header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: sharedImages.length > 0 ? '1px solid #2a3942' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ color: '#aebac1', display: 'flex' }}><Icon.Document /></span>
                  <span style={{ color: '#e9edef', fontSize: 16 }}>Media, links and docs</span>
                </div>
                <span style={{ color: '#8696a0', fontSize: 14 }}>{mediaCount}</span>
              </div>

              {/* Image thumbnails grid */}
              {loadingMedia ? (
                <div style={{ padding: '12px 20px', color: '#8696a0', fontSize: 13 }}>Loading…</div>
              ) : sharedImages.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 2,
                }}>
                  {sharedImages.map(m => (
                    <div
                      key={m.id}
                      style={{ aspectRatio: '1', overflow: 'hidden', cursor: 'pointer', background: '#111b21' }}
                    >
                      <img
                        src={m.media_url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { e.target.parentElement.style.display = 'none'; }}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* ── Action rows ── */}
            <div style={{ background: '#202c33', marginTop: 8 }}>
              <ActionRow icon="⭐" label="Starred messages" />
              <ActionRow icon="🔕" label="Disappearing messages" sub="Off" />
              <ActionRow icon="🔒" label="Advanced chat privacy" sub="Off" />
              <ActionRow icon="🔐" label="Encryption" sub="Messages are end-to-end encrypted. Click to verify." />
            </div>

            <div style={{ background: '#202c33', marginTop: 8 }}>
              <ActionRow icon="❤️" label="Add to favourites" />
              <ActionRow icon="📋" label="Add to list" />
            </div>

            {/* ── Danger zone ── */}
            <div style={{ background: '#202c33', marginTop: 8, marginBottom: 8 }}>
              <DangerRow icon="🚫" label={`Block ${displayName}`} />
              <DangerRow icon="👎" label="Report" />
            </div>

          </div>
        </>
      )}
    </div>
  );
}

function ActionRow({ icon, label, sub }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '13px 20px',
        cursor: 'pointer',
        borderBottom: '1px solid #2a3942',
        transition: 'background .12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#2a3942'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#e9edef', fontSize: 15 }}>{label}</div>
        {sub && <div style={{ color: '#8696a0', fontSize: 13, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function DangerRow({ icon, label }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '13px 20px',
        cursor: 'pointer',
        borderBottom: '1px solid #2a3942',
        transition: 'background .12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#2a3942'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ color: '#f15c6d', fontSize: 15 }}>{label}</div>
    </div>
  );
}
