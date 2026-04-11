'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', avatar: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
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
        setMessage('Profile updated successfully!');
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to update profile');
      }
    } catch {
      setMessage('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
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
        setMessage('Password changed successfully!');
        setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to change password');
      }
    } catch {
      setMessage('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>;

  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 className="page-title" style={{ marginBottom: '24px' }}>My Profile</h2>

      {message && (
        <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '4px', background: message.includes('success') || message.includes('successfully') ? '#d4edda' : '#f8d7da', color: message.includes('success') || message.includes('successfully') ? '#155724' : '#721c24', border: `1px solid ${message.includes('success') || message.includes('successfully') ? '#c3e6cb' : '#f5c6cb'}` }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: '#2a3142' }}>Profile Information</h3>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              onClick={handleAvatarClick}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: '#28aaa9',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '36px',
                fontWeight: 600,
                cursor: 'pointer',
                overflow: 'hidden',
                marginBottom: '8px',
              }}
            >
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name?.charAt(0).toUpperCase() || '?'
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <p style={{ fontSize: '12px', color: '#9ca8b3', margin: 0 }}>Click to upload photo</p>
          </div>
          <form onSubmit={handleSaveProfile}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Email</label>
              <input type="email" value={user?.email || ''} disabled style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #e0e0e0', background: '#f5f5f5', color: '#9ca8b3' }} />
              <p style={{ fontSize: '12px', color: '#9ca8b3', marginTop: '4px' }}>Email cannot be changed</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Role</label>
              <input type="text" value={user?.role || ''} disabled style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #e0e0e0', background: '#f5f5f5', color: '#9ca8b3' }} />
            </div>
            <button type="submit" disabled={saving} style={{ padding: '10px 24px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: '#2a3142' }}>Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Current Password</label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>New Password</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Confirm New Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}
              />
            </div>
            <button type="submit" disabled={saving || !form.currentPassword || !form.newPassword} style={{ padding: '10px 24px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: (saving || !form.currentPassword || !form.newPassword) ? 'not-allowed' : 'pointer', opacity: (saving || !form.currentPassword || !form.newPassword) ? 0.6 : 1 }}>
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}