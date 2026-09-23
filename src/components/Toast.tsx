'use client';

import React, { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = 'success',
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const colors = {
    success: { bg: '#20c997', border: '#1bb88a', text: '#ffffff' },
    error: { bg: '#ec4561', border: '#e0324e', text: '#ffffff' },
    info: { bg: '#28aaa9', border: '#229594', text: '#ffffff' },
  };

  const current = colors[type] || colors.info;

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 10000,
        backgroundColor: current.bg,
        color: current.text,
        padding: '12px 20px',
        borderRadius: '6px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '400px',
        fontSize: '14px',
        fontWeight: 500,
        animation: 'slideIn 0.2s ease-out',
      }}
    >
      <div style={{ flex: 1 }}>{message}</div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          padding: '0 4px',
          fontSize: '16px',
          lineHeight: 1,
          opacity: 0.8,
        }}
        title="Close"
      >
        ✕
      </button>
    </div>
  );
}
