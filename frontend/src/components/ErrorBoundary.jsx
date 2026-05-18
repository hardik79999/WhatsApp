// Created by: Master Fix Pass

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Render errors are intentionally hidden from users; the fallback keeps the app recoverable.
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        background: '#111b21',
        color: '#e9edef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        textAlign: 'center',
        padding: 24,
      }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>Something went wrong. Refresh the page.</div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            border: 'none',
            background: '#00a884',
            color: '#111b21',
            borderRadius: 8,
            padding: '10px 18px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
