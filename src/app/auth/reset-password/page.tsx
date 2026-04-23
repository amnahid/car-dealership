'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
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
    boxSizing: 'border-box',
  };

  const containerStyle: React.CSSProperties = {
    background: '#ffffff',
    boxShadow: '2px 3.464px 14.72px 1.28px rgba(16, 16, 16, 0.15)',
    padding: '60px 40px',
    width: '420px',
    maxWidth: '100%',
    position: 'relative',
    zIndex: 1,
    borderRadius: '8px',
  };

  const lockIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );

  if (!token) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontFamily: '"Sarabun", sans-serif', fontSize: '20px', fontWeight: 600, color: '#2b2d5d', marginBottom: '12px' }}>
            Invalid Reset Link
          </h2>
          <p style={{ color: '#555555', fontSize: '14px', marginBottom: '24px' }}>
            This reset link is missing or invalid. Please request a new one.
          </p>
          <Link href="/auth/forgot-password" style={{ color: '#28aaa9', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ fontFamily: '"Sarabun", sans-serif', fontSize: '20px', fontWeight: 600, color: '#2b2d5d', marginBottom: '12px' }}>
            Password Reset!
          </h2>
          <p style={{ color: '#555555', fontSize: '14px', marginBottom: '24px' }}>
            Your password has been updated. Redirecting to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontFamily: '"Sarabun", sans-serif', fontSize: '28px', fontWeight: 700, color: '#28aaa9', margin: 0 }}>
          AMYAL CAR
        </h1>
        <p style={{ fontFamily: '"Sarabun", sans-serif', fontSize: '14px', color: '#9ca8b3', marginTop: '8px' }}>
          Car Dealership & Rental Management
        </p>
      </div>

      <h2 style={{ fontFamily: '"Sarabun", sans-serif', fontSize: '20px', fontWeight: 600, color: '#2b2d5d', marginBottom: '8px' }}>
        Set a new password
      </h2>
      <p style={{ color: '#9ca8b3', fontSize: '14px', marginBottom: '24px' }}>
        Enter a new password for your account.
      </p>

      {error && (
        <div style={{ background: 'rgba(236, 69, 97, 0.1)', border: '1px solid #ec4561', borderRadius: '3px', padding: '12px', marginBottom: '20px' }}>
          <p style={{ color: '#ec4561', fontSize: '14px', margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#9ca8b3', zIndex: 1 }}>
            {lockIcon}
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '24px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#9ca8b3', zIndex: 1 }}>
            {lockIcon}
          </div>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            style={inputStyle}
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
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link href="/auth/login" style={{ color: '#28aaa9', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>
          ← Back to Sign In
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
  };

  return (
    <div style={pageStyle}>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
