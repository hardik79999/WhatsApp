import { useState, useRef, useEffect, useCallback } from 'react';
import AudioPlayer from './AudioPlayer';
import { Icon } from '../Icons';

// ── Tick icons ────────────────────────────────────────────────────────────────
function Ticks({ status }) {
  if (status === 'sent') {
    return (
      <svg viewBox="0 0 16 15" width="16" height="15" fill="#8696a0">
        <path d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.74a.366.366 0 0 0-.516.005l-.427.428a.364.364 0 0 0-.002.514l3.127 3.126c.192.191.514.173.684-.044l6.082-7.942a.363.363 0 0 0-.063-.51z"/>
      </svg>
    );
  }
  const color = status === 'read' ? '#53bdeb' : '#8696a0';
  return (
    <svg viewBox="0 0 16 15" width="16" height="15" fill={color}>
      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.54l1.32 1.267c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.74a.366.366 0 0 0-.516.005l-.427.428a.364.364 0 0 0-.002.514l3.127 3.126c.192.191.514.173.684-.044l6.082-7.942a.363.363 0 0 0-.063-.51z"/>
    </svg>
  );
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Reply quote ───────────────────────────────────────────────────────────────
function ReplyQuote({ repliedMessage, isMine }) {
  if (!repliedMessage) return null;
  const previewText = repliedMessage.message_type && repliedMessage.message_type !== 'text'
    ? `📎 ${repliedMessage.message_type}`
    : repliedMessage.content || '';
  return (
    <div style={{
      borderLeft: '3px solid #00a884',
      background: isMine ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.06)',
      borderRadius: '4px 6px 6px 4px',
      padding: '5px 10px', marginBottom: 6,
      maxWidth: '100%', overflow: 'hidden',
    }}>
      <div style={{ color: '#00a884', fontSize: 12, fontWeight: 600, marginBottom: 1 }}>Replying to</div>
      <div style={{ color: '#8696a0', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {previewText}
      </div>
    </div>
  );
}

// ── Meta row (time + ticks) ───────────────────────────────────────────────────
function MetaRow({ message, isMine, overlay = false, inline = false }) {
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (overlay) {
    return (
      <div style={{
        position: 'absolute', bottom: 6, right: 8,
        display: 'flex', alignItems: 'center', gap: 3,
        background: 'rgba(11,20,26,.55)', borderRadius: 6, padding: '2px 5px',
      }}>
        {message.is_edited && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>edited</span>}
        <span style={{ fontSize: 11, color: '#fff', lineHeight: 1 }}>{time}</span>
        {isMine && <Ticks status={message.status} />}
      </div>
    );
  }

  if (inline) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {message.is_edited && <span style={{ fontSize: 11, color: '#8696a0', lineHeight: 1 }}>edited</span>}
        <span style={{ fontSize: 11, color: '#8696a0', lineHeight: 1 }}>{time}</span>
        {isMine && <Ticks status={message.status} />}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      float: 'right', marginTop: 2, marginLeft: 8,
      height: 15, position: 'relative', bottom: -2,
    }}>
      {message.is_edited && <span style={{ fontSize: 11, color: '#8696a0', lineHeight: 1 }}>edited</span>}
      <span style={{ fontSize: 11, color: '#8696a0', lineHeight: 1 }}>{time}</span>
      {isMine && <Ticks status={message.status} />}
    </div>
  );
}

// ── File icon ─────────────────────────────────────────────────────────────────
function FileIcon() {
  return (
    <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  );
}

// ── Quick emojis + context menu ───────────────────────────────────────────────
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

