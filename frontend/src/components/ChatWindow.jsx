import { useRef, useEffect, useState } from 'react';
import Avatar from './Avatar';
import MessageBubble from './chat/MessageBubble';
import ChatInput from './chat/ChatInput';
import TypingIndicator from './TypingIndicator';
import ImageLightbox from './chat/ImageLightbox';
import { Icon } from './Icons';
import CallButton from './CallButton';

// ── Date separator label ──────────────────────────────────────────────────────
function formatDateLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return 'Today';
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays < 7) return days[d.getDay()];
  return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// ── Empty state (no chat selected) ───────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#111b21', position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle background */}
      <div className="wa-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 40px' }}>
        {/* WA logo */}
        <svg viewBox="0 0 212 212" fill="none" width="200" height="200" style={{ opacity: 0.08, marginBottom: 24 }}>
          <circle cx="106" cy="106" r="106" fill="#00a884"/>
          <path fill="#fff" d="M106 52c-29.8 0-54 24.2-54 54 0 9.8 2.6 19 7.2 26.9L52 160l27.5-7.2c7.6 4.1 16.3 6.4 25.5 6.4 29.8 0 54-24.2 54-54S135.8 52 106 52z"/>
        </svg>
        <h2 style={{ color: '#e9edef', fontSize: 32, fontWeight: 300, margin: '0 0 16px', letterSpacing: '-0.3px' }}>
          WhatsApp Web
        </h2>
        <p style={{ color: '#8696a0', fontSize: 14, lineHeight: 1.7, margin: '0 0 28px', maxWidth: 380 }}>
          Send and receive messages without keeping your phone online.<br />
          Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#8696a0', fontSize: 13 }}>
          <Icon.Lock />
          <span>End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}

