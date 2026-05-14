import React, { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import { Icon } from './Icons';
import api from '../api';

export default function NewChatPanel({ isOpen, onClose, onStartChat, onCreateGroup }) {
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]       = useState(false);
  const [starting, setStarting]         = useState(null); // userId being started
  const [error, setError]               = useState('');
  const debounceRef = useRef(null);
  const inputRef    = useRef(null);

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setError('');
      setStarting(null);
    } else {
      // Auto-focus input when panel opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Debounced live search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      setError('');
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setError('');
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(res.data);
        if (res.data.length === 0) {
          setError('No user found with this number');
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Search failed, please try again');
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [searchQuery]);

  const handleStartChat = async (user) => {
    setStarting(user.id);
    try {
      await onStartChat(user.id);
    } finally {
      setStarting(null);
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: '#111b21',
      transition: 'transform .25s cubic-bezier(.4,0,.2,1)',
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      zIndex: 10,
    }}>

      {/* ── Header ── */}
      <div style={{
        height: 60, background: '#202c33',
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 20, flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aebac1', display: 'flex', padding: 8 }}
        >
          <Icon.Back />
        </button>
        <span style={{ color: '#e9edef', fontSize: 16, fontWeight: 600 }}>New Chat</span>
      </div>

      {/* ── Search Box ── */}
      <div style={{ padding: '8px 12px', background: '#111b21', flexShrink: 0 }}>
        <div style={{
          background: '#202c33', borderRadius: 8,
          display: 'flex', alignItems: 'center',
          padding: '7px 12px', gap: 10,
        }}>
          {searching
            ? <span style={{ color: '#00a884', display: 'flex', animation: 'spin .7s linear infinite' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              </span>
            : <span style={{ color: '#8696a0', display: 'flex' }}><Icon.Search /></span>
          }
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1, background: 'none', border: 'none',
              outline: 'none', color: '#e9edef',
              fontSize: 15, caretColor: '#00a884',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8696a0', display: 'flex', padding: 2 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Empty state & New Group button */}
        {!searching && searchQuery.length < 3 && (
          <>
            {searchQuery.length === 0 && (
              <div 
                onClick={onCreateGroup}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '12px 16px', gap: 14,
                  cursor: 'pointer',
                  borderBottom: '1px solid #1f2c33',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#202c33'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: '#00a884', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#fff'
                }}>
                  <Icon.Group />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#e9edef', fontSize: 16, margin: 0, fontWeight: 400 }}>New group</p>
                </div>
              </div>
            )}
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#8696a0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <p style={{ color: '#e9edef', fontSize: 15, margin: '0 0 8px' }}>Search for a user</p>
              <p style={{ fontSize: 13, margin: 0 }}>Type at least 3 digits of their phone number</p>
            </div>
          </>
        )}

        {/* Error state */}
        {error && !searching && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#8696a0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
            <p style={{ color: '#e9edef', fontSize: 15, margin: '0 0 8px' }}>{error}</p>
            <p style={{ fontSize: 13, margin: 0 }}>Try a different phone number</p>
          </div>
        )}

        {/* User list */}
        {searchResults.map((user) => {
          const isStarting = starting === user.id;
          return (
            <div
              key={user.id}
              onClick={() => !isStarting && handleStartChat(user)}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '12px 16px', gap: 14,
                cursor: isStarting ? 'wait' : 'pointer',
                borderBottom: '1px solid #1f2c33',
                transition: 'background .15s',
                opacity: isStarting ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (!isStarting) e.currentTarget.style.background = '#202c33'; }}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Avatar src={user.profile_pic} name={user.username || user.phone} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#e9edef', fontSize: 15, margin: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.username || 'Unknown'}
                </p>
                <p style={{ color: '#8696a0', fontSize: 13, margin: '2px 0 0' }}>{user.phone}</p>
              </div>
              <div style={{
                background: isStarting ? '#2a3942' : '#00a884',
                color: isStarting ? '#8696a0' : '#111b21',
                borderRadius: 20, padding: '5px 14px',
                fontSize: 12, fontWeight: 600,
                transition: 'background .2s',
                flexShrink: 0,
              }}>
                {isStarting ? '...' : 'Chat'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
