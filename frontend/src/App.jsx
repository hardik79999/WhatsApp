import { useEffect, useRef, useState } from 'react';
import Login from './Login';
import api from './api';
import Avatar from './components/Avatar';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import NewChatPanel from './components/NewChatPanel';
import CreateGroupPanel from './components/CreateGroupPanel';
import GroupInfoPanel from './components/GroupInfoPanel';
import ContactInfoPanel from './components/ContactInfoPanel';
import ReactionPicker from './components/ReactionPicker';
import ForwardMessageModal from './components/ForwardMessageModal';
import { Icon } from './components/Icons';
import ProfilePanel from './components/ProfilePanel';
import StatusTab from './components/StatusTab';
import IncomingCallAlert from './components/IncomingCallAlert';
import CallScreen from './components/CallScreen';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('csrf_access_token')));
  const [currentUser, setCurrentUser]         = useState(null);
  const [chats, setChats]                     = useState([]);
  const [loading, setLoading]                 = useState(() => Boolean(localStorage.getItem('csrf_access_token')));
  const [isNewChatOpen, setIsNewChatOpen]     = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [contacts, setContacts]               = useState([]);
  const [selectedChat, setSelectedChat]       = useState(null);
  const [messages, setMessages]               = useState([]);
  const [searchQuery, setSearchQuery]         = useState('');
  const [activeTab, setActiveTab]             = useState(() => sessionStorage.getItem('activeTab') || 'chats'); // 'chats' | 'status' | 'calls'
  const [reactionPicker, setReactionPicker]   = useState(null);   // { x, y, messageId }
  const [typingUsers, setTypingUsers]         = useState({});     // { chatId: [userId1, userId2] }
  const [incomingCall, setIncomingCall]       = useState(null);   // incoming_call WS payload
  const [activeCall, setActiveCall]           = useState(null);   // { callId, callType, remoteUser, isCaller, offerSdp? }
  const [isProfileOpen, setIsProfileOpen]     = useState(false);  // Profile panel

  const wsRef           = useRef(null);
  const selectedChatRef = useRef(null);
  const currentUserRef  = useRef(null);

  useEffect(() => {
    if (isAuthenticated) fetchInitialData();
  }, [isAuthenticated]);

  // Keep refs in sync
  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Persist active tab across reloads
  useEffect(() => { sessionStorage.setItem('activeTab', activeTab); }, [activeTab]);

  // WebSocket — persistent connection for real-time messages
  useEffect(() => {
    if (!isAuthenticated) return;

    let socket;
    let reconnectTimeout;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/ws`;
      socket = new WebSocket(wsUrl);
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
              const otherUser = !currentChat.is_group
                ? currentChat.participants?.find(p => p.user_id !== currentUserRef.current?.id)
                : null;
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
          // Update user online status in chats list
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
          // Also update selectedChat so header & ContactInfoPanel reflect live status
          setSelectedChat(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              participants: prev.participants?.map(p =>
                p.user_id === incomingData.user_id
                  ? { ...p, is_online: incomingData.status === 'online' }
                  : p
              )
            };
          });
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

        // Event: Message edited
        else if (incomingData.type === "message_edited") {
          setMessages(prev =>
            prev.map(m =>
              m.id === incomingData.message_id
                ? {
                    ...m,
                    content: incomingData.new_content,
                    is_edited: true,
                    edited_at: incomingData.edited_at,
                  }
                : m
            )
          );
          setChats(prev =>
            prev.map(c =>
              String(c.id) === String(incomingData.chat_id) && c.last_message?.id === incomingData.message_id
                ? {
                    ...c,
                    last_message: {
                      ...c.last_message,
                      content: incomingData.new_content,
                      is_edited: true,
                      edited_at: incomingData.edited_at,
                    },
                  }
                : c
            )
          );
        }

        // Event: Message deleted for everyone
        else if (incomingData.type === "message_deleted") {
          setMessages(prev =>
            prev.map(m =>
              m.id === incomingData.message_id
                ? {
                    ...m,
                    is_deleted_for_everyone: true,
                    content: "This message was deleted",
                    media_url: null,
                    thumbnail_url: null,
                  }
                : m
            )
          );
          setChats(prev =>
            prev.map(c =>
              String(c.id) === String(incomingData.chat_id) && c.last_message?.id === incomingData.message_id
                ? {
                    ...c,
                    last_message: {
                      ...c.last_message,
                      content: "This message was deleted",
                      is_deleted_for_everyone: true,
                      media_url: null,
                      thumbnail_url: null,
                    },
                  }
                : c
            )
          );
        }

        // Event: user offline with last_seen
        else if (incomingData.type === "user_offline") {
          setChats(prevChats =>
            prevChats.map(chat => ({
              ...chat,
              participants: chat.participants?.map(p =>
                p.user_id === incomingData.user_id
                  ? { ...p, is_online: false, last_seen: incomingData.last_seen }
                  : p
              )
            }))
          );
          setSelectedChat(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              participants: prev.participants?.map(p =>
                p.user_id === incomingData.user_id
                  ? { ...p, is_online: false, last_seen: incomingData.last_seen }
                  : p
              )
            };
          });
        }

        // ── Call signalling events ──────────────────────────────────────────
        else if (incomingData.type === "incoming_call") {
          setIncomingCall(incomingData);
        }

        else if (incomingData.type === "call_accepted") {
          // Handled directly in CallScreen via its own WS listener.
        }

        else if (incomingData.type === "call_rejected") {
          setActiveCall(prev => prev?.callId === incomingData.call_id ? null : prev);
          setIncomingCall(null);
        }

        else if (incomingData.type === "call_ended") {
          setActiveCall(prev => prev?.callId === incomingData.call_id ? null : prev);
          setIncomingCall(null);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      socket.onclose = (event) => {
        wsRef.current = null;
        if (event.code === 1008) {
          console.error('WebSocket auth failed (1008). Stopping reconnection and logging out.');
          setIsAuthenticated(false);
          localStorage.clear();
          sessionStorage.clear();
          return;
        }
        console.log('WebSocket disconnected. Attempting to reconnect...');
        reconnectTimeout = setTimeout(connect, 3000); // Reconnect in 3s
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      wsRef.current = null;
    };
  }, [isAuthenticated]);

  async function fetchInitialData() {
    try {
      const userRes  = await api.get('/users/me');
      const user = userRes.data;
      setCurrentUser(user);
      const chatsRes = await api.get('/chats/');
      const fetchedChats = chatsRes.data;
      setChats(fetchedChats);

      // Restore previously selected chat after refresh
      // Use String() comparison to handle number vs string id mismatch
      const savedChatId = sessionStorage.getItem('selectedChatId');
      if (savedChatId && !selectedChatRef.current) {
        const chat = fetchedChats.find(c => String(c.id) === String(savedChatId));
        if (chat) {
          setReplyTo(null);
          setSelectedChat(chat);
          selectedChatRef.current = chat;
          try {
            const res = await api.get(`/messages/${chat.id}`);
            setMessages(res.data);
          } catch (err) {
            console.error("Failed to restore messages", err);
          }
        }
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
  }

  const openNewChatPanel = () => {
    setIsNewChatOpen(true);
  };

  const fetchContacts = async () => {
    try {
      const res = await api.get('/contacts/');
      setContacts(res.data);
    } catch (error) {
      console.error(error);
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
    setReplyTo(null);
    setSelectedChat(chat);
    sessionStorage.setItem('selectedChatId', String(chat.id)); // persist across refresh
    // Clear unread count locally immediately
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread_count: 0 } : c));
    try {
      const res = await api.get(`/messages/${chat.id}`);
      setMessages(res.data);
      // Mark messages as read via WebSocket
      const receiver = !chat.is_group ? chat.participants?.find(p => p.user_id !== currentUser?.id) : null;
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

  const handleMessageAction = async (action, message, payload) => {
    if (!action || !message) return;

    if (action === 'reply') {
      setReplyTo(message);
      return;
    }

    if (action === 'react' && typeof payload === 'string') {
      await handleReaction(message.id, payload);
      return;
    }

    if (action === 'more-reactions') {
      const x = payload?.x ?? Math.round(window.innerWidth / 2);
      const y = payload?.y ?? Math.round(window.innerHeight / 2);
      setReactionPicker({ messageId: message.id, x, y });
      return;
    }

    if (action === 'forward') {
      setMessageToForward(message);
      setIsForwardModalOpen(true);
      return;
    }

    if (action === 'star') {
      try {
        await api.post(`/messages/${message.id}/star`);
      } catch (error) {
        console.error('Failed to star message', error);
      }
      return;
    }

    if (action === 'delete') {
      const confirmed = window.confirm('Delete this message?');
      if (!confirmed) return;
      const isMine = String(message.sender_id) === String(currentUser?.id);
      const deleteForEveryone = isMine ? window.confirm('Delete for everyone?') : false;

      try {
        await api.delete(`/messages/${message.id}`, { params: { delete_for_everyone: deleteForEveryone } });
      } catch (error) {
        console.error('Failed to delete message', error);
        alert(error.response?.data?.detail || 'Failed to delete message');
        return;
      }

      if (deleteForEveryone) {
        setMessages(prev =>
          prev.map(m =>
            m.id === message.id
              ? { ...m, is_deleted_for_everyone: true, content: 'This message was deleted', media_url: null, thumbnail_url: null }
              : m
          )
        );
        setChats(prev =>
          prev.map(c =>
            c.last_message?.id === message.id
              ? { ...c, last_message: { ...c.last_message, content: 'This message was deleted', is_deleted_for_everyone: true } }
              : c
          )
        );
      } else {
        setMessages(prev => prev.filter(m => m.id !== message.id));
        // Refresh chat list so last_message/unread_count reflect per-user deletions
        fetchInitialData().catch(() => {});
      }
      return;
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
      const res = await api.post('/groups/create', groupData);
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

  if (!isAuthenticated) return <Login onLoginSuccess={() => { setLoading(true); setIsAuthenticated(true); }} />;

  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', overflow:'hidden', background:'#111b21' }}>

      {/* ══════════════ LEFT SIDEBAR (thin icon nav) ══════════════ */}
      <div style={{
        width: 56, background: '#202c33', display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingTop: 8, paddingBottom: 8,
        borderRight: '1px solid #222d34', zIndex: 10, flexShrink: 0,
      }}>
        {/* Top: avatar */}
        <div
          style={{ cursor:'pointer', marginBottom: 16, marginTop: 4 }}
          onClick={() => setIsProfileOpen(true)}
          title="Profile"
        >
          <Avatar src={currentUser?.profile_pic} name={currentUser?.username || currentUser?.phone || 'Me'} size={34} />
        </div>

        {/* Nav icons */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, width:'100%' }}>
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

        {/* Bottom: settings */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <button className={`nav-icon-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} title="Settings">
            <Icon.Settings />
          </button>
        </div>
      </div>

      {/* ══════════════ CHAT LIST PANEL ══════════════ */}
      <div style={{
        width: 390, minWidth: 300, maxWidth: 450,
        display: 'flex', flexDirection: 'column',
        background: '#111b21', borderRight: '1px solid #222d34',
        position: 'relative', overflow: 'hidden', flexShrink: 0,
      }}>
        {/* Sliding inner container */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          background: '#111b21',
          transition: 'transform .25s cubic-bezier(.4,0,.2,1)',
          transform: isNewChatOpen ? 'translateX(-100%)' : 'translateX(0)',
        }}>

          {/* ── Header ── */}
          {activeTab === 'chats' && (
            <div style={{
              height: 59, display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '0 16px',
              background: '#202c33', flexShrink: 0,
            }}>
              <span style={{ color: '#e9edef', fontSize: 20, fontWeight: 600, letterSpacing: 0.2 }}>
                WhatsApp
              </span>
              <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <button className="icon-btn" onClick={openNewChatPanel} title="New chat">
                  <Icon.NewChat />
                </button>
                <button className="icon-btn" onClick={() => setIsCreateGroupOpen(true)} title="New group">
                  <Icon.Group />
                </button>
                <button className="icon-btn" title="Menu">
                  <Icon.DotsVertical />
                </button>
              </div>
            </div>
          )}

          {/* ── Search bar ── */}
          {activeTab === 'chats' && (
            <div style={{ padding: '8px 12px 6px', background: '#111b21', flexShrink: 0 }}>
              <div style={{
                background: '#202c33', borderRadius: 8,
                display: 'flex', alignItems: 'center',
                padding: '0 12px', height: 35, gap: 8,
              }}>
                <span style={{ color: '#8696a0', display: 'flex', flexShrink: 0 }}>
                  <Icon.Search />
                </span>
                <input
                  type="text"
                  placeholder="Search or start a new chat"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: '#e9edef', fontSize: 15, caretColor: '#00a884',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Filter pills ── */}
          {activeTab === 'chats' && (
            <div style={{
              display: 'flex', gap: 6, padding: '6px 12px 8px',
              overflowX: 'auto', flexShrink: 0,
            }}>
              {['All', 'Unread', 'Favourites', 'Groups'].map(f => (
                <button key={f} className={`filter-pill ${f === 'All' ? 'active' : ''}`}>
                  {f}
                </button>
              ))}
            </div>
          )}

          {/* ── Chat list / Status / Calls ── */}
          <div style={{ flex: 1, overflowY: activeTab === 'status' ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'status' ? (
              <StatusTab currentUser={currentUser} />
            ) : activeTab !== 'chats' ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#8696a0', fontSize:14, gap:12, padding:32, textAlign:'center' }}>
                <Icon.Calls />
                <span style={{ marginTop: 8 }}>No recent calls</span>
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

        {/* ── New Chat Panel ── */}
        <NewChatPanel
          isOpen={isNewChatOpen}
          onClose={() => setIsNewChatOpen(false)}
          onStartChat={startNewChat}
          onCreateGroup={() => { setIsNewChatOpen(false); setIsCreateGroupOpen(true); }}
        />

        {/* ── Profile Panel ── */}
        <ProfilePanel
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          onProfileUpdate={(updated) => setCurrentUser(updated)}
        />
      </div>

      {/* ══════════════ RIGHT CHAT AREA ══════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', position: 'relative', overflow: 'hidden', minWidth: 0 }}>

        {/* Chat window */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, position: 'relative' }}>
          <ChatWindow
            chat={selectedChat}
            messages={messages}
            currentUser={currentUser}
            onMessageSent={(newMsg) => {
              setMessages((prev) => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              setChats((prev) => prev.map(c =>
                c.id === newMsg.chat_id
                  ? { ...c, last_message: newMsg, updated_at: newMsg.created_at }
                  : c
              ));
            }}
            onOpenGroupInfo={() => setIsGroupInfoOpen(true)}
            onOpenContactInfo={() => setIsContactInfoOpen(true)}
            typingUsers={typingUsers[selectedChat?.id] || []}
            ws={wsRef.current}
            onMessageAction={handleMessageAction}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            onCallStarted={(callId, callType, remoteUser) =>
              setActiveCall({ callId, callType, remoteUser, isCaller: true })
            }
          />
        </div>

        {/* ── Group Info Panel — slides in as right sidebar ── */}
        {selectedChat?.is_group && (
          <GroupInfoPanel
            chat={selectedChat}
            currentUser={currentUser}
            isOpen={isGroupInfoOpen}
            onClose={() => setIsGroupInfoOpen(false)}
            onUpdate={fetchInitialData}
          />
        )}

        {/* ── Contact Info Panel — slides in as right sidebar ── */}
        {!selectedChat?.is_group && (() => {
          const chatOther = selectedChat?.participants?.find(p => p.user_id !== currentUser?.id);
          return chatOther ? (
            <ContactInfoPanel
              contact={{ ...chatOther, chat_id: selectedChat?.id }}
              isOpen={isContactInfoOpen}
              onClose={() => setIsContactInfoOpen(false)}
            />
          ) : null;
        })()}
      </div>

      {/* ── Reaction Picker ── */}
      {reactionPicker && (
        <ReactionPicker
          isOpen={true}
          position={{ x: reactionPicker.x, y: reactionPicker.y }}
          onSelect={(emoji) => handleReaction(reactionPicker.messageId, emoji)}
          onClose={() => setReactionPicker(null)}
        />
      )}

      {/* ── Create Group Panel ── */}
      {isCreateGroupOpen && (
        <CreateGroupPanel
          isOpen={isCreateGroupOpen}
          contacts={contacts}
          onClose={() => setIsCreateGroupOpen(false)}
          onCreate={handleCreateGroup}
          onLoadContacts={fetchContacts}
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
            setActiveCall({ callId, callType, remoteUser: caller, isCaller: false });
          }}
          onReject={() => {
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
          ws={wsRef.current}
          localUserId={currentUser?.id}
          onEnd={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}

export default App;
