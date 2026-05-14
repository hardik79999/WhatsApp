import React, { useState } from 'react';
import Avatar from './Avatar';
import { Icon } from './Icons';
import api from '../api';

function GroupInfoPanel({ chat, currentUser, isOpen, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(chat?.group_name || '');
  const [groupDescription, setGroupDescription] = useState(chat?.group_description || '');
  const [saving, setSaving] = useState(false);

  const isAdmin = chat?.participants?.find(p => p.user_id === currentUser?.id)?.role === 'admin';
  const isCreator = chat?.created_by === currentUser?.id;

  const handleSave = async () => {
    setSaving(true);
    try {
      // API call to update group (you'll need to implement this endpoint)
      await api.put(`/chats/${chat.id}`, {
        group_name: groupName.trim(),
        group_description: groupDescription.trim()
      });
      
      setIsEditing(false);
      onUpdate && onUpdate();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to update group');
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    
    try {
      await api.delete(`/chats/${chat.id}/leave`);
      onClose();
      onUpdate && onUpdate();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to leave group');
    }
  };

  const handleRemoveParticipant = async (userId) => {
    if (!confirm('Remove this participant from the group?')) return;
    
    try {
      await api.delete(`/chats/${chat.id}/participants/${userId}`);
      onUpdate && onUpdate();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to remove participant');
    }
  };

  if (!chat || !isOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: '#111b21',
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform .25s cubic-bezier(.4,0,.2,1)'
    }}>
      {/* Header */}
      <div style={{ background:'#202c33', padding:'60px 24px 20px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <button className="icon-btn" style={{ color:'#aebac1' }} onClick={onClose}>
            <Icon.Back />
          </button>
          <span style={{ color:'#e9edef', fontSize:19, fontWeight:500 }}>Group Info</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {/* Group Header */}
        <div style={{ background:'#202c33', padding:'24px', textAlign:'center', borderBottom:'8px solid #111b21' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
            <Avatar src={chat.group_picture} name={chat.group_name} size={120} isGroup={true} />
          </div>
          
          {isEditing ? (
            <>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={{
                  width:'100%',
                  background:'#2a3942',
                  border:'1px solid #2a3942',
                  borderRadius:8,
                  padding:'10px',
                  color:'#e9edef',
                  fontSize:20,
                  fontWeight:500,
                  textAlign:'center',
                  outline:'none',
                  marginBottom:12
                }}
              />
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Add group description"
                rows={3}
                style={{
                  width:'100%',
                  background:'#2a3942',
                  border:'1px solid #2a3942',
                  borderRadius:8,
                  padding:'10px',
                  color:'#e9edef',
                  fontSize:14,
                  textAlign:'center',
                  outline:'none',
                  resize:'none',
                  fontFamily:'inherit'
                }}
              />
              <div style={{ display:'flex', gap:8, marginTop:12, justifyContent:'center' }}>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setGroupName(chat.group_name);
                    setGroupDescription(chat.group_description || '');
                  }}
                  style={{
                    padding:'8px 16px',
                    background:'#2a3942',
                    color:'#e9edef',
                    border:'none',
                    borderRadius:6,
                    cursor:'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding:'8px 16px',
                    background:'#00a884',
                    color:'#fff',
                    border:'none',
                    borderRadius:6,
                    cursor:'pointer',
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ color:'#e9edef', fontSize:20, fontWeight:500, marginBottom:8 }}>
                {chat.group_name}
              </div>
              {chat.group_description && (
                <div style={{ color:'#8696a0', fontSize:14, lineHeight:1.5 }}>
                  {chat.group_description}
                </div>
              )}
              {isAdmin && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    marginTop:12,
                    padding:'8px 16px',
                    background:'#2a3942',
                    color:'#00a884',
                    border:'none',
                    borderRadius:6,
                    cursor:'pointer',
                    fontSize:14
                  }}
                >
                  <Icon.Edit /> Edit
                </button>
              )}
            </>
          )}
          
          <div style={{ color:'#8696a0', fontSize:14, marginTop:12 }}>
            Group · {chat.participants?.length || 0} participants
          </div>
        </div>

        {/* Participants */}
        <div style={{ background:'#202c33', marginTop:8 }}>
          <div style={{ padding:'16px', color:'#00a884', fontSize:14, fontWeight:500 }}>
            {chat.participants?.length || 0} Participants
          </div>
          
          {/* Add Participant (Admin only) */}
          {isAdmin && (
            <div
              style={{
                display:'flex',
                alignItems:'center',
                padding:'12px 16px',
                cursor:'pointer',
                borderBottom:'1px solid #2a3942'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2a3942'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width:49,
                height:49,
                borderRadius:'50%',
                background:'#00a884',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                color:'#fff'
              }}>
                <Icon.AddUser />
              </div>
              <div style={{ marginLeft:15, color:'#e9edef', fontSize:17 }}>
                Add participant
              </div>
            </div>
          )}

          {/* Participant List */}
          {chat.participants?.map((participant) => (
            <div
              key={participant.user_id}
              style={{
                display:'flex',
                alignItems:'center',
                padding:'12px 16px',
                borderBottom:'1px solid #2a3942'
              }}
            >
              <Avatar src={participant.profile_pic} name={participant.username} size={49} />
              <div style={{ flex:1, marginLeft:15 }}>
                <div style={{ color:'#e9edef', fontSize:17 }}>
                  {participant.username || participant.phone}
                  {participant.user_id === currentUser?.id && (
                    <span style={{ color:'#8696a0', fontSize:14 }}> (You)</span>
                  )}
                </div>
                <div style={{ color:'#8696a0', fontSize:13, marginTop:2 }}>
                  {participant.role === 'admin' ? 'Group Admin' : 'Member'}
                </div>
              </div>
              
              {/* Admin Actions */}
              {isAdmin && participant.user_id !== currentUser?.id && (
                <button
                  onClick={() => handleRemoveParticipant(participant.user_id)}
                  style={{
                    padding:'6px 12px',
                    background:'transparent',
                    color:'#f15c6d',
                    border:'1px solid #f15c6d',
                    borderRadius:6,
                    cursor:'pointer',
                    fontSize:13
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ background:'#202c33', marginTop:8 }}>
          <button
            onClick={handleLeaveGroup}
            style={{
              width:'100%',
              display:'flex',
              alignItems:'center',
              padding:'16px',
              background:'transparent',
              border:'none',
              color:'#f15c6d',
              fontSize:17,
              cursor:'pointer',
              gap:15
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2a3942'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Icon.Exit />
            Exit Group
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupInfoPanel;
