'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ROLE_OPTIONS } from '@/lib/rbac';
import { DocumentUpload } from '@/components/ImageUpload';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  isActive: boolean;
  passportNumber?: string;
  passportExpiryDate?: string;
  passportDocument?: string;
}

interface UserModalProps {
  user?: User | null;
  onClose: () => void;
  onSave: (generatedPassword?: string) => void;
}

export default function UserModal({ user, onClose, onSave }: UserModalProps) {
  const t = useTranslations('Users');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    roles: user?.roles && user.roles.length > 0 ? user.roles : (user?.role ? [user.role] : ['Sales Person']),
    passportNumber: user?.passportNumber || '',
    passportExpiryDate: user?.passportExpiryDate ? new Date(user.passportExpiryDate).toISOString().split('T')[0] : '',
    passportDocument: user?.passportDocument || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleRole = (role: string) => {
    setFormData(prev => {
      const next = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role];
      if (next.length === 0) return prev;
      return { ...prev, roles: next };
    });
  };

  const getRoleLabel = (role: string) => {
    const key = role.replace(/\s/g, '').charAt(0).toLowerCase() + role.replace(/\s/g, '').slice(1);
    return t(`roles.${key}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const url = user ? `/api/users/${user._id}` : '/api/users';
      const method = user ? 'PUT' : 'POST';
      
      const payload: Record<string, unknown> = { ...formData };
      if (!payload.password) delete payload.password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save user');
        return;
      }
      onSave(data.generatedPassword);
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    fontSize: '14px',
    borderRadius: '0',
    padding: '0 12px',
    border: '1px solid #ced4da',
    background: '#ffffff',
    textAlign: isRtl ? 'right' : 'left'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#2a3142',
    marginBottom: '4px',
    textAlign: isRtl ? 'right' : 'left'
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto', textAlign: isRtl ? 'right' : 'left' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{user ? t('editUser') : t('createUser')}</h3>
        
        {error && (
          <div style={{ background: 'rgba(236, 69, 97, 0.1)', border: '1px solid #ec4561', borderRadius: '3px', padding: '12px', marginBottom: '16px' }}>
            <p style={{ color: '#ec4561', fontSize: '14px', margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{t('name')} *</label>
            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{t('email')} *</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{t('password')} {user ? `(${isRtl ? 'اتركه فارغاً للحفاظ على الحالي' : 'leave blank to keep current'})` : (formData.password ? '' : t('pwAutoHint'))}</label>
            <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={user ? '••••••••' : t('pwAutoHint')} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>{commonT('passportNumber')}</label>
              <input value={formData.passportNumber} onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{commonT('passportExpiryDate')}</label>
              <input type="date" value={formData.passportExpiryDate} onChange={(e) => setFormData({ ...formData, passportExpiryDate: e.target.value })} style={inputStyle} />
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{commonT('passportDocument')}</label>
            <DocumentUpload value={formData.passportDocument} onChange={(url) => setFormData({ ...formData, passportDocument: url })} label={commonT('passportDocument')} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{t('selectRoles')} *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px', border: '1px solid #ced4da', background: '#f9f9f9' }}>
              {ROLE_OPTIONS.map((r) => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.roles.includes(r)} onChange={() => toggleRole(r)} />
                  {getRoleLabel(r)}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #ced4da', background: '#fff', cursor: 'pointer' }}>{commonT('cancel')}</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', border: 'none', background: '#28aaa9', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? commonT('loading') : (user ? commonT('save') : t('createBtn'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