function MessageContextMenu({ x, y, isMine, message, onClose, onAction }) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    let nx = x, ny = y;
    if (ny + rect.height > vh - 8) ny = y - rect.height;
    if (nx + rect.width > vw - 8) nx = vw - rect.width - 8;
    if (nx < 8) nx = 8;
    if (ny < 8) ny = 8;
    setPos({ x: nx, y: ny });
  }, [x, y]);

  useEffect(() => {
    const onMouse = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onMouse); document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const isText = !message.message_type || message.message_type === 'text';
  const items = [
    { key: 'info',    label: 'Message info',  icon: <Icon.MessageInfo />, show: isMine },
    { key: 'reply',   label: 'Reply',         icon: <Icon.Reply /> },
    { key: 'copy',    label: 'Copy',          icon: <Icon.Copy />,        show: isText },
    { key: 'react',   label: 'React',         icon: <Icon.React /> },
    { key: 'forward', label: 'Forward',       icon: <Icon.Forward /> },
    { key: 'pin',     label: 'Pin',           icon: <Icon.Pin /> },
    { key: 'star',    label: 'Star',          icon: <Icon.Star /> },
    { key: 'delete',  label: 'Delete',        icon: <Icon.Delete />, danger: true },
  ].filter(i => i.show !== false);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: pos ? pos.x : x, top: pos ? pos.y : y,
        zIndex: 9999, background: '#233138',
        borderRadius: 10, boxShadow: '0 6px 28px rgba(0,0,0,.5)',
        minWidth: 210, overflow: 'hidden',
        userSelect: 'none', visibility: pos ? 'visible' : 'hidden',
        animation: 'fadeIn .1s ease',
      }}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Quick emoji row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        padding: '10px 12px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {QUICK_EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => { onAction('react', emoji); onClose(); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 22, padding: '2px 5px', borderRadius: 6,
              transition: 'transform .1s, background .1s', lineHeight: 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'none'; }}
          >
            {emoji}
          </button>
        ))}
      </div>
      {items.map(item => (
        <button
          key={item.key}
          onClick={() => { onAction(item.key); onClose(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            width: '100%', background: 'none', border: 'none',
            cursor: 'pointer', color: item.danger ? '#f15c6d' : '#e9edef',
            padding: '11px 18px', fontSize: 14.5, textAlign: 'left',
            transition: 'background .1s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <span style={{ opacity: item.danger ? 1 : 0.75, flexShrink: 0 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ── Reactions display ─────────────────────────────────────────────────────────
function ReactionsBar({ reactions, isMine, title }) {
  if (!reactions?.length) return null;
  return (
    <div
      title={title}
      style={{
        position: 'absolute', bottom: -12,
        right: isMine ? 8 : 'auto', left: isMine ? 'auto' : 8,
        background: '#202c33', borderRadius: 12,
        padding: '2px 6px', display: 'flex', gap: 2,
        fontSize: 14, boxShadow: '0 1px 3px rgba(0,0,0,.35)',
        cursor: 'default', border: '1px solid #2a3942', zIndex: 2,
      }}
    >
      {reactions.slice(0, 3).map((r, i) => <span key={i}>{r.reaction}</span>)}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function MessageBubble({ message, isMine, onImageClick, onAction }) {
  const [ctxMenu, setCtxMenu] = useState(null);
  const holdTimer = useRef(null);

  const openMenu = useCallback((x, y) => setCtxMenu({ x, y }), []);

  const handleContextMenu = (e) => { e.preventDefault(); openMenu(e.clientX, e.clientY); };
  const handleTouchStart = (e) => {
    const t = e.touches[0];
    holdTimer.current = setTimeout(() => openMenu(t.clientX, t.clientY), 500);
  };
  const handleTouchEnd = () => clearTimeout(holdTimer.current);

  const handleAction = (action, payload) => {
    if (action === 'copy' && message.content) navigator.clipboard.writeText(message.content).catch(() => {});
    if (onAction) onAction(action, message, payload);
  };

  const wrapperProps = {
    onContextMenu: handleContextMenu,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchEnd,
  };

  const { message_type, media_url, content, file_size, duration } = message;
  const reactions = message.reactions || [];
  const reactionTitle = reactions.map(r => `${r.username || r.user_id}: ${r.reaction}`).join('\n');
  const bubbleClass = isMine ? 'bubble-out' : 'bubble-in';

  // Shared bubble base style
  const base = {
    position: 'relative',
    maxWidth: '65%',
    borderRadius: '7.5px',
    background: isMine ? '#005c4b' : '#202c33',
    color: '#e9edef',
    boxShadow: '0 1px 2px rgba(0,0,0,.2)',
    ...(isMine ? { borderTopRightRadius: 0 } : { borderTopLeftRadius: 0 }),
  };

  // Outer row wrapper
  const row = (children, mb = reactions.length ? 18 : 2) => (
    <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: mb, width: '100%' }} {...wrapperProps}>
      {children}
      {ctxMenu && (
        <MessageContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          isMine={isMine} message={message}
          onClose={() => setCtxMenu(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );

  // ── Deleted ──────────────────────────────────────────────────────────────
  if (message.is_deleted || message.is_deleted_for_everyone) {
    return row(
      <div className={bubbleClass} style={{ ...base, padding: '6px 9px 8px 9px', minWidth: 110 }}>
        <p style={{ fontSize: 14, fontStyle: 'italic', color: '#8696a0', margin: 0 }}>
          🚫 This message was deleted
        </p>
        <MetaRow message={message} isMine={isMine} />
        <div style={{ clear: 'both' }} />
      </div>
    );
  }

  // ── Image ────────────────────────────────────────────────────────────────
  if (message_type === 'image') {
    return row(
      <div style={{ position: 'relative' }}>
        <div className={bubbleClass} style={{ ...base, padding: 0, overflow: 'hidden', minWidth: 100 }}>
          {message.replied_message && (
            <div style={{ padding: '8px 9px 2px' }}>
              <ReplyQuote repliedMessage={message.replied_message} isMine={isMine} />
            </div>
          )}
          <div onClick={() => onImageClick?.(message)} style={{ display: 'block', cursor: 'pointer' }}>
            <img
              src={media_url} alt=""
              style={{ display: 'block', maxWidth: 300, maxHeight: 300, minWidth: 100, width: '100%', objectFit: 'cover', transition: 'filter .15s' }}
              onMouseEnter={e => e.target.style.filter = 'brightness(0.85)'}
              onMouseLeave={e => e.target.style.filter = 'none'}
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>
          {message.caption && (
            <p style={{ margin: '4px 9px 2px', fontSize: 14.2, lineHeight: '19px' }}>{message.caption}</p>
          )}
          <MetaRow message={message} isMine={isMine} overlay={!message.caption && !message.replied_message} />
          {(message.caption || message.replied_message) && <div style={{ clear: 'both', paddingBottom: 4 }} />}
        </div>
        <ReactionsBar reactions={reactions} isMine={isMine} title={reactionTitle} />
      </div>
    );
  }

  // ── Audio ────────────────────────────────────────────────────────────────
  if (message_type === 'audio') {
    return row(
      <div style={{ position: 'relative' }}>
        <div className={bubbleClass} style={{ ...base, padding: '6px 8px' }}>
          {message.replied_message && <ReplyQuote repliedMessage={message.replied_message} isMine={isMine} />}
          <AudioPlayer src={media_url} duration={duration} isMine={isMine}>
            <MetaRow message={message} isMine={isMine} inline />
          </AudioPlayer>
          <div style={{ clear: 'both' }} />
        </div>
        <ReactionsBar reactions={reactions} isMine={isMine} title={reactionTitle} />
      </div>
    );
  }

  // ── Video ────────────────────────────────────────────────────────────────
  if (message_type === 'video') {
    return row(
      <div style={{ position: 'relative' }}>
        <div className={bubbleClass} style={{ ...base, padding: 0, overflow: 'hidden' }}>
          {message.replied_message && (
            <div style={{ padding: '8px 9px 2px' }}>
              <ReplyQuote repliedMessage={message.replied_message} isMine={isMine} />
            </div>
          )}
          <video src={media_url} controls style={{ display: 'block', maxWidth: 300, maxHeight: 220 }} />
          {message.caption && <p style={{ margin: '4px 9px 2px', fontSize: 14.2 }}>{message.caption}</p>}
          <MetaRow message={message} isMine={isMine} />
          <div style={{ clear: 'both', paddingBottom: 4 }} />
        </div>
        <ReactionsBar reactions={reactions} isMine={isMine} title={reactionTitle} />
      </div>
    );
  }

  // ── Document ─────────────────────────────────────────────────────────────
  if (message_type === 'document') {
    return row(
      <div style={{ position: 'relative' }}>
        <div className={bubbleClass} style={{ ...base, padding: '6px 9px 8px 9px', minWidth: 110 }}>
          {message.replied_message && <ReplyQuote repliedMessage={message.replied_message} isMine={isMine} />}
          <a
            href={media_url} target="_blank" rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(0,0,0,0.15)', borderRadius: 8,
              padding: '8px 10px', textDecoration: 'none', color: 'inherit', marginBottom: 4,
            }}
          >
            <span style={{ opacity: 0.7, flexShrink: 0 }}><FileIcon /></span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                {content || 'Document'}
              </p>
              {file_size && <p style={{ margin: 0, fontSize: 12, color: '#8696a0' }}>{formatSize(file_size)}</p>}
            </div>
          </a>
          <MetaRow message={message} isMine={isMine} />
          <div style={{ clear: 'both' }} />
        </div>
        <ReactionsBar reactions={reactions} isMine={isMine} title={reactionTitle} />
      </div>
    );
  }

  // ── Text (default) ───────────────────────────────────────────────────────
  return row(
    <div style={{ position: 'relative' }}>
      <div className={bubbleClass} style={{ ...base, padding: '6px 9px 8px 9px', minWidth: 110 }}>
        {message.replied_message && <ReplyQuote repliedMessage={message.replied_message} isMine={isMine} />}
        <p style={{ margin: 0, fontSize: 14.2, lineHeight: '19px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {content || ''}
        </p>
        <MetaRow message={message} isMine={isMine} />
        <div style={{ clear: 'both' }} />
      </div>
      <ReactionsBar reactions={reactions} isMine={isMine} title={reactionTitle} />
    </div>
  );
}
