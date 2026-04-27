'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import { useTranslations, useLocale } from 'next-intl';

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
}

export default function ProfilePage() {
  const t = useTranslations('Profile');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', avatar: '', currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setUser(data.user);
          setForm(prev => ({ ...prev, name: data.user.name || '', phone: data.user.phone || '', avatar: data.user.avatar || '' }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarChange = async (url: string) => {
    setForm(prev => ({ ...prev, avatar: url }));
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, phone: form.phone, avatar: url }),
    });
    if (res.ok) {
      setUser(u => u ? { ...u, avatar: url } : u);
      setMessage(t('avatarUpdated'));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone, avatar: form.avatar }),
      });

      if (res.ok) {
        setMessage(t('successUpdate'));
      } else {
        const data = await res.json();
        setMessage(data.error || t('errorUpdate'));
      }
    } catch {
      setMessage(commonT('errors.networkError'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMessage(t('passwordMismatch'));
      return;
    }
    if (form.newPassword.length < 6) {
      setMessage(t('passwordShort'));
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });

      if (res.ok) {
        setMessage(t('successPassword'));
        setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        const data = await res.json();
        setMessage(data.error || t('errorPassword'));
      }
    } catch {
      setMessage(commonT('errors.networkError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>;

  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 className="page-title" style={{ marginBottom: '24px', textAlign: isRtl ? 'right' : 'left' }}>{t('title')}</h2>

      {message && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '20px', 
          borderRadius: '4px', 
          background: (message.includes('success') || message.includes('successfully') || message.includes('تم')) ? '#d4edda' : '#f8d7da', 
          color: (message.includes('success') || message.includes('successfully') || message.includes('تم')) ? '#155724' : '#721c24', 
          border: `1px solid ${(message.includes('success') || message.includes('successfully') || message.includes('تم')) ? '#c3e6cb' : '#f5c6cb'}`,
          textAlign: isRtl ? 'right' : 'left'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', direction: isRtl ? 'rtl' : 'ltr' }}>
        <div className="card" style={{ padding: '24px', textAlign: isRtl ? 'right' : 'left' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: '#2a3142' }}>{t('info')}</h3>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <ImageUpload value={form.avatar} onChange={handleAvatarChange} folder="avatars" label={user?.name || t('title')} size={100} />
          </div>
          <form onSubmit={handleSaveProfile}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t('fullName')}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', textAlign: isRtl ? 'right' : 'left' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t('email')}</label>
              <input type="email" value={user?.email || ''} disabled style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #e0e0e0', background: '#f5f5f5', color: '#9ca8b3', textAlign: isRtl ? 'right' : 'left' }} />
              <p style={{ fontSize: '12px', color: '#9ca8b3', marginTop: '4px' }}>{t('emailHelp')}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t('phone')}</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', textAlign: isRtl ? 'right' : 'left' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t('role')}</label>
              <input type="text" value={user?.role || ''} disabled style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #e0e0e0', background: '#f5f5f5', color: '#9ca8b3', textAlign: isRtl ? 'right' : 'left' }} />
            </div>
            <button type="submit" disabled={saving} style={{ padding: '10px 24px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? t('saving') : t('saveChanges')}
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: '24px', textAlign: isRtl ? 'right' : 'left' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: '#2a3142' }}>{t('changePassword')}</h3>
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t('currentPassword')}</label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', textAlign: isRtl ? 'right' : 'left' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t('newPassword')}</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', textAlign: isRtl ? 'right' : 'left' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t('confirmPassword')}</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', textAlign: isRtl ? 'right' : 'left' }}
              />
            </div>
            <button type="submit" disabled={saving || !form.currentPassword || !form.newPassword} style={{ padding: '10px 24px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: (saving || !form.currentPassword || !form.newPassword) ? 'not-allowed' : 'pointer', opacity: (saving || !form.currentPassword || !form.newPassword) ? 0.6 : 1 }}>
              {saving ? t('changing') : t('changePasswordBtn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
