import React, { useState, useRef } from 'react';
import { Icon } from './Icons';

function MediaUploadModal({ isOpen, onClose, onSend, onUpload, type = 'image' }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsDragActive(false);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleSend = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Support both `onSend` (internal) and `onUpload` (App.jsx legacy)
      const handler = onSend || onUpload;
      await handler(selectedFile, caption);
      handleClose();
    } catch (error) {
      alert('Failed to send media');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.9)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(32,44,51,0.95)'
      }}>
        <button
          onClick={handleClose}
          className="icon-btn"
          style={{ color: '#e9edef' }}
        >
          <Icon.Back />
        </button>
        <span style={{ color: '#e9edef', fontSize: 18, fontWeight: 500 }}>
          {type === 'image' ? 'Send Photo' : type === 'video' ? 'Send Video' : 'Send Document'}
        </span>
        <div style={{ width: 40 }} />
      </div>

      {/* Preview Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '80px 20px 120px',
          border: isDragActive ? '2px dashed #00a884' : '2px dashed transparent',
          transition: 'border-color .2s ease',
        }}
      >
        {!preview ? (
          <div style={{ textAlign: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept={
                type === 'image' ? 'image/*' :
                type === 'video' ? 'video/*' :
                '*/*'
              }
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '16px 32px',
                background: '#00a884',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <Icon.Camera />
              Select {type === 'image' ? 'Photo' : type === 'video' ? 'Video' : 'File'}
            </button>
          </div>
        ) : (
          <div style={{ maxWidth: '90%', maxHeight: '100%', position: 'relative' }}>
            {type === 'image' && (
              <img
                src={preview}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  borderRadius: 8,
                  objectFit: 'contain'
                }}
              />
            )}
            {type === 'video' && (
              <video
                src={preview}
                controls
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  borderRadius: 8
                }}
              />
            )}
            {type === 'document' && (
              <div style={{
                background: '#202c33',
                padding: '32px',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16
              }}>
                <Icon.Document />
                <div style={{ color: '#e9edef', fontSize: 16 }}>
                  {selectedFile?.name}
                </div>
                <div style={{ color: '#8696a0', fontSize: 14 }}>
                  {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Caption Input */}
      {preview && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(32,44,51,0.95)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <input
            type="text"
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{
              flex: 1,
              background: '#2a3942',
              border: 'none',
              borderRadius: 8,
              padding: '12px 16px',
              color: '#e9edef',
              fontSize: 15,
              outline: 'none'
            }}
          />
          <button
            onClick={handleSend}
            disabled={uploading}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#00a884',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1,
              color: '#fff'
            }}
          >
            {uploading ? '...' : <Icon.Send />}
          </button>
        </div>
      )}
    </div>
  );
}

export default MediaUploadModal;
