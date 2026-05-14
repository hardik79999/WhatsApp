import React from 'react';

function TypingIndicator({ username }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: 6
    }}>
      <div style={{
        background: '#202c33',
        borderRadius: '0 8px 8px 8px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 1px 2px rgba(0,0,0,.3)'
      }}>
        {username && (
          <span style={{ color: '#8696a0', fontSize: 13, marginRight: 4 }}>
            {username}
          </span>
        )}
        <div style={{ display: 'flex', gap: 3 }}>
          <div className="typing-dot" style={{ animationDelay: '0s' }} />
          <div className="typing-dot" style={{ animationDelay: '0.2s' }} />
          <div className="typing-dot" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>

      <style>{`
        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #8696a0;
          animation: typingBounce 1.4s infinite ease-in-out;
        }

        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}

export default TypingIndicator;
