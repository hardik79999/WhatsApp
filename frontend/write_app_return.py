new_return = r'''  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#111b21' }}>

      {/* LEFT PANEL */}
      <div style={{ width:420, minWidth:300, display:'flex', flexDirection:'column', background:'#111b21', borderRight:'1px solid #2a3942', position:'relative', overflow:'hidden', flexShrink:0 }}>

        {/* MAIN CHAT LIST */}
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', background:'#111b21', transition:'transform .3s', transform: isNewChatOpen ? 'translateX(-100%)' : 'translateX(0)' }}>

          {/* Header */}
          <div style={{ height:60, background:'#202c33', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', flexShrink:0 }}>
            <div style={{ cursor:'pointer' }}>
              <Avatar src={currentUser?.profile_pic} name={currentUser?.username || currentUser?.phone || 'Me'} size={40} />
            </div>
            <div style={{ display:'flex', gap:4, alignItems:'center' }}>
              <button className="icon-btn" style={{ color:'#aebac1' }} onClick={openNewChatPanel} title="New chat">
                <Icon.NewChat />
              </button>
              <button className="icon-btn" style={{ color:'#aebac1' }} title="Menu">
                <Icon.DotsVertical />
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ padding:'8px 12px', background:'#111b21', flexShrink:0 }}>
            <div style={{ background:'#202c33', borderRadius:8, display:'flex', alignItems:'center', padding:'8px 12px', gap:10 }}>
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

          {/* Chat list */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {filteredChats.length === 0 ? (
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

                return (
                  <div
                    key={chat.id}
                    onClick={() => openChat(chat)}
                    style={{
                      display:'flex', alignItems:'center', padding:'10px 16px',
                      cursor:'pointer', borderBottom:'1px solid #2a3942',
                      background: isActive ? '#2a3942' : 'transparent',
                      transition:'background .15s',
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#202c33'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? '#2a3942' : 'transparent'; }}
                  >
                    <Avatar src={pic} name={name} size={49} />
                    <div style={{ flex:1, minWidth:0, marginLeft:15 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:2 }}>
                        <span style={{ color:'#e9edef', fontSize:17, fontWeight:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{name}</span>
                        <span style={{ color:'#8696a0', fontSize:12, flexShrink:0, marginLeft:8 }}>{lastTime}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        {isMine && (
                          <span style={{ color:'#53bdeb', display:'flex', flexShrink:0 }}>
                            <Icon.CheckDouble />
                          </span>
                        )}
                        <span style={{ color:'#8696a0', fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                          {lastText || <em style={{ opacity:.6 }}>No messages yet</em>}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* NEW CHAT PANEL */}
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', background:'#111b21', transition:'transform .3s', transform: isNewChatOpen ? 'translateX(0)' : 'translateX(100%)', zIndex:20 }}>
          <div style={{ background:'#202c33', padding:'72px 24px 20px', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <button className="icon-btn" style={{ color:'#aebac1' }} onClick={() => { setIsNewChatOpen(false); setContactSearch(''); }}>
                <Icon.Back />
              </button>
              <span style={{ color:'#e9edef', fontSize:19, fontWeight:500 }}>New chat</span>
            </div>
          </div>
          <div style={{ padding:'8px 12px', background:'#111b21', flexShrink:0 }}>
            <div style={{ background:'#202c33', borderRadius:8, display:'flex', alignItems:'center', padding:'8px 12px', gap:10 }}>
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT CHAT AREA */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>

        {!selectedChat ? (
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
            <div className="wa-bg" style={{ position:'absolute', inset:0 }} />

            {/* Chat Header */}
            <div style={{ height:60, background:'#202c33', display:'flex', alignItems:'center', padding:'0 16px', gap:12, zIndex:10, position:'relative', flexShrink:0 }}>
              <div style={{ cursor:'pointer' }}>
                <Avatar src={chatPic} name={chatName} size={40} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:'#e9edef', fontSize:16, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{chatName}</div>
                <div style={{ color:'#8696a0', fontSize:13 }}>click here for contact info</div>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                <button className="icon-btn" style={{ color:'#aebac1' }} title="Search">
                  <Icon.Search />
                </button>
                <button className="icon-btn" style={{ color:'#aebac1' }} title="Menu">
                  <Icon.DotsVertical />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'12px 6%', display:'flex', flexDirection:'column', gap:2, zIndex:10, position:'relative' }}>
              <div style={{ alignSelf:'center', background:'rgba(11,20,26,.6)', color:'#e9edef', fontSize:12.5, padding:'6px 14px', borderRadius:8, marginBottom:8, textAlign:'center', maxWidth:380, lineHeight:1.6, display:'flex', alignItems:'center', gap:6 }}>
                <Icon.Lock />
                <span>Messages and calls are end-to-end encrypted. No one outside of this chat can read them.</span>
              </div>

              {messages.length === 0 ? (
                <div style={{ alignSelf:'center', background:'rgba(11,20,26,.6)', color:'#e9edef', fontSize:13, padding:'6px 14px', borderRadius:8 }}>
                  No messages yet
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine  = msg.sender_id === currentUser.id;
                  const timeStr = formatMsgTime(msg.created_at);
                  const prevMsg = messages[idx - 1];
                  const showDate = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                  const dateLabel = new Date(msg.created_at).toLocaleDateString([], { weekday:'long', year:'numeric', month:'long', day:'numeric' });

                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div style={{ alignSelf:'center', background:'rgba(11,20,26,.6)', color:'#e9edef', fontSize:12.5, padding:'5px 12px', borderRadius:8, margin:'8px 0' }}>
                          {dateLabel}
                        </div>
                      )}
                      <div style={{ display:'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom:2 }}>
                        <div
                          className={isMine ? 'bubble-out' : 'bubble-in'}
                          style={{
                            position:'relative',
                            background: isMine ? '#005c4b' : '#202c33',
                            borderRadius: isMine ? '8px 0 8px 8px' : '0 8px 8px 8px',
                            padding:'6px 9px 22px',
                            maxWidth:'65%',
                            minWidth:80,
                            boxShadow:'0 1px 2px rgba(0,0,0,.3)',
                          }}
                        >
                          <span style={{ color:'#e9edef', fontSize:14.5, lineHeight:1.5, wordBreak:'break-word', display:'block' }}>
                            {msg.content}
                          </span>
                          <span style={{ position:'absolute', bottom:5, right:8, display:'flex', alignItems:'center', gap:3, color:'#8696a0', fontSize:11, whiteSpace:'nowrap' }}>
                            {timeStr}
                            {isMine && (
                              <span style={{ color:'#53bdeb', display:'flex' }}>
                                <Icon.CheckDouble />
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              style={{ background:'#202c33', display:'flex', alignItems:'center', padding:'8px 16px', gap:8, zIndex:10, position:'relative', flexShrink:0 }}
            >
              <button type="button" className="icon-btn" style={{ color:'#aebac1', flexShrink:0 }} title="Emoji">
                <Icon.Emoji />
              </button>
              <button type="button" className="icon-btn" style={{ color:'#aebac1', flexShrink:0 }} title="Attach">
                <Icon.Attach />
              </button>
              <div style={{ flex:1 }}>
                <input
                  type="text"
                  placeholder="Type a message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{
                    width:'100%', background:'#2a3942', border:'none', outline:'none',
                    borderRadius:8, padding:'10px 16px', color:'#e9edef', fontSize:15,
                    caretColor:'#00a884',
                  }}
                />
              </div>
              <button
                type={newMessage.trim() ? 'submit' : 'button'}
                className="icon-btn"
                style={{
                  color: newMessage.trim() ? '#fff' : '#aebac1',
                  flexShrink:0,
                  background: newMessage.trim() ? '#00a884' : 'none',
                  borderRadius:'50%', width:40, height:40,
                  transition:'background .2s',
                }}
                title={newMessage.trim() ? 'Send' : 'Voice message'}
              >
                {newMessage.trim() ? <Icon.Send /> : <Icon.Mic />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
'''

with open('/home/hardik/Technotery/FastApi/Project/WhatsApp/frontend/src/App.jsx', 'r') as f:
    lines = f.readlines()

kept = ''.join(lines[:299])

with open('/home/hardik/Technotery/FastApi/Project/WhatsApp/frontend/src/App.jsx', 'w') as f:
    f.write(kept + new_return)

print("Done — lines written:", len(kept.splitlines()) + len(new_return.splitlines()))
