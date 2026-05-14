import { useState, useEffect } from 'react';
import Avatar from './Avatar';
import { Icon } from './Icons';
import api from '../api';

function CreateGroupPanel({ 
  isOpen, 
  contacts, 
  onClose, 
  onCreate,
  onCreateGroup,
  onLoadContacts,
}) {
  const [step, setStep] = useState(1); // 1: Select participants, 2: Group details
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarUploadId, setAvatarUploadId] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Load contacts when panel opens
  useEffect(() => {
    if (isOpen && onLoadContacts && contacts.length === 0) {
      onLoadContacts();
    }
  }, [isOpen, onLoadContacts, contacts.length]);

  const filteredContacts = contacts.filter((c) =>
    !searchQuery.trim() || c.saved_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleContact = (contactId) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleNext = () => {
    if (selectedContacts.length === 0) {
      setError('Please select at least one contact');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const handleAvatarSelect = (file) => {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploadId(null);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return null;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', avatarFile);
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatarUploadId(res.data.id);
      return res.data.id;
    } catch (err) {
      console.error('Avatar upload failed', err);
      throw err;
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const picId = avatarUploadId || (avatarFile ? await uploadAvatar() : null);
      // Support both prop names: onCreate (App.jsx) and onCreateGroup (legacy)
      const handler = onCreate || onCreateGroup;
      await handler({
        group_name: groupName.trim(),
        group_description: groupDescription.trim() || null,
        group_pic_id: picId,
        participant_ids: selectedContacts
      });
      
      // Reset form
      setStep(1);
      setSelectedContacts([]);
      setGroupName('');
      setGroupDescription('');
      setAvatarFile(null);
      setAvatarPreview('');
      setAvatarUploadId(null);
      setSearchQuery('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedContacts([]);
    setGroupName('');
    setGroupDescription('');
    setSearchQuery('');
    setError('');
    onClose();
  };

  return (
    <div style={{ 
      position:'absolute', 
      inset:0, 
      display:'flex', 
      flexDirection:'column', 
      background:'#111b21', 
      transition:'transform .25s cubic-bezier(.4,0,.2,1)', 
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)', 
      zIndex:30 
    }}>
      {/* Header */}
      <div style={{ background:'#202c33', padding:'72px 24px 20px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <button 
            className="icon-btn" 
            style={{ color:'#aebac1' }} 
            onClick={step === 1 ? handleClose : handleBack}
          >
            <Icon.Back />
          </button>
          <div>
            <div style={{ color:'#e9edef', fontSize:19, fontWeight:500 }}>
              {step === 1 ? 'Add group participants' : 'New group'}
            </div>
            {step === 1 && selectedContacts.length > 0 && (
              <div style={{ color:'#8696a0', fontSize:14, marginTop:4 }}>
                {selectedContacts.length} selected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 1: Select Participants */}
      {step === 1 && (
        <>
          {/* Search */}
          <div style={{ padding:'8px 12px', background:'#111b21', flexShrink:0 }}>
            <div style={{ background:'#202c33', borderRadius:8, display:'flex', alignItems:'center', padding:'7px 12px', gap:10 }}>
              <span style={{ color:'#8696a0', display:'flex' }}><Icon.Search /></span>
              <input
                type="text"
                placeholder="Search contacts"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{ flex:1, background:'none', border:'none', outline:'none', color:'#e9edef', fontSize:15, caretColor:'#00a884' }}
              />
            </div>
          </div>

          {/* Selected Contacts Preview */}
          {selectedContacts.length > 0 && (
            <div style={{ padding:'12px 16px', background:'#202c33', borderBottom:'1px solid #2a3942', overflowX:'auto', display:'flex', gap:12 }}>
              {selectedContacts.map(contactId => {
                const contact = contacts.find(c => c.contact_id === contactId);
                return (
                  <div key={contactId} style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:60 }}>
                    <div style={{ position:'relative' }}>
                      <Avatar src={contact?.profile_pic} name={contact?.saved_name} size={50} />
                      <button
                        onClick={() => toggleContact(contactId)}
                        style={{
                          position:'absolute',
                          top:-5,
                          right:-5,
                          width:20,
                          height:20,
                          borderRadius:'50%',
                          background:'#8696a0',
                          border:'2px solid #111b21',
                          display:'flex',
                          alignItems:'center',
                          justifyContent:'center',
                          cursor:'pointer',
                          color:'#fff',
                          fontSize:12
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <span style={{ color:'#e9edef', fontSize:12, marginTop:4, textAlign:'center', maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {contact?.saved_name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Contact List */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {filteredContacts.length === 0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#8696a0', fontSize:14, gap:12, padding:24 }}>
                <span>No contacts found</span>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContacts.includes(contact.contact_id);
                return (
                  <div
                    key={contact.id}
                    onClick={() => toggleContact(contact.contact_id)}
                    style={{ 
                      display:'flex', 
                      alignItems:'center', 
                      padding:'10px 16px', 
                      cursor:'pointer', 
                      borderBottom:'1px solid #2a3942',
                      background: isSelected ? '#2a3942' : 'transparent'
                    }}
                    onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = '#202c33')}
                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
                  >
                    <Avatar src={contact.profile_pic} name={contact.saved_name} size={49} />
                    <div style={{ flex:1, marginLeft:15 }}>
                      <div style={{ color:'#e9edef', fontSize:17 }}>{contact.saved_name}</div>
                      <div style={{ color:'#8696a0', fontSize:13, marginTop:2 }}>
                        {contact.bio || 'Hey there! I am using WhatsApp.'}
                      </div>
                    </div>
                    <div style={{
                      width:20,
                      height:20,
                      borderRadius:'50%',
                      border: isSelected ? 'none' : '2px solid #8696a0',
                      background: isSelected ? '#00a884' : 'transparent',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      color:'#fff',
                      fontSize:12
                    }}>
                      {isSelected && '✓'}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Next Button */}
          <div style={{ padding:'12px 16px', background:'#202c33', borderTop:'1px solid #2a3942' }}>
            {error && (
              <div style={{ color:'#f15c6d', fontSize:13, marginBottom:8 }}>{error}</div>
            )}
            <button
              onClick={handleNext}
              disabled={selectedContacts.length === 0}
              style={{
                width:'100%',
                background: selectedContacts.length > 0 ? '#00a884' : '#2a3942',
                color: selectedContacts.length > 0 ? '#fff' : '#8696a0',
                border:'none',
                borderRadius:8,
                padding:'12px',
                fontSize:15,
                fontWeight:500,
                cursor: selectedContacts.length > 0 ? 'pointer' : 'not-allowed',
                transition:'background .2s'
              }}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Step 2: Group Details */}
      {step === 2 && (
        <>
          <div style={{ flex:1, overflowY:'auto', padding:'24px 16px' }}>
            {/* Group Icon Placeholder */}
            <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
              <div style={{ position:'relative' }}>
                <div style={{
                  width:120,
                  height:120,
                  borderRadius:'50%',
                  background:'#2a3942',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  cursor:'pointer',
                  overflow:'hidden'
                }} onClick={() => document.getElementById('group-avatar-input')?.click()}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Group avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  ) : (
                    <Icon.Plus />
                  )}
                </div>
                <input
                  id="group-avatar-input"
                  type="file"
                  accept="image/*"
                  style={{ display:'none' }}
                  onChange={(e) => e.target.files?.[0] && handleAvatarSelect(e.target.files[0])}
                />
                <div style={{ position:'absolute', bottom:-6, right:-6, background:'#00a884', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', border:'3px solid #111b21', color:'#fff' }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
              </div>
            </div>
            {avatarPreview && (
              <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
                <span style={{ color:'#8696a0', fontSize:13 }}>
                  Selected avatar preview. Click the circle to replace.
                </span>
              </div>
            )}

            {/* Group Name */}
            <div style={{ marginBottom:20 }}>
              <label style={{ color:'#8696a0', fontSize:13, marginBottom:8, display:'block' }}>
                Group Name *
              </label>
              <input
                type="text"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={50}
                style={{
                  width:'100%',
                  background:'#2a3942',
                  border:'1px solid #2a3942',
                  borderRadius:8,
                  padding:'12px',
                  color:'#e9edef',
                  fontSize:15,
                  outline:'none',
                  caretColor:'#00a884'
                }}
              />
              <div style={{ color:'#8696a0', fontSize:12, marginTop:4, textAlign:'right' }}>
                {groupName.length}/50
              </div>
            </div>

            {/* Group Description */}
            <div style={{ marginBottom:20 }}>
              <label style={{ color:'#8696a0', fontSize:13, marginBottom:8, display:'block' }}>
                Description (Optional)
              </label>
              <textarea
                placeholder="Add group description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                maxLength={200}
                rows={3}
                style={{
                  width:'100%',
                  background:'#2a3942',
                  border:'1px solid #2a3942',
                  borderRadius:8,
                  padding:'12px',
                  color:'#e9edef',
                  fontSize:15,
                  outline:'none',
                  caretColor:'#00a884',
                  resize:'none',
                  fontFamily:'inherit'
                }}
              />
              <div style={{ color:'#8696a0', fontSize:12, marginTop:4, textAlign:'right' }}>
                {groupDescription.length}/200
              </div>
            </div>

            {/* Participants Preview */}
            <div style={{ marginTop:24 }}>
              <div style={{ color:'#8696a0', fontSize:13, marginBottom:12 }}>
                Participants: {selectedContacts.length + 1}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {selectedContacts.map(contactId => {
                  const contact = contacts.find(c => c.contact_id === contactId);
                  return (
                    <div key={contactId} style={{
                      background:'#2a3942',
                      borderRadius:16,
                      padding:'6px 12px',
                      display:'flex',
                      alignItems:'center',
                      gap:8,
                      fontSize:14,
                      color:'#e9edef'
                    }}>
                      <Avatar src={contact?.profile_pic} name={contact?.saved_name} size={24} />
                      {contact?.saved_name}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Create Button */}
          <div style={{ padding:'12px 16px', background:'#202c33', borderTop:'1px solid #2a3942' }}>
            {error && (
              <div style={{ color:'#f15c6d', fontSize:13, marginBottom:8 }}>{error}</div>
            )}
            <button
              onClick={handleCreate}
              disabled={creating || avatarUploading || !groupName.trim()}
              style={{
                width:'100%',
                background: groupName.trim() ? '#00a884' : '#2a3942',
                color: groupName.trim() ? '#fff' : '#8696a0',
                border:'none',
                borderRadius:8,
                padding:'12px',
                fontSize:15,
                fontWeight:500,
                cursor: groupName.trim() ? 'pointer' : 'not-allowed',
                opacity: creating || avatarUploading ? 0.6 : 1,
                transition:'background .2s'
              }}
            >
              {avatarUploading ? 'Uploading avatar...' : creating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CreateGroupPanel;
