'use client';

import ForgotPasswordForm from '@/components/forms/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '40px 30px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1
            style={{
              color: '#333333',
              fontSize: '24px',
              fontWeight: '600',
              margin: '0 0 10px 0',
            }}
          >
            Forgot Password
          </h1>
          <p
            style={{
              color: '#555555',
              fontSize: '14px',
              margin: '0',
            }}
          >
            Enter your email to receive a password reset link.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}