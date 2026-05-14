import { useRef, useEffect } from 'react';

function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);
  
  useEffect(() => {
    const handler = (e) => { 
      if (ref.current && !ref.current.contains(e.target)) onClose(); 
    };
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
            padding: '12px 20px', 
            color: item.danger ? '#f15c6d' : '#e9edef',
            fontSize: 14, 
            cursor: 'pointer', 
            transition: 'background .1s',
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

export default ContextMenu;
