'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ROLE_OPTIONS } from '@/lib/rbac';
import { useTranslations, useLocale } from 'next-intl';
import { DocumentUpload } from '@/components/ImageUpload';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  phone?: string;
  avatar?: string;
  passportNumber?: string;
  passportDocument?: string;
  passportExpiryDate?: string;
  isActive: boolean;
  createdAt: string;
}

export default function UserDetailPage() {
  const t = useTranslations('Users');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resetting, setResetting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: '', 
    roles: [] as string[],
    passportNumber: '',
    passportDocument: '',
    passportExpiryDate: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    fetch(`/api/users/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('User not found');
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        const userRoles = data.user.roles && data.user.roles.length > 0 ? data.user.roles : [data.user.role];
        setEditForm({ 
          name: data.user.name, 
          roles: userRoles,
          passportNumber: data.user.passportNumber || '',
          passportDocument: data.user.passportDocument || '',
          passportExpiryDate: data.user.passportExpiryDate ? new Date(data.user.passportExpiryDate).toISOString().split('T')[0] : ''
        });
      })
      .catch((err) => {
        setError(err.message || 'Failed to load user');
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  const toggleRole = (role: string) => {
    setEditForm(prev => {
      const next = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role];
      if (next.length === 0) return prev;
      return { ...prev, roles: next };
    });
  };

  const handleResetPassword = async () => {
    if (!confirm('Reset this user\'s password? A new password will be generated and sent via email.')) return;

    setResetting(true);
    try {
      const res = await fetch(`/api/users/${user?._id}?action=reset-password`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to reset password');
        return;
      }
      alert('Password reset successfully. New credentials have been sent to the user\'s email.');
    } catch (err) {
      console.error(err);
      alert('Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Deactivate this user? They will no longer be able to log in.')) return;

    setDeactivating(true);
    try {
      const res = await fetch(`/api/users/${user?._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to deactivate');
        return;
      }
      setUser({ ...user!, isActive: false });
      alert('User deactivated successfully.');
    } catch (err) {
      console.error(err);
    } finally {
      setDeactivating(false);
    }
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      alert('Name is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user?._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update');
        return;
      }
      setUser({ 
        ...user!, 
        name: editForm.name, 
        roles: editForm.roles, 
        role: editForm.roles[0],
        passportNumber: editForm.passportNumber,
        passportDocument: editForm.passportDocument,
        passportExpiryDate: editForm.passportExpiryDate
      });
      setEditMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return { background: '#dc2626', color: '#fff' };
      case 'Car Manager': return { background: '#2563eb', color: '#fff' };
      case 'Finance Manager': return { background: '#7c3aed', color: '#fff' };
      case 'Accountant': return { background: '#f59e0b', color: '#fff' };
      case 'Sales Person': return { background: '#16a34a', color: '#fff' };
      default: return { background: '#6b7280', color: '#fff' };
    }
  };

  const getRoleLabel = (role: string) => {
    const key = role.replace(/\s/g, '').charAt(0).toLowerCase() + role.replace(/\s/g, '').slice(1);
    return t(`roles.${key}`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9ca8b3' }}>
        Loading user details...
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#ec4561' }}>
        {error || 'User not found'}
        <div style={{ marginTop: '16px' }}>
          <Link href="/dashboard/users" className="btn" style={{ display: 'inline-block', padding: '10px 20px', background: '#28aaa9', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/dashboard/users" style={{ color: '#9ca8b3', textDecoration: 'none', fontSize: '14px' }}>
          {t('title')}
        </Link>
        <span style={{ color: '#9ca8b3' }}>/</span>
        <span style={{ color: '#2a3142', fontSize: '14px' }}>{user.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#2a3142', margin: 0 }}>{t('createUser').replace('Create New', 'User')}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'flex-end' }}>
              {(user.roles && user.roles.length > 0 ? user.roles : [user.role]).map(r => (
                <span key={r} style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  ...roleBadgeColor(r),
                }}>
                  {getRoleLabel(r)}
                </span>
              ))}
            </div>
          </div>

          {!editMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#9ca8b3', margin: '0 0 4px' }}>{t('name')}</p>
                <p style={{ fontSize: '16px', color: '#2a3142', margin: 0, fontWeight: 500 }}>{user.name}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#9ca8b3', margin: '0 0 4px' }}>{t('email')}</p>
                <p style={{ fontSize: '16px', color: '#28aaa9', margin: 0 }}>{user.email}</p>
              </div>
              {user.phone && (
                <div>
                  <p style={{ fontSize: '12px', color: '#9ca8b3', margin: '0 0 4px' }}>Phone</p>
                  <p style={{ fontSize: '16px', color: '#2a3142', margin: 0 }}>{user.phone}</p>
                </div>
              )}
              {user.passportNumber && (
                <div>
                  <p style={{ fontSize: '12px', color: '#9ca8b3', margin: '0 0 4px' }}>{commonT('passportNumber')}</p>
                  <p style={{ fontSize: '16px', color: '#2a3142', margin: 0 }}>{user.passportNumber}</p>
                </div>
              )}
              {user.passportExpiryDate && (
                <div>
                  <p style={{ fontSize: '12px', color: '#9ca8b3', margin: '0 0 4px' }}>{commonT('passportExpiryDate')}</p>
                  <p style={{ fontSize: '16px', color: '#2a3142', margin: 0 }}>
                    {new Date(user.passportExpiryDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              )}
              <div>
                <p style={{ fontSize: '12px', color: '#9ca8b3', margin: '0 0 4px' }}>{t('status')}</p>
                <p style={{ fontSize: '16px', margin: 0, color: user.isActive ? '#16a34a' : '#ec4561', fontWeight: 600 }}>
                  {user.isActive ? t('active') : t('inactive')}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#9ca8b3', margin: '0 0 4px' }}>{t('created')}</p>
                <p style={{ fontSize: '14px', color: '#2a3142', margin: 0 }}>
                  {new Date(user.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#9ca8b3', display: 'block', marginBottom: '4px' }}>{t('name')}</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#9ca8b3', display: 'block', marginBottom: '4px' }}>{commonT('passportNumber')}</label>
                  <input
                    type="text"
                    value={editForm.passportNumber}
                    onChange={(e) => setEditForm({ ...editForm, passportNumber: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#9ca8b3', display: 'block', marginBottom: '4px' }}>{commonT('passportExpiryDate')}</label>
                  <input
                    type="date"
                    value={editForm.passportExpiryDate}
                    onChange={(e) => setEditForm({ ...editForm, passportExpiryDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#9ca8b3', display: 'block', marginBottom: '4px' }}>{commonT('passportDocument')}</label>
                <DocumentUpload 
                  value={editForm.passportDocument} 
                  onChange={(url) => setEditForm({ ...editForm, passportDocument: url })}
                  label={commonT('passportDocument')}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#9ca8b3', display: 'block', marginBottom: '4px' }}>{t('selectRoles')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', padding: '12px', border: '1px solid #e5e5e5', background: '#f9f9f9', borderRadius: '4px' }}>
                  {ROLE_OPTIONS.map((roleOption) => (
                    <label key={roleOption} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={editForm.roles.includes(roleOption)} 
                        onChange={() => toggleRole(roleOption)}
                      />
                      {getRoleLabel(roleOption)}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', background: '#28aaa9', color: '#fff', border: 'none', borderRadius: '4px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? commonT('saving') : commonT('save')}
                </button>
                <button onClick={() => { 
                  setEditMode(false); 
                  setEditForm({ 
                    name: user.name, 
                    roles: user.roles || [user.role],
                    passportNumber: user.passportNumber || '',
                    passportDocument: user.passportDocument || '',
                    passportExpiryDate: user.passportExpiryDate ? new Date(user.passportExpiryDate).toISOString().split('T')[0] : ''
                  }); 
                }} style={{ padding: '10px 20px', background: '#fff', color: '#6b7280', border: '1px solid #e5e5e5', borderRadius: '4px', cursor: 'pointer' }}>
                  {commonT('cancel')}
                </button>
              </div>
            </div>
          )}

          {!editMode && (
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => setEditMode(true)} style={{ padding: '10px 20px', background: '#fff', color: '#28aaa9', border: '1px solid #28aaa9', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                {commonT('edit')}
              </button>
              <button onClick={handleResetPassword} disabled={resetting} style={{ padding: '10px 20px', background: '#fff', color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '4px', cursor: resetting ? 'not-allowed' : 'pointer', opacity: resetting ? 0.6 : 1, fontSize: '14px' }}>
                {resetting ? 'Resetting...' : 'Reset Password'}
              </button>
              {user.isActive && (
                <button onClick={handleDeactivate} disabled={deactivating} style={{ padding: '10px 20px', background: '#fff', color: '#ec4561', border: '1px solid #ec4561', borderRadius: '4px', cursor: deactivating ? 'not-allowed' : 'pointer', opacity: deactivating ? 0.6 : 1, fontSize: '14px' }}>
                  {deactivating ? 'Deactivating...' : t('deactivate')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
