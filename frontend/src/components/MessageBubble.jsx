import React from 'react';
import MessageTicks from './MessageTicks';

const formatMsgTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateLabel = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return 'Today';
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// ── Reply Quote Block ─────────────────────────────────────────────────────────
function ReplyQuote({ repliedMessage, isMine }) {
  if (!repliedMessage) return null;

  const isDeleted = repliedMessage.is_deleted_for_everyone || repliedMessage.is_deleted;
  const previewText = isDeleted
    ? 'This message was deleted'
    : repliedMessage.message_type !== 'text'
    ? `📎 ${repliedMessage.message_type}`
    : repliedMessage.content || '';

  return (
    <div
      style={{
        borderLeft: '3px solid #00a884',
        background: isMine ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.07)',
        borderRadius: '4px 6px 6px 4px',
        padding: '5px 10px',
        marginBottom: 6,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          color: '#00a884',
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {/* We don't have sender name in the preview, so just show "Quoted message" */}
        Quoted message
      </div>
      <div
        style={{
          color: '#8696a0',
          fontSize: 13,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontStyle: isDeleted ? 'italic' : 'normal',
        }}
      >
        {previewText}
      </div>
    </div>
  );
}

// ── Main MessageBubble ────────────────────────────────────────────────────────
function MessageBubble({ msg, isMine, isFirst, isLast, showDate, onContextMenu, onReactionClick }) {
  const timeStr = formatMsgTime(msg.created_at);
  const reactions = msg.reactions || [];

  const isDeletedForEveryone = msg.is_deleted_for_everyone;
  const hasReply = !!msg.replied_message;

  return (
    <React.Fragment>
      {showDate && (
        <div
          style={{
            alignSelf: 'center',
            background: 'rgba(11,20,26,.75)',
            color: '#e9edef',
            fontSize: 12.5,
            padding: '5px 14px',
            borderRadius: 8,
            margin: '8px 0',
            fontWeight: 500,
          }}
        >
          {formatDateLabel(msg.created_at)}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          marginBottom: isLast ? 6 : 1,
        }}
        onContextMenu={onContextMenu}
      >
        <div style={{ position: 'relative' }}>
          <div
            className={isFirst ? (isMine ? 'bubble-out' : 'bubble-in') : ''}
            style={{
              position: 'relative',
              background: isMine ? '#005c4b' : '#202c33',
              borderRadius: isMine
                ? isFirst ? '8px 0 8px 8px' : '8px 8px 8px 8px'
                : isFirst ? '0 8px 8px 8px' : '8px 8px 8px 8px',
              padding: '6px 9px 22px',
              maxWidth: '65%',
              minWidth: 80,
              boxShadow: '0 1px 2px rgba(0,0,0,.3)',
            }}
          >
            {/* Reply quote block */}
            {hasReply && !isDeletedForEveryone && (
              <ReplyQuote repliedMessage={msg.replied_message} isMine={isMine} />
            )}

            {/* Message body */}
            {isDeletedForEveryone ? (
              <span
                style={{
                  color: '#8696a0',
                  fontSize: 14,
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                🚫 This message was deleted
              </span>
            ) : (
              <span
                style={{
                  color: '#e9edef',
                  fontSize: 14.5,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  display: 'block',
                }}
              >
                {msg.content}
              </span>
            )}

            {/* Timestamp + ticks + edited label */}
            <span
              style={{
                position: 'absolute',
                bottom: 5,
                right: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                color: '#8696a0',
                fontSize: 11,
                whiteSpace: 'nowrap',
              }}
            >
              {msg.is_edited && !isDeletedForEveryone && (
                <span style={{ fontSize: 10, color: '#8696a0', marginRight: 2 }}>Edited</span>
              )}
              {timeStr}
              {isMine && <MessageTicks status={msg.status || 'sent'} />}
            </span>
          </div>

          {/* Reactions */}
          {reactions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: -8,
                right: isMine ? 8 : 'auto',
                left: isMine ? 'auto' : 8,
                background: '#202c33',
                borderRadius: 12,
                padding: '2px 6px',
                display: 'flex',
                gap: 2,
                fontSize: 14,
                boxShadow: '0 1px 2px rgba(0,0,0,.3)',
                cursor: 'pointer',
                border: '1px solid #2a3942',
              }}
              onClick={onReactionClick}
              title={reactions.map((r) => `${r.username}: ${r.reaction}`).join('\n')}
            >
              {reactions.slice(0, 3).map((r, i) => (
                <span key={i}>{r.reaction}</span>
              ))}
              {reactions.length > 3 && (
                <span style={{ color: '#8696a0', fontSize: 11 }}>+{reactions.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}

export default MessageBubble;
