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
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays < 7) return days[d.getDay()];
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
};

function ChatList({ chats, currentUser, selectedChat, onChatClick }) {
  if (chats.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%',
        color: '#8696a0', fontSize: 14, gap: 12, padding: 24,
      }}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48" style={{ opacity: .25 }}>
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        <span>No chats yet</span>
        <span style={{ fontSize: 12, textAlign: 'center', opacity: .7 }}>
          Click the pencil icon to start a new chat
        </span>
      </div>
    );
  }

  return (
    <>
      {chats.map((chat) => {
        const other = chat.participants?.find(p => p.user_id !== currentUser?.id);
        const name = chat.is_group
          ? (chat.group_name || 'Group')
          : (other?.username || other?.phone || 'Unknown');
        const pic = chat.is_group ? chat.group_picture : (other?.profile_pic || null);
        const isActive = selectedChat?.id === chat.id;

        const lastMsg = chat.last_message;
        const lastTime = formatChatTime(lastMsg?.created_at || chat.updated_at);
        const isMine = lastMsg?.sender_id === currentUser?.id;
        const msgStatus = lastMsg?.status || 'sent';
        const unread = isActive ? 0 : (chat.unread_count || 0);

        // Build preview text
        let previewText = '';
        if (lastMsg) {
          if (lastMsg.is_deleted_for_everyone) {
            previewText = 'This message was deleted';
          } else if (lastMsg.message_type === 'image') {
            previewText = '📷 Photo';
          } else if (lastMsg.message_type === 'video') {
            previewText = '🎥 Video';
          } else if (lastMsg.message_type === 'audio') {
            previewText = '🎤 Voice message';
          } else if (lastMsg.message_type === 'document') {
            previewText = '📄 ' + (lastMsg.content || 'Document');
          } else {
            previewText = lastMsg.content || '';
          }
        }

        return (
          <div
            key={chat.id}
            onClick={() => onChatClick(chat)}
            className={`chat-item${isActive ? ' active' : ''}`}
            style={{
              display: 'flex', alignItems: 'center',
              padding: '0 16px 0 13px',
              height: 72, cursor: 'pointer',
            }}
          >
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0, marginRight: 13 }}>
              <Avatar src={pic} name={name} size={49} isGroup={chat.is_group} />
              {!chat.is_group && other?.is_online && (
                <span style={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: 11, height: 11, borderRadius: '50%',
                  background: '#00a884', border: '2px solid #111b21',
                }} />
              )}
            </div>

            {/* Text content — has bottom border */}
            <div style={{
              flex: 1, minWidth: 0,
              height: '100%',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              borderBottom: '1px solid #222d34',
              paddingBottom: 1,
            }}>
              {/* Row 1: Name + Time */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                <span style={{
                  color: '#e9edef', fontSize: 17, fontWeight: 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1, minWidth: 0, marginRight: 8,
                }}>
                  {name}
                </span>
                <span style={{
                  color: unread > 0 ? '#00a884' : '#8696a0',
                  fontSize: 12, flexShrink: 0,
                }}>
                  {lastTime}
                </span>
              </div>

              {/* Row 2: Preview + Unread badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0, flex: 1 }}>
                  {isMine && lastMsg && !lastMsg.is_deleted_for_everyone && (
                    <span style={{
                      display: 'flex', flexShrink: 0,
                      color: msgStatus === 'read' ? '#53bdeb' : '#8696a0',
                    }}>
                      {msgStatus === 'sent' ? <Icon.CheckSingle /> : <Icon.CheckDouble />}
                    </span>
                  )}
                  <span style={{
                    color: '#8696a0', fontSize: 14,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {previewText || <em style={{ opacity: .6 }}>No messages yet</em>}
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
