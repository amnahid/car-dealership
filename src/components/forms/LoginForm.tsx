'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      router.push('/dashboard');
      router.refresh();
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
  };

  const inputFocusStyle: React.CSSProperties = {
    ...inputStyle,
    borderColor: '#28aaa9',
    boxShadow: '0 0 0 2px rgba(40, 170, 170, 0.1)',
  };

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
          <p style={{ color: '#ec4561', fontSize: '14px', margin: 0 }}>{error}</p>
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
          style={inputStyle}
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
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
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
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}