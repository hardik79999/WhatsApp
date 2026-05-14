import React, { useState } from 'react';
import Avatar from './Avatar';
import { Icon } from './Icons';

function ForwardMessageModal({ isOpen, message, chats, currentUser, onClose, onForward }) {
  const [selectedChats, setSelectedChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [forwarding, setForwarding] = useState(false);

  const filteredChats = chats.filter((c) => {
    if (!searchQuery.trim()) return true;
    const other = c.participants?.find((p) => p.user_id !== currentUser?.id);
    const name = c.is_group 
      ? (c.group_name || '').toLowerCase()
      : (other?.username || other?.phone || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const toggleChat = (chatId) => {
    setSelectedChats(prev =>
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = async () => {
    if (selectedChats.length === 0) return;

    setForwarding(true);
    try {
      await onForward(message, selectedChats);
      handleClose();
    } catch (error) {
      alert('Failed to forward message');
    } finally {
      setForwarding(false);
    }
  };

  const handleClose = () => {
    setSelectedChats([]);
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '90%',
        maxWidth: 500,
        maxHeight: '80vh',
        background: '#111b21',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: '#202c33',
          padding: '16px 20px',
          borderBottom: '1px solid #2a3942'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: '#e9edef', fontSize: 18, fontWeight: 500 }}>
              Forward message to...
            </span>
            <button
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8696a0',
                fontSize: 24,
                cursor: 'pointer',
                padding: 0,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
          
          {selectedChats.length > 0 && (
            <div style={{ color: '#00a884', fontSize: 14 }}>
              {selectedChats.length} selected
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px', background: '#111b21' }}>
          <div style={{
            background: '#202c33',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            gap: 10
          }}>
            <span style={{ color: '#8696a0', display: 'flex' }}><Icon.Search /></span>
            <input
              type="text"
              placeholder="Search chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#e9edef',
                fontSize: 15
              }}
            />
          </div>
        </div>

        {/* Chat List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredChats.map((chat) => {
            const other = chat.participants?.find((p) => p.user_id !== currentUser?.id);
            const name = chat.is_group
              ? chat.group_name
              : (other?.username || other?.phone || 'Unknown');
            const pic = chat.is_group
              ? chat.group_picture
              : (other?.profile_pic || null);
            const isSelected = selectedChats.includes(chat.id);

            return (
              <div
                key={chat.id}
                onClick={() => toggleChat(chat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: isSelected ? '#2a3942' : 'transparent',
                  borderBottom: '1px solid #2a3942'
                }}
                onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = '#202c33')}
                onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
              >
                <Avatar src={pic} name={name} size={45} />
                <div style={{ flex: 1, marginLeft: 12 }}>
                  <div style={{ color: '#e9edef', fontSize: 16 }}>{name}</div>
                  {chat.is_group && (
                    <div style={{ color: '#8696a0', fontSize: 13, marginTop: 2 }}>
                      {chat.participants?.length || 0} participants
                    </div>
                  )}
                </div>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: isSelected ? 'none' : '2px solid #8696a0',
                  background: isSelected ? '#00a884' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 12
                }}>
                  {isSelected && '✓'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          background: '#202c33',
          padding: '12px 16px',
          borderTop: '1px solid #2a3942',
          display: 'flex',
          gap: 8
        }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '10px',
              background: '#2a3942',
              color: '#e9edef',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={selectedChats.length === 0 || forwarding}
            style={{
              flex: 1,
              padding: '10px',
              background: selectedChats.length > 0 ? '#00a884' : '#2a3942',
              color: selectedChats.length > 0 ? '#fff' : '#8696a0',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              cursor: selectedChats.length > 0 ? 'pointer' : 'not-allowed',
              opacity: forwarding ? 0.6 : 1
            }}
          >
            {forwarding ? 'Forwarding...' : 'Forward'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForwardMessageModal;