// ── Main ChatWindow ───────────────────────────────────────────────────────────
function ChatWindow({
  chat,
  messages,
  currentUser,
  onMessageSent,
  onContextMenu,
  onOpenGroupInfo,
  onOpenContactInfo,
  typingUsers = [],
  ws,
  onCallStarted,
  onMessageAction,
  replyTo,
  onCancelReply,
}) {
  const messagesEndRef = useRef(null);
  const [lightbox, setLightbox] = useState(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = messagesEndRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth' });
    const t = setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 80);
    return () => clearTimeout(t);
  }, [messages, chat?.id]);

  // Build image list for lightbox
  const imageMessages = (messages || []).filter(m => m.message_type === 'image' && m.media_url);

  const openLightbox = (msg) => {
    const images = imageMessages.map(m => ({
      url: m.media_url,
      filename: m.content || 'image',
      caption: m.caption || null,
      created_at: m.created_at,
      sender_id: m.sender_id,
    }));
    const startIndex = imageMessages.findIndex(m => m.id === msg.id);
    const participant = chat?.participants?.find(p => p.user_id === msg.sender_id);
    const senderName = msg.sender_id === currentUser?.id
      ? 'You'
      : (participant?.username || participant?.phone || 'Unknown');
    setLightbox({ images, startIndex: Math.max(startIndex, 0), senderName });
  };

  if (!chat) return <EmptyState />;

  const chatOther = chat.participants?.find(p => p.user_id !== currentUser?.id);
  const chatName = chat.is_group
    ? chat.group_name
    : (chatOther?.username || chatOther?.phone || 'Unknown');
  const chatPic = chat.is_group ? chat.group_picture : (chatOther?.profile_pic || null);

  const typingText = (() => {
    if (!typingUsers?.length) return null;
    if (!chat.is_group) return 'typing…';
    const names = typingUsers
      .map(uid => {
        const p = chat.participants?.find(pp => String(pp.user_id) === String(uid));
        return p?.username || p?.phone || null;
      })
      .filter(Boolean);
    if (!names.length) return 'typing…';
    if (names.length === 1) return `${names[0]} is typing…`;
    return `${names.slice(0, 2).join(', ')} are typing…`;
  })();

  // Build messages with date separators
  const messageItems = [];
  (messages || []).forEach((msg, i) => {
    const prev = messages[i - 1];
    if (!isSameDay(prev?.created_at, msg.created_at)) {
      messageItems.push({ type: 'date', key: `date-${msg.id}`, label: formatDateLabel(msg.created_at) });
    }
    messageItems.push({ type: 'msg', key: msg.id, msg });
  });

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative',
      minWidth: 0, width: '100%', height: '100%',
    }}>
      {/* Chat background */}
      <div className="wa-bg" style={{ position: 'absolute', inset: 0 }} />

      {/* ── Header ── */}
      <div style={{
        height: 59, background: '#202c33',
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 12,
        zIndex: 10, position: 'relative', flexShrink: 0,
        borderBottom: '1px solid #222d34',
      }}>
        {/* Avatar */}
        <div
          style={{ cursor: 'pointer', flexShrink: 0 }}
          onClick={() => chat.is_group ? onOpenGroupInfo?.() : onOpenContactInfo?.()}
        >
          <div style={{ position: 'relative' }}>
            <Avatar src={chatPic} name={chatName} size={40} isGroup={chat.is_group} />
            {!chat.is_group && chatOther?.is_online && (
              <span style={{
                position: 'absolute', bottom: 1, right: 1,
                width: 10, height: 10, borderRadius: '50%',
                background: '#00a884', border: '2px solid #202c33',
              }} />
            )}
          </div>
        </div>

        {/* Name + status */}
        <div
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          onClick={() => chat.is_group ? onOpenGroupInfo?.() : onOpenContactInfo?.()}
        >
          <div style={{
            color: '#e9edef', fontSize: 16, fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}>
            {chatName}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.3, marginTop: 1 }}>
            {typingText ? (
              <span style={{ color: '#00a884' }}>{typingText}</span>
            ) : chat.is_group ? (
              <span style={{ color: '#8696a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                {chat.participants?.map(p => p.user_id === currentUser?.id ? 'You' : p.username || p.phone).join(', ') || ''}
              </span>
            ) : (
              <span style={{ color: chatOther?.is_online ? '#00a884' : '#8696a0' }}>
                {chatOther?.is_online ? 'online' : 'click here for contact info'}
              </span>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
          {!chat.is_group && chatOther && (
            <>
              <CallButton contactId={chatOther.user_id} contactUser={chatOther} callType="video" onCallStarted={onCallStarted} />
              <CallButton contactId={chatOther.user_id} contactUser={chatOther} callType="audio" onCallStarted={onCallStarted} />
            </>
          )}
          <button className="icon-btn" title="Search"><Icon.Search /></button>
          <button className="icon-btn" title="Menu"><Icon.DotsVertical /></button>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div
        style={{
          flex: 1, overflowY: 'auto',
          padding: '8px 7% 8px',
          display: 'flex', flexDirection: 'column',
          zIndex: 10, position: 'relative',
        }}
        onClick={() => onContextMenu?.(null)}
      >
        {messages.length === 0 ? (
          <div style={{
            alignSelf: 'center', marginTop: 16,
            background: '#182229', color: '#e9edef',
            fontSize: 12.5, padding: '5px 12px',
            borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,.25)',
          }}>
            No messages yet
          </div>
        ) : (
          messageItems.map(item => {
            if (item.type === 'date') {
              return (
                <div key={item.key} className="date-separator">
                  <span>{item.label}</span>
                </div>
              );
            }
            return (
              <MessageBubble
                key={item.key}
                message={item.msg}
                isMine={String(item.msg.sender_id) === String(currentUser?.id)}
                onImageClick={openLightbox}
                onAction={onMessageAction
                  ? (action, m, payload) => onMessageAction(action, m, payload)
                  : undefined
                }
              />
            );
          })
        )}

        {typingUsers.length > 0 && (
          <div style={{ alignSelf: 'flex-start', marginTop: 4, marginBottom: 4 }}>
            <TypingIndicator />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input bar ── */}
      <ChatInput
        chatId={chat.id}
        ws={ws}
        onMessageSent={onMessageSent}
        replyTo={replyTo}
        onCancelReply={onCancelReply}
      />

      {/* ── Lightbox ── */}
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          startIndex={lightbox.startIndex}
          senderName={lightbox.senderName}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

export default ChatWindow;
