import React from 'react';
import Avatar from './Avatar';
import { Icon } from './Icons';

const formatChatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
};

function ChatList({ chats, currentUser, selectedChat, onChatClick }) {
  if (chats.length === 0) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#8696a0', fontSize:14, gap:12, padding:24 }}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48" style={{ opacity:.3 }}>
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        <span>No chats yet</span>
        <span style={{ fontSize:12, textAlign:'center', opacity:.7 }}>Click the pencil icon to start a new chat</span>
      </div>
    );
  }

  return (
    <>
      {chats.map((chat) => {
        const other = chat.participants?.find((p) => p.user_id !== currentUser?.id);
        const name = chat.is_group
          ? (chat.group_name || 'Group')
          : (other?.username || other?.phone || 'Unknown');
        const pic = chat.is_group
          ? chat.group_picture
          : (other?.profile_pic || null);
        const isActive = selectedChat?.id === chat.id;

        // Last message from backend
        const lastMsg = chat.last_message;
        const lastText = lastMsg?.content || '';
        const lastTime = formatChatTime(lastMsg?.created_at || chat.updated_at);
        const isMine = lastMsg?.sender_id === currentUser?.id;
        const msgStatus = lastMsg?.status || 'sent';

        // Unread count — 0 if this chat is currently open
        const unread = isActive ? 0 : (chat.unread_count || 0);

        return (
          <div
            key={chat.id}
            onClick={() => onChatClick(chat)}
            className={`chat-item${isActive ? ' active' : ''}`}
            style={{ display:'flex', alignItems:'center', padding:'10px 16px', cursor:'pointer', borderBottom:'1px solid #1f2c33' }}
          >
            {/* Avatar with online dot */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <Avatar src={pic} name={name} size={49} isGroup={chat.is_group} />
              {!chat.is_group && other?.is_online && (
                <span style={{ position:'absolute', bottom:2, right:2, width:12, height:12, borderRadius:'50%', background:'#00a884', border:'2px solid #111b21' }} />
              )}
            </div>

            <div style={{ flex:1, minWidth:0, marginLeft:15 }}>
              {/* Row 1: Name + Time */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:3 }}>
                <span style={{ color:'#e9edef', fontSize:17, fontWeight:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>
                  {name}
                </span>
                <span style={{ color: unread > 0 ? '#00a884' : '#8696a0', fontSize:12, flexShrink:0, marginLeft:8 }}>
                  {lastTime}
                </span>
              </div>

              {/* Row 2: Last message preview + Unread badge */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:4, minWidth:0, flex:1 }}>
                  {/* Double ticks for sent messages */}
                  {isMine && lastMsg && (
                    <span style={{ display:'flex', flexShrink:0, color: msgStatus === 'read' ? '#53bdeb' : '#8696a0' }}>
                      {msgStatus === 'sent'
                        ? <Icon.CheckSingle />
                        : <Icon.CheckDouble />
                      }
                    </span>
                  )}
                  <span style={{ color:'#8696a0', fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {lastText
                      ? (lastMsg?.message_type !== 'text' ? `📎 ${lastText}` : lastText)
                      : <em style={{ opacity:.6 }}>No messages yet</em>
                    }
                  </span>
                </div>
                {unread > 0 && (
                  <span className="unread-badge">{unread > 99 ? '99+' : unread}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default ChatList;
