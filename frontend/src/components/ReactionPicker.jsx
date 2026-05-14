import React from 'react';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥'];

function ReactionPicker({ isOpen, position, onSelect, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998
        }}
      />
      
      {/* Picker */}
      <div
        style={{
          position: 'fixed',
          top: position.y - 60,
          left: position.x - 150,
          background: '#233138',
          borderRadius: 24,
          padding: '8px 12px',
          display: 'flex',
          gap: 4,
          boxShadow: '0 4px 24px rgba(0,0,0,.5)',
          zIndex: 9999,
          animation: 'scaleIn .15s ease'
        }}
      >
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              fontSize: 24,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform .1s, background .1s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2a3942';
              e.currentTarget.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}

export default ReactionPicker;
