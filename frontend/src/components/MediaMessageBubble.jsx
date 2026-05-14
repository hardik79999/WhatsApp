import { useState } from 'react';
import MessageTicks from './MessageTicks';
import { Icon } from './Icons';

const formatMsgTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function MediaMessageBubble({ msg, isMine, onContextMenu, onMediaClick }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const timeStr = formatMsgTime(msg.created_at);

  const renderMedia = () => {
    switch (msg.message_type) {
      case 'image':
        return (
          <div
            onClick={() => onMediaClick && onMediaClick(msg)}
            style={{
              position: 'relative',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
              overflow: 'hidden',
              background: '#2a3942'
            }}
          >
            {!imageLoaded && (
              <div style={{
                width: 300,
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8696a0'
              }}>
                Loading...
              </div>
            )}
            <img
              src={msg.media_url}
              alt="Image"
              onLoad={() => setImageLoaded(true)}
              style={{
                maxWidth: 300,
                maxHeight: 400,
                width: '100%',
                display: imageLoaded ? 'block' : 'none',
                objectFit: 'cover'
              }}
            />
          </div>
        );

      case 'video':
        return (
          <div
            style={{
              position: 'relative',
              borderRadius: '8px 8px 0 0',
              overflow: 'hidden',
              background: '#000',
              maxWidth: 300
            }}
          >
            <video
              src={msg.media_url}
              controls
              style={{
                width: '100%',
                maxHeight: 400,
                display: 'block'
              }}
              onPlay={() => setVideoPlaying(true)}
              onPause={() => setVideoPlaying(false)}
            />
            {msg.duration && !videoPlaying && (
              <div style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 12
              }}>
                {Math.floor(msg.duration / 60)}:{(msg.duration % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 12px',
            minWidth: 250
          }}>
            <button
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: isMine ? '#005c4b' : '#2a3942',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#e9edef'
              }}
            >
              <Icon.Play />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{
                height: 2,
                background: '#8696a0',
                borderRadius: 1,
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: '30%',
                  background: '#00a884',
                  borderRadius: 1
                }} />
              </div>
            </div>
            <span style={{ color: '#8696a0', fontSize: 12 }}>
              {msg.duration ? `${Math.floor(msg.duration / 60)}:${(msg.duration % 60).toString().padStart(2, '0')}` : '0:00'}
            </span>
          </div>
        );

      case 'document':
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px',
            minWidth: 250
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: isMine ? '#005c4b' : '#2a3942',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e9edef'
            }}>
              <Icon.Document />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: '#e9edef',
                fontSize: 14,
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {msg.content || 'Document'}
              </div>
              <div style={{ color: '#8696a0', fontSize: 12, marginTop: 2 }}>
                {msg.file_size ? `${(msg.file_size / 1024 / 1024).toFixed(2)} MB` : 'File'}
              </div>
            </div>
            <a
              href={msg.media_url}
              download
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: isMine ? '#005c4b' : '#2a3942',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00a884',
                textDecoration: 'none'
              }}
            >
              <Icon.Download />
            </a>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        marginBottom: 6
      }}
      onContextMenu={onContextMenu}
    >
      <div
        style={{
          position: 'relative',
          background: isMine ? '#005c4b' : '#202c33',
          borderRadius: 8,
          maxWidth: '65%',
          boxShadow: '0 1px 2px rgba(0,0,0,.3)',
          overflow: 'hidden'
        }}
      >
        {renderMedia()}
        
        {/* Caption */}
        {msg.content && msg.message_type !== 'document' && (
          <div style={{ padding: '6px 9px 22px' }}>
            <span style={{
              color: '#e9edef',
              fontSize: 14.5,
              lineHeight: 1.5,
              wordBreak: 'break-word',
              display: 'block'
            }}>
              {msg.content}
            </span>
          </div>
        )}

        {/* Time and Status */}
        <span style={{
          position: 'absolute',
          bottom: 5,
          right: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          color: msg.message_type === 'image' || msg.message_type === 'video' ? '#fff' : '#8696a0',
          fontSize: 11,
          whiteSpace: 'nowrap',
          background: msg.message_type === 'image' || msg.message_type === 'video' ? 'rgba(0,0,0,0.4)' : 'transparent',
          padding: msg.message_type === 'image' || msg.message_type === 'video' ? '2px 6px' : '0',
          borderRadius: 4
        }}>
          {timeStr}
          {isMine && <MessageTicks status={msg.status || 'sent'} />}
        </span>
      </div>
    </div>
  );
}

export default MediaMessageBubble;
