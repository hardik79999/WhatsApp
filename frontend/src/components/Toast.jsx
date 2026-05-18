// Created by: Master Fix Pass

import { useEffect, useState } from 'react';

let toastId = 0;
let toasts = [];
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener([...toasts]));
}

export function showToast(message, type = 'info') {
  if (!message) return;
  const id = ++toastId;
  toasts = [...toasts, { id, message: String(message), type }];
  emit();
  window.setTimeout(() => {
    toasts = toasts.filter((toast) => toast.id !== id);
    emit();
  }, 3000);
}

export function useToast() {
  const [items, setItems] = useState([...toasts]);

  useEffect(() => {
    listeners.add(setItems);
    return () => listeners.delete(setItems);
  }, []);

  return { toasts: items, showToast };
}

const colors = {
  success: { border: '#1f9d55', background: '#0d2b1e', text: '#d8ffe8' },
  error: { border: '#d64545', background: '#2a1515', text: '#ffe4e4' },
  warning: { border: '#d89b19', background: '#30240c', text: '#fff3d6' },
  info: { border: '#2b8bd8', background: '#102536', text: '#dff1ff' },
};

export function ToastContainer() {
  const { toasts: items } = useToast();

  return (
    <div style={{
      position: 'fixed',
      right: 18,
      bottom: 18,
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      width: 'min(360px, calc(100vw - 36px))',
      pointerEvents: 'none',
    }}>
      {items.map((toast) => {
        const color = colors[toast.type] || colors.info;
        return (
          <div
            key={toast.id}
            role="status"
            style={{
              background: color.background,
              border: `1px solid ${color.border}`,
              color: color.text,
              borderRadius: 8,
              padding: '11px 14px',
              boxShadow: '0 10px 30px rgba(0,0,0,.35)',
              fontSize: 14,
              lineHeight: 1.4,
            }}
          >
            {toast.message}
          </div>
        );
      })}
    </div>
  );
}
