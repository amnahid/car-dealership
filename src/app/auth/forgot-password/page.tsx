'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function ForgotPasswordPage() {
  const t = useTranslations('Auth.forgotPassword');
  const loginT = useTranslations('Auth.login');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

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

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t('errors.somethingWentWrong'));
        return;
      }

      setSubmitted(true);
    } catch {
      setError(t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
    position: 'relative',
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '50px',
    fontSize: '14px',
    background: '#f5f5f5',
    border: '1px solid #efefef',
    borderRadius: '0',
    padding: isRtl ? '0 50px 0 15px' : '0 15px 0 50px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  };

  if (submitted) {
    return (
      <div style={pageStyle}>
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
          <LanguageSwitcher />
        </div>
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#28aaa9', margin: 0 }}>
              {commonT('appName')}
            </h1>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2b2d5d', marginBottom: '12px' }}>
              {t('success.title')}
            </h2>
            <p style={{ color: '#555555', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              {t('success.description', { email })}
            </p>
            <Link href="/auth/login" style={{ color: '#28aaa9', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>
              {isRtl ? '←' : '←'} {t('backToSignIn')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
        <LanguageSwitcher />
      </div>
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#28aaa9', margin: 0 }}>
            {commonT('appName')}
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca8b3', marginTop: '8px' }}>
            {loginT('subtitle')}
          </p>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2b2d5d', marginBottom: '8px' }}>
          {t('title')}
        </h2>
        <p style={{ color: '#9ca8b3', fontSize: '14px', marginBottom: '24px' }}>
          {t('description')}
        </p>

        {error && (
          <div style={{ background: 'rgba(236, 69, 97, 0.1)', border: '1px solid #ec4561', borderRadius: '3px', padding: '12px', marginBottom: '20px' }}>
            <p style={{ color: '#ec4561', fontSize: '14px', margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <div style={{ 
              position: 'absolute', 
              left: isRtl ? 'auto' : '15px', 
              right: isRtl ? '15px' : 'auto',
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#9ca8b3', 
              zIndex: 1 
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={loginT('email')}
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
            {loading ? t('sending') : t('sendLink')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link href="/auth/login" style={{ color: '#28aaa9', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>
            {isRtl ? '←' : '←'} {t('backToSignIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
