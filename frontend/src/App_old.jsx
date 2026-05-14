import React, { useState, useEffect, useRef } from 'react';
import Login from './Login';
import api from './api';
import Avatar from './components/Avatar';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import NewChatPanel from './components/NewChatPanel';
import ContextMenu from './components/ContextMenu';
import { Icon } from './components/Icons';

/* ─── Removed Icons - Now in separate file ─── */
const IconOld = {
  WhatsApp: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  NewChat: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z"/>
    </svg>
  ),
  DotsVertical: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"/>
    </svg>
  ),
  Back: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
    </svg>
  ),
  Emoji: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M9.153 11.603c.795 0 1.44-.88 1.44-1.962s-.645-1.96-1.44-1.96c-.795 0-1.44.88-1.44 1.96s.645 1.965 1.44 1.965zM5.95 12.965c-.027-.307-.132 5.218 6.062 5.218 6.066 0 6.037-4.952 6.037-5.218H5.95zm11.362 1.108s-.67 1.96-5.05 1.96c-3.506 0-5.39-1.165-5.608-1.96h10.658zm-1.804-1.108c.795 0 1.44-.88 1.44-1.962s-.645-1.96-1.44-1.96c-.795 0-1.44.88-1.44 1.96s.645 1.965 1.44 1.965zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.001c-4.962 0-9-4.038-9-9s4.038-9 9-9 9 4.038 9 9-4.038 9-9 9z"/>
    </svg>
  ),
  Attach: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.572.572 0 0 0-.834.018L3.455 11.59a5.564 5.564 0 0 0-1.639 3.966z"/>
    </svg>
  ),
  Mic: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z"/>
    </svg>
  ),
  Send: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
    </svg>
  ),
  CheckDouble: () => (
    <svg viewBox="0 0 16 15" fill="currentColor" width="16" height="15">
      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  ),
  CheckSingle: () => (
    <svg viewBox="0 0 16 15" fill="currentColor" width="16" height="15">
      <path d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
    </svg>
  ),
  VideoCall: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M15 8v8H5V8h10m1-2H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4V7c0-.55-.45-1-1-1z"/>
    </svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
    </svg>
  ),
  Status: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
    </svg>
  ),
  Calls: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
    </svg>
  ),
  Chats: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
  ),
};

