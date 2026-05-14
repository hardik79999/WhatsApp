import React, { useState, useEffect, useRef } from 'react';
import Login from './Login';
import api from './api';
import Avatar from './components/Avatar';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import NewChatPanel from './components/NewChatPanel';
import ContextMenu from './components/ContextMenu';
import CreateGroupPanel from './components/CreateGroupPanel';
import GroupInfoPanel from './components/GroupInfoPanel';
import MediaUploadModal from './components/MediaUploadModal';
import ReactionPicker from './components/ReactionPicker';
import ForwardMessageModal from './components/ForwardMessageModal';
import TypingIndicator from './components/TypingIndicator';
import { Icon } from './components/Icons';
import ProfilePanel from './components/ProfilePanel';
import StatusTab from './components/StatusTab';
import IncomingCallAlert from './components/IncomingCallAlert';
import CallScreen from './components/CallScreen';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser]         = useState(null);
  const [chats, setChats]                     = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [isNewChatOpen, setIsNewChatOpen]     = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isMediaUploadOpen, setIsMediaUploadOpen] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [contacts, setContacts]               = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedChat, setSelectedChat]       = useState(null);
  const [messages, setMessages]               = useState([]);
  const [newMessage, setNewMessage]           = useState('');
  const [searchQuery, setSearchQuery]         = useState('');
  const [activeTab, setActiveTab]             = useState('chats'); // 'chats' | 'status' | 'calls'
  const [contextMenu, setContextMenu]         = useState(null);   // { x, y, msgId }
  const [reactionPicker, setReactionPicker]   = useState(null);   // { x, y, messageId }
  const [typingUsers, setTypingUsers]         = useState({});     // { chatId: [userId1, userId2] }
  const [incomingCall, setIncomingCall]       = useState(null);   // incoming_call WS payload
  const [activeCall, setActiveCall]           = useState(null);   // { callId, callType, remoteUser, isCaller, offerSdp? }

  const wsRef           = useRef(null);
  const selectedChatRef = useRef(null);
  const currentUserRef  = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('csrf_access_token');
    if (token) setIsAuthenticated(true);
    else setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchInitialData();
  }, [isAuthenticated]);

  // Keep refs in sync
  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // WebSocket — persistent connection for real-time messages
  useEffect(() => {
    if (!isAuthenticated) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use same host:port as frontend so Vite proxy handles it
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      const incomingData = JSON.parse(event.data);

      // Event: Naya message aaya
      if (incomingData.type === "new_message") {
        const isOwnMessage = incomingData.sender_id === currentUserRef.current?.id;

        setSelectedChat((currentChat) => {
          if (currentChat && currentChat.id === incomingData.chat_id) {
            if (!isOwnMessage) {
              setMessages((prev) => {
                if (prev.some(m => m.id === incomingData.id)) return prev;
                return [...prev, incomingData];
              });
            }
            // Send read receipt for incoming messages in open chat
            const otherUser = currentChat.participants?.find(p => p.user_id !== currentUserRef.current?.id);
            if (otherUser && !isOwnMessage && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({
                type: "mark_read",
                chat_id: currentChat.id,
                receiver_id: otherUser.user_id
              }));
            }
          } else if (!isOwnMessage) {
            // Chat is not open — increment unread count
            setChats(prev => prev.map(c =>
              c.id === incomingData.chat_id
                ? { ...c, unread_count: (c.unread_count || 0) + 1, last_message: incomingData, updated_at: incomingData.created_at }
                : c
            ));
          }
          return currentChat;
        });

        // Update last message preview for the open chat too
        if (!isOwnMessage) {
          setChats(prev => prev.map(c =>
            c.id === incomingData.chat_id
              ? { ...c, last_message: incomingData, updated_at: incomingData.created_at }
              : c
          ));
        }
      }

      // Event: Samne wale ne mere messages padh liye (Blue Ticks!)
      else if (incomingData.type === "messages_read") {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            // Agar msg us chat ka hai, aur maine bheja tha, toh status 'read' kar do
            (msg.chat_id === incomingData.chat_id && msg.sender_id === currentUserRef.current?.id)
              ? { ...msg, status: "read" } 
              : msg
          )
        );
      }

      // Event: Online/Offline status
      else if (incomingData.type === "online_status") {
        // Update user online status in chats
        setChats(prevChats => 
          prevChats.map(chat => ({
            ...chat,
            participants: chat.participants?.map(p => 
              p.user_id === incomingData.user_id 
                ? { ...p, is_online: incomingData.status === 'online' }
                : p
            )
          }))
        );
      }

      // Event: Typing indicator
      else if (incomingData.type === "typing") {
        const { chat_id, user_id, is_typing } = incomingData;
        setTypingUsers(prev => {
          const chatTyping = prev[chat_id] || [];
          if (is_typing) {
            // Add user to typing list if not already there
            if (!chatTyping.includes(user_id)) {
              return { ...prev, [chat_id]: [...chatTyping, user_id] };
            }
          } else {
            // Remove user from typing list
            return { ...prev, [chat_id]: chatTyping.filter(id => id !== user_id) };
          }
          return prev;
        });
      }

      // Event: Message reaction
      else if (incomingData.type === "message_reaction") {
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === incomingData.message_id
              ? {
                  ...msg,
                  reactions: [
                    ...(msg.reactions || []).filter(r => r.user_id !== incomingData.user_id),
                    {
                      user_id: incomingData.user_id,
                      username: incomingData.username,
                      reaction: incomingData.reaction
                    }
                  ]
                }
              : msg
          )
        );
      }

      // Event: Message reaction removed
      else if (incomingData.type === "message_reaction_removed") {
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === incomingData.message_id
              ? {
                  ...msg,
                  reactions: (msg.reactions || []).filter(r => r.user_id !== incomingData.user_id)
                }
              : msg
          )
        );
      }

      // ── Call signalling events ──────────────────────────────────────────
      else if (incomingData.type === "incoming_call") {
        setIncomingCall(incomingData);
      }

      else if (incomingData.type === "call_ended") {
        setActiveCall(prev => prev?.callId === incomingData.call_id ? null : prev);
        setIncomingCall(null);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [isAuthenticated]);

  const fetchInitialData = async () => {
    try {
      const userRes  = await api.get('/users/me');
      setCurrentUser(userRes.data);
      const chatsRes = await api.get('/chats/');
      const fetchedChats = chatsRes.data;
      setChats(fetchedChats);

      // Restore previously selected chat after refresh
      const savedChatId = sessionStorage.getItem('selectedChatId');
      if (savedChatId && !selectedChatRef.current) {
        const chat = fetchedChats.find(c => c.id === savedChatId);
        if (chat) openChat(chat);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        localStorage.clear();
        sessionStorage.clear();
      }
    } finally {
      setLoading(false);
    }
  };

  const openNewChatPanel = () => {
    setIsNewChatOpen(true);
  };

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const res = await api.get('/contacts/');
      setContacts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const startNewChat = async (contactId) => {
    try {
      const res = await api.post('/chats/', { contact_id: contactId });
      setIsNewChatOpen(false);
      await fetchInitialData();
      openChat(res.data);
    } catch (error) {
      console.error('startNewChat error:', error.response?.data || error.message);
      const detail = error.response?.data?.detail || error.message || 'Error starting chat';
      alert(detail);
    }
  };

  const openChat = async (chat) => {
    setSelectedChat(chat);
    sessionStorage.setItem('selectedChatId', chat.id); // persist across refresh
    // Clear unread count locally immediately
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread_count: 0 } : c));
    try {
      const res = await api.get(`/messages/${chat.id}`);
      setMessages(res.data);
      // Mark messages as read via WebSocket
      const receiver = chat.participants?.find(p => p.user_id !== currentUser?.id);
      if (receiver && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "mark_read",
          chat_id: chat.id,
          receiver_id: receiver.user_id
        }));
      }
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const content = newMessage.trim();
    setNewMessage(''); // Clear input immediately for snappy UX

    // Stop typing indicator
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "typing",
        chat_id: selectedChat.id,
        is_typing: false
      }));
    }

    try {
      const res = await api.post('/messages/', {
        chat_id: selectedChat.id,
        content: content,
        message_type: 'text',
      });
      // Add message from API response (single source of truth for sender)
      // WebSocket will NOT add it again because we skip own messages there
      setMessages((prev) => {
        if (prev.some(m => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      // Update chat list preview without full reload
      setChats((prev) => prev.map(c =>
        c.id === selectedChat.id
          ? { ...c, last_message: res.data, updated_at: res.data.created_at }
          : c
      ));
    } catch (error) {
      console.error('Failed to send message', error);
      setNewMessage(content); // Restore message on failure
    }
  };

  const handleTyping = (value) => {
    setNewMessage(value);
    
    // Send typing indicator
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && selectedChat) {
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Send typing start
      wsRef.current.send(JSON.stringify({
        type: "typing",
        chat_id: selectedChat.id,
        is_typing: true
      }));
      
      // Set timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "typing",
            chat_id: selectedChat.id,
            is_typing: false
          }));
        }
      }, 3000);
    }
  };

  const handleMediaUpload = async (file, mediaType) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { media_url, file_size } = uploadRes.data;
      
      const res = await api.post('/messages/', {
        chat_id: selectedChat.id,
        content: file.name,
        message_type: mediaType,
        media_url: media_url,
        file_size: file_size
      });
      
      // Add once from API response — WebSocket skips own messages
      setMessages((prev) => {
        if (prev.some(m => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      setIsMediaUploadOpen(false);
      // Update chat list preview
      setChats((prev) => prev.map(c =>
        c.id === selectedChat.id
          ? { ...c, last_message: res.data, updated_at: res.data.created_at }
          : c
      ));
    } catch (error) {
      console.error('Failed to upload media', error);
      alert('Failed to upload media');
    }
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await api.post('/reactions/', {
        message_id: messageId,
        reaction: emoji
      });
      setReactionPicker(null);
    } catch (error) {
      console.error('Failed to add reaction', error);
    }
  };

  const handleForwardMessage = async (chatIds) => {
    try {
      for (const chatId of chatIds) {
        await api.post('/messages/', {
          chat_id: chatId,
          content: messageToForward.content,
          message_type: messageToForward.message_type,
          media_url: messageToForward.media_url
        });
      }
      setIsForwardModalOpen(false);
      setMessageToForward(null);
      alert('Message forwarded successfully');
    } catch (error) {
      console.error('Failed to forward message', error);
      alert('Failed to forward message');
    }
  };

  const handleCreateGroup = async (groupData) => {
    try {
      const res = await api.post('/chats/group', groupData);
      setIsCreateGroupOpen(false);
      await fetchInitialData();
      openChat(res.data);
    } catch (error) {
      console.error('Failed to create group', error);
      alert(error.response?.data?.detail || 'Failed to create group');
    }
  };

  const filteredChats = chats.filter((c) => {
    if (!searchQuery.trim()) return true;
    const other = c.participants?.find((p) => p.user_id !== currentUser?.id);
    const name  = c.is_group 
      ? (c.group_name || '').toLowerCase()
      : (other?.username || other?.phone || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  if (loading)
    return (
      <div style={{
        display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
        background: '#111b21', flexDirection: 'column', gap: 0,
      }}>
        {/* WhatsApp splash — matches real app */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <svg viewBox="0 0 212 212" fill="none" width="80" height="80">
            <circle cx="106" cy="106" r="106" fill="#00a884"/>
            <path fill="#fff" d="M106 52c-29.8 0-54 24.2-54 54 0 9.8 2.6 19 7.2 26.9L52 160l27.5-7.2c7.6 4.1 16.3 6.4 25.5 6.4 29.8 0 54-24.2 54-54S135.8 52 106 52zm26.8 74.8c-1.1 3.1-6.5 5.9-9 6.3-2.3.4-5.2.5-8.4-.5-1.9-.6-4.4-1.5-7.5-2.9-13.2-5.7-21.8-19-22.5-19.9-.7-.9-5.7-7.6-5.7-14.5s3.6-10.3 4.9-11.7c1.3-1.4 2.8-1.7 3.7-1.7h2.7c.9 0 2.1-.3 3.2 2.5 1.2 2.8 4 9.7 4.4 10.4.4.7.6 1.5.1 2.4-.5.9-.7 1.5-1.4 2.3-.7.8-1.5 1.8-.7 3.1.8 1.3 3.5 5.8 7.5 9.4 5.2 4.6 9.5 6 10.9 6.7 1.4.7 2.2.6 3-.4.8-1 3.4-4 4.3-5.4.9-1.4 1.8-1.1 3-.7 1.2.4 7.8 3.7 9.1 4.4 1.3.7 2.2 1 2.5 1.6.4.6.4 3.4-.7 6.6z"/>
          </svg>
          <span style={{ color: '#e9edef', fontSize: 28, fontWeight: 300, letterSpacing: 0.5 }}>WhatsApp</span>
        </div>
        {/* Bottom bar */}
        <div style={{ paddingBottom: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {/* Progress bar */}
          <div style={{ width: 120, height: 3, background: '#2a3942', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: '#00a884', borderRadius: 2,
              animation: 'loadbar 1.5s ease-in-out infinite',
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8696a0', fontSize: 13 }}>
            <Icon.Lock />
            <span>End-to-end encrypted</span>
          </div>
        </div>
      </div>
    );

  if (!isAuthenticated) return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#111b21' }}>

      {/* ═══════════════ THIN SIDEBAR ═══════════════ */}
      <div style={{ width: 64, background: '#202c33', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', borderRight: '1px solid #2a3942', zIndex: 10, flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, width: '100%', alignItems: 'center' }}>
          <button className={`nav-icon-btn ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')} title="Chats">
            <Icon.Chats />
          </button>
          <button className={`nav-icon-btn ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')} title="Status">
            <Icon.Status />
          </button>
          <button className={`nav-icon-btn ${activeTab === 'channels' ? 'active' : ''}`} onClick={() => setActiveTab('channels')} title="Channels">
            <Icon.Groups />
          </button>
          <button className={`nav-icon-btn ${activeTab === 'communities' ? 'active' : ''}`} onClick={() => setActiveTab('communities')} title="Communities">
            <Icon.Group />
          </button>
          <button className={`nav-icon-btn ${activeTab === 'meta-ai' ? 'active' : ''}`} onClick={() => setActiveTab('meta-ai')} title="Meta AI">
            <Icon.MetaAI />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', alignItems: 'center' }}>
          <button className={`nav-icon-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} title="Settings">
            <Icon.Settings />
          </button>
          <div style={{ cursor: 'pointer', marginTop: 4 }}>
            <Avatar src={currentUser?.profile_pic} name={currentUser?.username || currentUser?.phone || 'Me'} size={32} />
          </div>
        </div>
      </div>

      {/* ═══════════════ MAIN CHAT LIST PANEL ═══════════════ */}
      <div style={{ width:380, minWidth:300, display:'flex', flexDirection:'column', background:'#111b21', borderRight:'1px solid #2a3942', position:'relative', overflow:'hidden', flexShrink:0 }}>

        {/* ── MAIN CHAT LIST ── */}
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', background:'#111b21', transition:'transform .25s cubic-bezier(.4,0,.2,1)', transform: isNewChatOpen ? 'translateX(-100%)' : 'translateX(0)' }}>

          {/* Header */}
          <div style={{ height:60, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', flexShrink:0 }}>
            <div style={{ color:'#e9edef', fontSize:22, fontWeight:600 }}>WhatsApp</div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <button className="icon-btn" style={{ color:'#aebac1' }} onClick={openNewChatPanel} title="New chat">
                <Icon.NewChat />
              </button>
              <button className="icon-btn" style={{ color:'#aebac1' }} onClick={() => setIsCreateGroupOpen(true)} title="New group">
                <Icon.Group />
              </button>
              <button className="icon-btn" style={{ color:'#aebac1' }} title="Menu">
                <Icon.DotsVertical />
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ padding:'8px 12px', background:'#111b21', flexShrink:0 }}>
            <div style={{ background:'#202c33', borderRadius:8, display:'flex', alignItems:'center', padding:'7px 12px', gap:10 }}>
              <span style={{ color:'#8696a0', display:'flex', width: 20, height: 20 }}><Icon.Search /></span>
              <input
                type="text"
                placeholder="Search or start a new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex:1, background:'none', border:'none', outline:'none', color:'#e9edef', fontSize:15, caretColor:'#00a884' }}
              />
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, padding: '4px 12px 12px', overflowX: 'auto', flexShrink: 0 }}>
            {['All', 'Unread', 'Favourites', 'Groups'].map(filter => (
              <div 
                key={filter} 
                className={`filter-pill ${filter === 'All' ? 'active' : ''}`}
              >
                {filter}
              </div>
            ))}
          </div>

          {/* Chat list / Status / Calls placeholder */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {activeTab === 'status' ? (
              <StatusTab currentUser={currentUser} />
            ) : activeTab !== 'chats' ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#8696a0', fontSize:14, gap:12, padding:32, textAlign:'center' }}>
                <Icon.Calls />
                <span style={{ marginTop:8 }}>No recent calls</span>
              </div>
            ) : (
              <ChatList 
                chats={filteredChats} 
                currentUser={currentUser} 
                selectedChat={selectedChat} 
                onChatClick={openChat} 
              />
            )}
          </div>
        </div>

        {/* ── NEW CHAT PANEL ── */}
        <NewChatPanel
          isOpen={isNewChatOpen}
          onClose={() => setIsNewChatOpen(false)}
          onStartChat={startNewChat}
          onCreateGroup={() => {
            setIsNewChatOpen(false);
            setIsCreateGroupOpen(true);
          }}
        />
      </div>

      {/* ═══════════════ RIGHT CHAT AREA ═══════════════ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
        <ChatWindow
          chat={selectedChat}
          messages={messages}
          currentUser={currentUser}
          newMessage={newMessage}
          setNewMessage={handleTyping}
          onSendMessage={handleSendMessage}
          onContextMenu={setContextMenu}
          onOpenMediaUpload={() => setIsMediaUploadOpen(true)}
          onOpenGroupInfo={() => setIsGroupInfoOpen(true)}
          onReactionClick={(messageId, x, y) => setReactionPicker({ messageId, x, y })}
          typingUsers={typingUsers[selectedChat?.id] || []}
          ws={wsRef.current}
          onCallStarted={(callId, callType, remoteUser) =>
            setActiveCall({ callId, callType, remoteUser, isCaller: true })
          }
        />
      </div>

      {/* ── Context Menu ── */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            { label: 'Reply',        action: () => {} },
            { label: 'React',        action: () => {
              setReactionPicker({ messageId: contextMenu.msgId, x: contextMenu.x, y: contextMenu.y });
              setContextMenu(null);
            }},
            { label: 'Copy',         action: () => navigator.clipboard?.writeText(contextMenu.content || '') },
            { label: 'Forward',      action: () => {
              const msg = messages.find(m => m.id === contextMenu.msgId);
              if (msg) {
                setMessageToForward(msg);
                setIsForwardModalOpen(true);
              }
              setContextMenu(null);
            }},
            { label: 'Star message', action: () => {} },
            { label: 'Delete',       action: () => {}, danger: true },
          ]}
        />
      )}

      {/* ── Reaction Picker ── */}
      {reactionPicker && (
        <ReactionPicker
          x={reactionPicker.x}
          y={reactionPicker.y}
          onSelect={(emoji) => handleReaction(reactionPicker.messageId, emoji)}
          onClose={() => setReactionPicker(null)}
        />
      )}

      {/* ── Create Group Panel ── */}
      {isCreateGroupOpen && (
        <CreateGroupPanel
          contacts={contacts}
          onClose={() => setIsCreateGroupOpen(false)}
          onCreate={handleCreateGroup}
          onLoadContacts={fetchContacts}
        />
      )}

      {/* ── Group Info Panel ── */}
      {isGroupInfoOpen && selectedChat?.is_group && (
        <GroupInfoPanel
          chat={selectedChat}
          currentUser={currentUser}
          onClose={() => setIsGroupInfoOpen(false)}
          onUpdate={fetchInitialData}
        />
      )}

      {/* ── Media Upload Modal ── */}
      {isMediaUploadOpen && (
        <MediaUploadModal
          onClose={() => setIsMediaUploadOpen(false)}
          onUpload={handleMediaUpload}
        />
      )}

      {/* ── Forward Message Modal ── */}
      {isForwardModalOpen && (
        <ForwardMessageModal
          chats={chats}
          currentUser={currentUser}
          onClose={() => {
            setIsForwardModalOpen(false);
            setMessageToForward(null);
          }}
          onForward={handleForwardMessage}
        />
      )}

      {/* ── Incoming Call Alert ── */}
      {incomingCall && (
        <IncomingCallAlert
          call={incomingCall}
          onAccept={(callId, callType, caller) => {
            setIncomingCall(null);
            setActiveCall({ callId, callType, remoteUser: caller, isCaller: false, offerSdp: incomingCall.sdp });
          }}
          onReject={() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'call_reject',
                call_id: incomingCall.call_id,
                target_user_id: incomingCall.caller_id,
              }));
            }
            setIncomingCall(null);
          }}
        />
      )}

      {/* ── Active Call Screen ── */}
      {activeCall && (
        <CallScreen
          callId={activeCall.callId}
          callType={activeCall.callType}
          remoteUser={activeCall.remoteUser}
          isCaller={activeCall.isCaller}
          offerSdp={activeCall.offerSdp}
          ws={wsRef.current}
          localUserId={currentUser?.id}
          onEnd={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}

export default App;
