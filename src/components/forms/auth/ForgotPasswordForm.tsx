'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send reset email');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #22c55e',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#166534', fontSize: '16px', fontWeight: '600', margin: '0 0 10px 0' }}>
            Check your email
          </p>
          <p style={{ color: '#555555', fontSize: '14px', margin: '0' }}>
            If an account exists, a password reset email has been sent to your email address.
          </p>
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link
            href="/auth/login"
            style={{ color: '#28aaa9', fontSize: '14px', textDecoration: 'none' }}
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      {error && (
        <div
          style={{
            background: 'rgba(236, 69, 97, 0.1)',
            border: '1px solid #ec4561',
            borderRadius: '3px',
            padding: '12px',
            marginBottom: '20px',
          }}
        >
          <p style={{ color: '#ec4561', fontSize: '14px', margin: '0' }}>{error}</p>
        </div>
      )}

      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '18px',
            color: '#9ca8b3',
            zIndex: 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          style={{
            width: '100%',
            height: '50px',
            fontFamily: '"Karla", sans-serif',
            fontSize: '14px',
            background: '#f5f5f5',
            border: '1px solid #efefef',
            borderRadius: '0',
            padding: '0 15px 0 50px',
            outline: 'none',
            transition: 'all 0.3s ease',
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          height: '50px',
          background: '#28aaa9',
          color: '#ffffff',
          border: 'none',
          borderRadius: '0',
          fontSize: '16px',
          fontWeight: 600,
          textTransform: 'uppercase',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          transition: 'all 0.3s ease',
        }}
      >
        {loading ? 'Sending...' : 'Send Reset Email'}
      </button>

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link
          href="/auth/login"
          style={{ color: '#28aaa9', fontSize: '14px', textDecoration: 'none' }}
        >
          Back to login
        </Link>
      </p>
    </form>
  );
}