/* ─── Helpers ─── */
const avatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&background=random&color=fff&size=128`;

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

const formatMsgTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateLabel = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return 'Today';
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

/* ─── Sub-components ─── */
function Avatar({ src, name, size = 40 }) {
  const [err, setErr] = useState(false);
  return (
    <img
      src={err || !src ? avatar(name) : src}
      alt={name}
      onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  );
}

function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Adjust position so menu doesn't go off-screen
  const style = {
    position: 'fixed',
    top: Math.min(y, window.innerHeight - 160),
    left: Math.min(x, window.innerWidth - 180),
    background: '#233138',
    borderRadius: 6,
    boxShadow: '0 4px 24px rgba(0,0,0,.5)',
    zIndex: 9999,
    minWidth: 160,
    overflow: 'hidden',
    animation: 'fadeIn .12s ease',
  };

  return (
    <div ref={ref} style={style}>
      {items.map((item) => (
        <div
          key={item.label}
          onClick={() => { item.action(); onClose(); }}
          style={{
            padding: '12px 20px', color: item.danger ? '#f15c6d' : '#e9edef',
            fontSize: 14, cursor: 'pointer', transition: 'background .1s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#2a3942'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

function MessageTicks({ status }) {
  if (status === 'read') return <span style={{ color: '#53bdeb', display: 'flex' }}><Icon.CheckDouble /></span>;
  if (status === 'delivered') return <span style={{ color: '#8696a0', display: 'flex' }}><Icon.CheckDouble /></span>;
  return <span style={{ color: '#8696a0', display: 'flex' }}><Icon.CheckSingle /></span>;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser]         = useState(null);
  const [chats, setChats]                     = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [isNewChatOpen, setIsNewChatOpen]     = useState(false);
  const [contacts, setContacts]               = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedChat, setSelectedChat]       = useState(null);
  const [messages, setMessages]               = useState([]);
  const [newMessage, setNewMessage]           = useState('');
  const [searchQuery, setSearchQuery]         = useState('');
  const [contactSearch, setContactSearch]     = useState('');
  const [activeTab, setActiveTab]             = useState('chats'); // 'chats' | 'status' | 'calls'
  const [contextMenu, setContextMenu]         = useState(null);   // { x, y, msgId }
  const messagesEndRef  = useRef(null);
  const wsRef           = useRef(null);
  const selectedChatRef = useRef(null);
  const currentUserRef  = useRef(null);
  const inputRef        = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('csrf_access_token');
    if (token) setIsAuthenticated(true);
    else setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchInitialData();
  }, [isAuthenticated]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Keep refs in sync
  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // WebSocket — persistent connection for real-time messages
  useEffect(() => {
    if (!isAuthenticated) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onmessage = (event) => {
      const incomingData = JSON.parse(event.data);

      // Event: Naya message aaya
      if (incomingData.type === "new_message") {
        setSelectedChat((currentChat) => {
          if (currentChat && currentChat.id === incomingData.chat_id) {
            setMessages((prev) => [...prev, incomingData]);
            // Agar chat khuli hai toh turant mark_read bhejo
            const otherUser = currentChat.participants?.find(p => p.user_id !== currentUserRef.current?.id);
            if (otherUser && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({
                type: "mark_read",
                chat_id: currentChat.id,
                receiver_id: otherUser.user_id
              }));
            }
          }
          return currentChat;
        });
        fetchInitialData();
      }

      // Event: Samne wale ne mere messages padh liye (Blue Ticks!)
      else if (incomingData.type === "messages_read") {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            // Agar msg us chat ka hai, aur maine bheja tha, toh status 'read' kar do
            (msg.chat_id === incomingData.chat_id && msg.sender_id === currentUser.id)
              ? { ...msg, status: "read" } 
              : msg
          )
        );
      }
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
      setChats(chatsRes.data);
    } catch (error) {
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        localStorage.clear();
      }
    } finally {
      setLoading(false);
    }
  };

  const openNewChatPanel = async () => {
    setIsNewChatOpen(true);
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
      alert(error.response?.data?.detail || 'Error starting chat');
    }
  };

  const openChat = async (chat) => {
    setSelectedChat(chat);
    try {
      const res = await api.get(`/messages/${chat.id}`);
      setMessages(res.data);
      
      // NAYA LOGIC: Chat khulte hi sab kuch "read" mark kar do
      const receiver = chat.participants.find(p => p.user_id !== currentUser.id);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "mark_read",
          chat_id: chat.id,
          receiver_id: receiver.user_id
        }));
      }
    } catch (error) { console.error("Failed to load messages", error); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await api.post('/messages/', {
        chat_id: selectedChat.id,
        content: newMessage,
        message_type: 'text',
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
      fetchInitialData();
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const filteredChats = chats.filter((c) => {
    if (!searchQuery.trim()) return true;
    const other = c.participants?.find((p) => p.user_id !== currentUser?.id);
    const name  = (other?.username || other?.phone || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const filteredContacts = contacts.filter((c) =>
    !contactSearch.trim() || c.saved_name?.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const chatOther = selectedChat?.participants?.find((p) => p.user_id !== currentUser?.id);
  const chatName  = chatOther?.username || chatOther?.phone || 'Unknown';
  const chatPic   = chatOther?.profile_pic || null;

  if (loading)
    return (
      <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:'#111b21', flexDirection:'column', gap:16 }}>
        <div style={{ width:56, height:56, border:'4px solid #2a3942', borderTopColor:'#00a884', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
        <span style={{ color:'#8696a0', fontSize:14 }}>Loading WhatsApp…</span>
      </div>
    );

  if (!isAuthenticated) return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#111b21' }}>

      {/* ═══════════════ LEFT PANEL ═══════════════ */}
      <div style={{ width:420, minWidth:300, display:'flex', flexDirection:'column', background:'#111b21', borderRight:'1px solid #2a3942', position:'relative', overflow:'hidden', flexShrink:0 }}>

        {/* ── MAIN CHAT LIST ── */}
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', background:'#111b21', transition:'transform .25s cubic-bezier(.4,0,.2,1)', transform: isNewChatOpen ? 'translateX(-100%)' : 'translateX(0)' }}>

          {/* Header */}
          <div style={{ height:60, background:'#202c33', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', flexShrink:0 }}>
            <div style={{ cursor:'pointer' }}>
              <Avatar src={currentUser?.profile_pic} name={currentUser?.username || currentUser?.phone || 'Me'} size={40} />
            </div>
            <div style={{ display:'flex', gap:2, alignItems:'center' }}>
              <button className="icon-btn" style={{ color:'#aebac1' }} onClick={openNewChatPanel} title="New chat">
                <Icon.NewChat />
              </button>
              <button className="icon-btn" style={{ color:'#aebac1' }} title="Menu">
                <Icon.DotsVertical />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', background:'#202c33', borderBottom:'1px solid #2a3942', flexShrink:0 }}>
            {[
              { id:'chats',  label:'Chats',  Icon: Icon.Chats  },
              { id:'status', label:'Status', Icon: Icon.Status },
              { id:'calls',  label:'Calls',  Icon: Icon.Calls  },
            ].map(({ id, label, Icon: TabIcon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`sidebar-tab${activeTab === id ? ' active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ padding:'8px 12px', background:'#111b21', flexShrink:0 }}>
            <div style={{ background:'#202c33', borderRadius:8, display:'flex', alignItems:'center', padding:'7px 12px', gap:10 }}>
              <span style={{ color:'#8696a0', display:'flex' }}><Icon.Search /></span>
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex:1, background:'none', border:'none', outline:'none', color:'#e9edef', fontSize:15, caretColor:'#00a884' }}
              />
            </div>
          </div>

          {/* Chat list / Status / Calls placeholder */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {activeTab !== 'chats' ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#8696a0', fontSize:14, gap:12, padding:32, textAlign:'center' }}>
                {activeTab === 'status' ? <Icon.Status /> : <Icon.Calls />}
                <span style={{ marginTop:8 }}>{activeTab === 'status' ? 'No recent status updates' : 'No recent calls'}</span>
              </div>
            ) : filteredChats.length === 0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#8696a0', fontSize:14, gap:12, padding:24 }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48" style={{ opacity:.3 }}><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                <span>No chats yet</span>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const other    = chat.participants?.find((p) => p.user_id !== currentUser?.id);
                const name     = other?.username || other?.phone || 'Unknown';
                const pic      = other?.profile_pic || null;
                const isActive = selectedChat?.id === chat.id;
                const lastMsg  = chat.last_message;
                const lastText = lastMsg?.content || '';
                const lastTime = formatChatTime(lastMsg?.created_at || chat.updated_at);
                const isMine   = lastMsg?.sender_id === currentUser?.id;
                const unread   = chat.unread_count || 0;

                return (
                  <div
                    key={chat.id}
                    onClick={() => openChat(chat)}
                    className={`chat-item${isActive ? ' active' : ''}`}
                    style={{ display:'flex', alignItems:'center', padding:'10px 16px', cursor:'pointer', borderBottom:'1px solid #2a3942' }}
                  >
                    {/* Avatar with online dot */}
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <Avatar src={pic} name={name} size={49} />
                      {other?.is_online && (
                        <span style={{ position:'absolute', bottom:2, right:2, width:12, height:12, borderRadius:'50%', background:'#00a884', border:'2px solid #111b21' }} />
                      )}
                    </div>

                    <div style={{ flex:1, minWidth:0, marginLeft:15 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:3 }}>
                        <span style={{ color:'#e9edef', fontSize:17, fontWeight:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{name}</span>
                        <span style={{ color: unread > 0 ? '#00a884' : '#8696a0', fontSize:12, flexShrink:0, marginLeft:8 }}>{lastTime}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:4 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:4, minWidth:0, flex:1 }}>
                          {isMine && (
                            <span style={{ color: lastMsg?.status === 'read' ? '#53bdeb' : '#8696a0', display:'flex', flexShrink:0 }}>
                              <Icon.CheckDouble />
                            </span>
                          )}
                          <span style={{ color:'#8696a0', fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {lastText || <em style={{ opacity:.6 }}>No messages yet</em>}
                          </span>
                        </div>
                        {unread > 0 && (
                          <span className="unread-badge">{unread > 99 ? '99+' : unread}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── NEW CHAT PANEL ── */}
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', background:'#111b21', transition:'transform .25s cubic-bezier(.4,0,.2,1)', transform: isNewChatOpen ? 'translateX(0)' : 'translateX(100%)', zIndex:20 }}>
          <div style={{ background:'#202c33', padding:'72px 24px 20px', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <button className="icon-btn" style={{ color:'#aebac1' }} onClick={() => { setIsNewChatOpen(false); setContactSearch(''); }}>
                <Icon.Back />
              </button>
              <span style={{ color:'#e9edef', fontSize:19, fontWeight:500 }}>New chat</span>
            </div>
          </div>
          <div style={{ padding:'8px 12px', background:'#111b21', flexShrink:0 }}>
            <div style={{ background:'#202c33', borderRadius:8, display:'flex', alignItems:'center', padding:'7px 12px', gap:10 }}>
              <span style={{ color:'#8696a0', display:'flex' }}><Icon.Search /></span>
              <input
                type="text"
                placeholder="Search contacts"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                autoFocus
                style={{ flex:1, background:'none', border:'none', outline:'none', color:'#e9edef', fontSize:15, caretColor:'#00a884' }}
              />
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {loadingContacts ? (
              <div style={{ display:'flex', justifyContent:'center', padding:32 }}>
                <div style={{ width:32, height:32, border:'3px solid #2a3942', borderTopColor:'#00a884', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#8696a0', fontSize:14, gap:12, padding:24 }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48" style={{ opacity:.3 }}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                <span>No contacts found</span>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => startNewChat(contact.contact_id)}
                  style={{ display:'flex', alignItems:'center', padding:'10px 16px', cursor:'pointer', borderBottom:'1px solid #2a3942' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#202c33'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Avatar src={contact.profile_pic} name={contact.saved_name} size={49} />
                  <div style={{ marginLeft:15 }}>
                    <div style={{ color:'#e9edef', fontSize:17 }}>{contact.saved_name}</div>
                    <div style={{ color:'#8696a0', fontSize:13, marginTop:2 }}>Hey there! I am using WhatsApp.</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════ RIGHT CHAT AREA ═══════════════ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>

        {!selectedChat ? (
          /* Welcome screen */
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#222e35', borderBottom:'6px solid #00a884' }}>
            <div style={{ width:220, height:220, borderRadius:'50%', background:'#2a3942', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:40 }}>
              <svg viewBox="0 0 212 212" fill="none" width="160" height="160">
                <circle cx="106" cy="106" r="106" fill="#00a884"/>
                <path fill="#fff" d="M106 52c-29.8 0-54 24.2-54 54 0 9.8 2.6 19 7.2 26.9L52 160l27.5-7.2c7.6 4.1 16.3 6.4 25.5 6.4 29.8 0 54-24.2 54-54S135.8 52 106 52zm26.8 74.8c-1.1 3.1-6.5 5.9-9 6.3-2.3.4-5.2.5-8.4-.5-1.9-.6-4.4-1.5-7.5-2.9-13.2-5.7-21.8-19-22.5-19.9-.7-.9-5.7-7.6-5.7-14.5s3.6-10.3 4.9-11.7c1.3-1.4 2.8-1.7 3.7-1.7h2.7c.9 0 2.1-.3 3.2 2.5 1.2 2.8 4 9.7 4.4 10.4.4.7.6 1.5.1 2.4-.5.9-.7 1.5-1.4 2.3-.7.8-1.5 1.8-.7 3.1.8 1.3 3.5 5.8 7.5 9.4 5.2 4.6 9.5 6 10.9 6.7 1.4.7 2.2.6 3-.4.8-1 3.4-4 4.3-5.4.9-1.4 1.8-1.1 3-.7 1.2.4 7.8 3.7 9.1 4.4 1.3.7 2.2 1 2.5 1.6.4.6.4 3.4-.7 6.6z"/>
              </svg>
            </div>
            <h2 style={{ color:'#e9edef', fontSize:32, fontWeight:300, margin:'0 0 12px' }}>WhatsApp Web</h2>
            <p style={{ color:'#8696a0', fontSize:14, textAlign:'center', maxWidth:380, lineHeight:1.7, margin:'0 0 32px' }}>
              Send and receive messages without keeping your phone online.<br/>
              Use WhatsApp on up to 4 linked devices and 1 phone.
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:8, color:'#8696a0', fontSize:13, borderTop:'1px solid #2a3942', paddingTop:24, width:380, justifyContent:'center' }}>
              <Icon.Lock />
              <span>Your personal messages are end-to-end encrypted</span>
            </div>
          </div>
        ) : (
          <>
            {/* Chat background */}
            <div className="wa-bg" style={{ position:'absolute', inset:0 }} />

            {/* ── Chat Header ── */}
            <div style={{ height:60, background:'#202c33', display:'flex', alignItems:'center', padding:'0 16px', gap:12, zIndex:10, position:'relative', flexShrink:0 }}>
              <div style={{ cursor:'pointer' }}>
                <div style={{ position:'relative' }}>
                  <Avatar src={chatPic} name={chatName} size={40} />
                  {chatOther?.is_online && (
                    <span style={{ position:'absolute', bottom:1, right:1, width:10, height:10, borderRadius:'50%', background:'#00a884', border:'2px solid #202c33' }} />
                  )}
                </div>
              </div>
              <div style={{ flex:1, minWidth:0, cursor:'pointer' }}>
                <div style={{ color:'#e9edef', fontSize:16, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{chatName}</div>
                <div style={{ color:'#8696a0', fontSize:13 }}>
                  {chatOther?.is_online ? 'online' : 'click here for contact info'}
                </div>
              </div>
              <div style={{ display:'flex', gap:2 }}>
                <button className="icon-btn" style={{ color:'#aebac1' }} title="Video call">
                  <Icon.VideoCall />
                </button>
                <button className="icon-btn" style={{ color:'#aebac1' }} title="Voice call">
                  <Icon.Phone />
                </button>
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
              onClick={() => contextMenu && setContextMenu(null)}
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
                messages.map((msg, idx) => {
                  const isMine   = msg.sender_id === currentUser.id;
                  const timeStr  = formatMsgTime(msg.created_at);
                  const prevMsg  = messages[idx - 1];
                  const nextMsg  = messages[idx + 1];
                  const showDate = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                  // Group consecutive messages from same sender
                  const isFirst  = !prevMsg || prevMsg.sender_id !== msg.sender_id || showDate;
                  const isLast   = !nextMsg || nextMsg.sender_id !== msg.sender_id ||
                    new Date(nextMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString();

                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div style={{ alignSelf:'center', background:'rgba(11,20,26,.75)', color:'#e9edef', fontSize:12.5, padding:'5px 14px', borderRadius:8, margin:'8px 0', fontWeight:500 }}>
                          {formatDateLabel(msg.created_at)}
                        </div>
                      )}
                      <div
                        style={{ display:'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: isLast ? 6 : 1 }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, msgId: msg.id, content: msg.content });
                        }}
                      >
                        <div
                          className={isFirst ? (isMine ? 'bubble-out' : 'bubble-in') : ''}
                          style={{
                            position:'relative',
                            background: isMine ? '#005c4b' : '#202c33',
                            borderRadius: isMine
                              ? (isFirst ? '8px 0 8px 8px' : '8px 8px 8px 8px')
                              : (isFirst ? '0 8px 8px 8px' : '8px 8px 8px 8px'),
                            padding:'6px 9px 22px',
                            maxWidth:'65%',
                            minWidth:80,
                            boxShadow:'0 1px 2px rgba(0,0,0,.3)',
                            marginTop: isFirst ? 0 : 0,
                          }}
                        >
                          <span style={{ color:'#e9edef', fontSize:14.5, lineHeight:1.5, wordBreak:'break-word', display:'block' }}>
                            {msg.content}
                          </span>
                          <span style={{ position:'absolute', bottom:5, right:8, display:'flex', alignItems:'center', gap:3, color:'#8696a0', fontSize:11, whiteSpace:'nowrap' }}>
                            {timeStr}
                            {isMine && <MessageTicks status={msg.status || 'sent'} />}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Bar ── */}
            <form
              onSubmit={handleSendMessage}
              style={{ background:'#202c33', display:'flex', alignItems:'center', padding:'8px 16px', gap:8, zIndex:10, position:'relative', flexShrink:0 }}
            >
              <button type="button" className="icon-btn" style={{ color:'#aebac1' }} title="Emoji">
                <Icon.Emoji />
              </button>
              <button type="button" className="icon-btn" style={{ color:'#aebac1' }} title="Attach">
                <Icon.Attach />
              </button>
              <div style={{ flex:1 }}>
                <textarea
                  ref={inputRef}
                  rows={1}
                  placeholder="Type a message"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  className="msg-input"
                  style={{ display:'block' }}
                />
              </div>
              <button
                type={newMessage.trim() ? 'submit' : 'button'}
                className="icon-btn"
                style={{
                  color: '#fff',
                  background: '#00a884',
                  borderRadius:'50%', width:40, height:40,
                  transition:'background .2s, transform .1s',
                }}
                title={newMessage.trim() ? 'Send' : 'Voice message'}
              >
                {newMessage.trim() ? <Icon.Send /> : <Icon.Mic />}
              </button>
            </form>
          </>
        )}
      </div>

      {/* ── Context Menu ── */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            { label: 'Reply',        action: () => {} },
            { label: 'Copy',         action: () => navigator.clipboard?.writeText(contextMenu.content || '') },
            { label: 'Forward',      action: () => {} },
            { label: 'Star message', action: () => {} },
            { label: 'Delete',       action: () => {}, danger: true },
          ]}
        />
      )}
    </div>
  );
}

export default App;

