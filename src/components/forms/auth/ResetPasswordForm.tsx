'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token || !email) {
      setError('Invalid token or email');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }

      router.push('/auth/login?reset=success');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div
        style={{
          background: 'rgba(236, 69, 97, 0.1)',
          border: '1px solid #ec4561',
          borderRadius: '3px',
          padding: '12px',
          marginBottom: '20px',
        }}
      >
        <p style={{ color: '#ec4561', fontSize: '14px', margin: '0' }}>
          Invalid token or email. Please request a new password reset link.
        </p>
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
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
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
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
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
        {loading ? 'Resetting...' : 'Reset Password'}
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