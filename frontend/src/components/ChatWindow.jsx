import { useRef, useEffect, useState } from 'react';
import Avatar from './Avatar';
import MessageBubble from './chat/MessageBubble';
import ChatInput from './chat/ChatInput';
import TypingIndicator from './TypingIndicator';
import ImageLightbox from './chat/ImageLightbox';
import { Icon } from './Icons';
import CallButton from './CallButton';

function ChatWindow({ 
  chat, 
  messages, 
  currentUser, 
  onMessageSent,
  onContextMenu,
  onOpenGroupInfo,
  typingUsers = [],
  ws,
  onCallStarted,
}) {
  const messagesEndRef = useRef(null);

  // Lightbox state
  const [lightbox, setLightbox] = useState(null); // { images: [...], startIndex: n, senderName }

  // Auto-scroll to latest message
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, chat?.id]);

  // Build flat list of all image messages for lightbox navigation
  const imageMessages = (messages || []).filter(m => m.message_type === "image" && m.media_url);

  const openLightbox = (msg) => {
    const images = imageMessages.map(m => ({
      url: m.media_url,
      filename: m.content || "image",
      caption: m.content || null,
      created_at: m.created_at,
      sender_id: m.sender_id,
    }));
    const startIndex = imageMessages.findIndex(m => m.id === msg.id);
    // Determine sender name for the header
    let senderName = "Unknown";
    if (msg.sender_id === currentUser?.id) {
      senderName = "You";
    } else {
      const participant = chat?.participants?.find(p => p.user_id === msg.sender_id);
      senderName = participant?.username || participant?.phone || "Unknown";
    }
    setLightbox({ images, startIndex: Math.max(startIndex, 0), senderName });
  };

  if (!chat) {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#111b21' }}>
        <div style={{ display: 'flex', gap: 24, marginTop: 100 }}>
          <div className="big-empty-btn">
            <span style={{ color: '#8696a0' }}><Icon.Document /></span>
            <span>Send document</span>
          </div>
          <div className="big-empty-btn">
            <span style={{ color: '#8696a0' }}><Icon.AddUser /></span>
            <span>Add contact</span>
          </div>
          <div className="big-empty-btn">
            <span style={{ color: '#d500f9' }}><Icon.MetaAI /></span>
            <span>Ask Meta AI</span>
          </div>
        </div>
      </div>
    );
  }

  const chatOther = chat.participants?.find((p) => p.user_id !== currentUser?.id);
  const chatName = chat.is_group 
    ? chat.group_name 
    : (chatOther?.username || chatOther?.phone || 'Unknown');
  const chatPic = chat.is_group 
    ? chat.group_picture 
    : (chatOther?.profile_pic || null);

  return (
    <>
      {/* Chat background */}
      <div className="wa-bg" style={{ position:'absolute', inset:0 }} />

      {/* ── Chat Header ── */}
      <div style={{ height:60, background:'#202c33', display:'flex', alignItems:'center', padding:'0 16px', gap:12, zIndex:10, position:'relative', flexShrink:0 }}>
        <div style={{ cursor:'pointer' }} onClick={() => chat.is_group && onOpenGroupInfo && onOpenGroupInfo()}>
          <div style={{ position:'relative' }}>
            <Avatar src={chatPic} name={chatName} size={40} isGroup={chat.is_group} />
            {!chat.is_group && chatOther?.is_online && (
              <span style={{ position:'absolute', bottom:1, right:1, width:10, height:10, borderRadius:'50%', background:'#00a884', border:'2px solid #202c33' }} />
            )}
          </div>
        </div>
        <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={() => chat.is_group && onOpenGroupInfo && onOpenGroupInfo()}>
          <div style={{ color:'#e9edef', fontSize:16, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {chatName}
          </div>
          <div style={{ color:'#8696a0', fontSize:13 }}>
            {typingUsers.length > 0 ? (
              <span style={{ color:'#00a884' }}>typing...</span>
            ) : chat.is_group 
              ? (chat.participants?.map(p => p.user_id === currentUser?.id ? 'You' : p.username || p.phone).join(', ') || '')
              : (chatOther?.is_online ? 'online' : 'click here for contact info')
            }
          </div>
        </div>
        <div style={{ display:'flex', gap:2 }}>
          {!chat.is_group && chatOther && (
            <>
              <CallButton
                contactId={chatOther.user_id}
                contactUser={chatOther}
                callType="video"
                ws={ws}
                onCallStarted={onCallStarted}
              />
              <CallButton
                contactId={chatOther.user_id}
                contactUser={chatOther}
                callType="audio"
                ws={ws}
                onCallStarted={onCallStarted}
              />
            </>
          )}
          <button className="icon-btn" style={{ color:'#aebac1' }} title="Search">
            <Icon.Search />
          </button>
          <button className="icon-btn" style={{ color:'#aebac1' }} title="Menu">
            <Icon.DotsVertical />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        style={{ flex:1, overflowY:'auto', padding:'12px 6%', display:'flex', flexDirection:'column', gap:1, zIndex:10, position:'relative' }}
        onClick={() => onContextMenu && onContextMenu(null)}
      >
        {/* Encryption notice */}
        <div style={{ alignSelf:'center', background:'rgba(11,20,26,.75)', color:'#e9edef', fontSize:12.5, padding:'6px 14px', borderRadius:8, marginBottom:8, textAlign:'center', maxWidth:380, lineHeight:1.6, display:'flex', alignItems:'center', gap:6 }}>
          <Icon.Lock />
          <span>Messages and calls are end-to-end encrypted. No one outside of this chat can read them.</span>
        </div>

        {messages.length === 0 ? (
          <div style={{ alignSelf:'center', background:'rgba(11,20,26,.75)', color:'#e9edef', fontSize:13, padding:'6px 14px', borderRadius:8 }}>
            No messages yet
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={String(msg.sender_id) === String(currentUser.id)}
              onImageClick={openLightbox}
            />
          ))
        )}
        
        {typingUsers.length > 0 && (
          <div style={{ alignSelf:'flex-start', marginTop:4 }}>
            <TypingIndicator />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <ChatInput
        chatId={chat.id}
        currentUserId={currentUser.id}
        onMessageSent={(newMsg) => {
          if (onMessageSent) onMessageSent(newMsg);
        }}
      />

      {/* ── Image Lightbox ── */}
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          startIndex={lightbox.startIndex}
          senderName={lightbox.senderName}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

export default ChatWindow;
