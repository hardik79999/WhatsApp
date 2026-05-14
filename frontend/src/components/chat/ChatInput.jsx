import { useEffect, useRef, useState } from 'react';
import api from '../../api';
import MediaUploadButton from './MediaUploadButton';
import VoiceRecorder from './VoiceRecorder';
import MediaUploadModal from '../MediaUploadModal';

// ── Icons ─────────────────────────────────────────────────────────────────────
function EmojiIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
      <path d="M9.153 11.603c.795 0 1.44-.88 1.44-1.962s-.645-1.96-1.44-1.96c-.795 0-1.44.88-1.44 1.96s.645 1.965 1.44 1.965zM5.95 12.965c-.027-.307-.132 5.218 6.062 5.218 6.066 0 6.037-4.952 6.037-5.218H5.95zm11.362 1.108s-.67 1.96-5.05 1.96c-3.506 0-5.39-1.165-5.608-1.96h10.658zm-1.804-1.108c.795 0 1.44-.88 1.44-1.962s-.645-1.96-1.44-1.96c-.795 0-1.44.88-1.44 1.96s.645 1.965 1.44 1.965zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.001c-4.962 0-9-4.038-9-9s4.038-9 9-9 9 4.038 9 9-4.038 9-9 9z"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  );
}

// ── Reply preview banner ──────────────────────────────────────────────────────
function ReplyPreviewBanner({ replyTo, onCancel }) {
  if (!replyTo) return null;

  const previewText =
    replyTo.is_deleted_for_everyone || replyTo.is_deleted
      ? 'This message was deleted'
      : replyTo.message_type !== 'text'
      ? `📎 ${replyTo.message_type}`
      : replyTo.content || '';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 16px',
      background: '#1d2b33',
      borderTop: '1px solid #2a3942',
    }}>
      <div style={{ width: 3, alignSelf: 'stretch', background: '#00a884', borderRadius: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#00a884', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Reply</div>
        <div style={{
          color: '#8696a0', fontSize: 13,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontStyle: replyTo.is_deleted_for_everyone ? 'italic' : 'normal',
        }}>
          {previewText}
        </div>
      </div>
      <button
        type="button" onClick={onCancel}
        style={{
          background: 'none', border: 'none', color: '#8696a0',
          cursor: 'pointer', padding: 4, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%', flexShrink: 0,
        }}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

// ── ChatInput ─────────────────────────────────────────────────────────────────
export default function ChatInput({ chatId, onMessageSent, replyTo, onCancelReply, ws }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const typingRef = useRef({ isTyping: false, timeoutId: null });

  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaType, setMediaType] = useState('document');
  const [mediaFile, setMediaFile] = useState(null);

  const sendTyping = (isTyping) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'typing', chat_id: chatId, is_typing: isTyping }));
  };

  const stopTyping = () => {
    clearTimeout(typingRef.current.timeoutId);
    if (typingRef.current.isTyping) {
      typingRef.current.isTyping = false;
      sendTyping(false);
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(typingRef.current.timeoutId);
      if (typingRef.current.isTyping) { typingRef.current.isTyping = false; sendTyping(false); }
    };
  }, [chatId, ws]);

  const handleTextChange = (e) => {
    const next = e.target.value;
    setText(next);
    if (!next.trim()) { stopTyping(); return; }
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!typingRef.current.isTyping) { typingRef.current.isTyping = true; sendTyping(true); }
    clearTimeout(typingRef.current.timeoutId);
    typingRef.current.timeoutId = setTimeout(() => {
      typingRef.current.isTyping = false; sendTyping(false);
    }, 1500);
  };

  const closeMediaModal = () => { setMediaModalOpen(false); setMediaFile(null); setMediaType('document'); };

  const inferMediaType = (file) => {
    const t = (file?.type || '').toLowerCase();
    if (t.startsWith('image/')) return 'image';
    if (t.startsWith('video/')) return 'video';
    return 'document';
  };

  const handleSelectFile = (file) => {
    if (!file) return;
    stopTyping();
    setMediaFile(file);
    setMediaType(inferMediaType(file));
    setMediaModalOpen(true);
  };

  const sendMessage = async (payload) => {
    setSending(true);
    try {
      const { data } = await api.post('/messages/', {
        chat_id: chatId,
        ...payload,
        ...(replyTo ? { reply_to_message_id: replyTo.id } : {}),
      }, { withCredentials: true });
      if (onMessageSent) onMessageSent(data);
      if (onCancelReply) onCancelReply();
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handleTextSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    stopTyping();
    setText('');
    inputRef.current?.focus();
    await sendMessage({ content: trimmed, message_type: 'text' });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) handleTextSend(e);
    if (e.key === 'Escape' && replyTo && onCancelReply) onCancelReply();
  };

  const handleMediaSend = async (file, caption) => {
    if (!file) return;
    stopTyping();
    const formData = new FormData();
    formData.append('file', file);
    const { data: upload } = await api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });
    const trimmedCaption = (caption || '').trim();
    const msgType = upload.file_type || (mediaType === 'image' ? 'image' : mediaType === 'video' ? 'video' : 'document');
    await sendMessage({
      content: trimmedCaption || file.name,
      caption: trimmedCaption || null,
      message_type: msgType,
      media_url: upload.media_url,
      media_id: upload.id || null,
      file_size: upload.file_size,
    });
  };

  const handleVoiceRecorded = async (uploadResult) => {
    stopTyping();
    await sendMessage({
      message_type: 'audio',
      media_url: uploadResult.media_url,
      file_size: uploadResult.file_size,
      duration: uploadResult.duration,
    });
  };

  const hasText = text.trim().length > 0;

  return (
    <div style={{ flexShrink: 0, zIndex: 10, position: 'relative' }}>
      <ReplyPreviewBanner replyTo={replyTo} onCancel={onCancelReply} />

      <form
        onSubmit={handleTextSend}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '6px 16px',
          background: '#202c33',
          minHeight: 62,
        }}
      >
        {/* Emoji button */}
        <button
          type="button"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#8696a0', padding: '6px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', flexShrink: 0,
            transition: 'color .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#e9edef'}
          onMouseLeave={e => e.currentTarget.style.color = '#8696a0'}
          title="Emoji"
        >
          <EmojiIcon />
        </button>

        {/* Attach button */}
        <MediaUploadButton onSelectFile={handleSelectFile} disabled={sending} />

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          disabled={sending}
          style={{
            flex: 1,
            background: '#2a3942',
            border: 'none',
            borderRadius: 8,
            padding: '9px 12px',
            color: '#e9edef',
            fontSize: 15,
            fontFamily: 'inherit',
            outline: 'none',
            caretColor: '#00a884',
            lineHeight: 1.5,
            height: 42,
          }}
          autoComplete="off"
        />

        {/* Send / Mic */}
        {hasText ? (
          <button
            type="submit"
            disabled={sending}
            title="Send"
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: '#00a884', border: 'none',
              cursor: sending ? 'not-allowed' : 'pointer',
              color: '#fff', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, opacity: sending ? 0.6 : 1,
              transition: 'background .15s',
            }}
            onMouseEnter={e => { if (!sending) e.currentTarget.style.background = '#00c99f'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#00a884'; }}
          >
            <SendIcon />
          </button>
        ) : (
          <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={sending} />
        )}
      </form>

      <MediaUploadModal
        isOpen={mediaModalOpen}
        onClose={closeMediaModal}
        onSend={handleMediaSend}
        type={mediaType}
        initialFile={mediaFile}
      />
    </div>
  );
}
