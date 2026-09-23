'use client';

import React from 'react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'success';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantColors = {
    primary: { bg: '#28aaa9', border: '#28aaa9', text: '#ffffff' },
    danger: { bg: '#ec4561', border: '#ec4561', text: '#ffffff' },
    warning: { bg: '#f8b425', border: '#f8b425', text: '#ffffff' },
    success: { bg: '#20c997', border: '#20c997', text: '#ffffff' },
  };

  const btnStyle = variantColors[variant] || variantColors.primary;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          maxWidth: '440px',
          width: '100%',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        <div style={{ padding: '24px' }}>
          {title && (
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '18px',
                fontWeight: 600,
                color: '#2a3142',
              }}
            >
              {title}
            </h3>
          )}
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: '#525f80',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {message}
          </p>
        </div>

        <div
          style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #edf2f7',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '8px 18px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#64748b',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 18px',
              fontSize: '14px',
              fontWeight: 500,
              color: btnStyle.text,
              background: btnStyle.bg,
              border: `1px solid ${btnStyle.border}`,
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
