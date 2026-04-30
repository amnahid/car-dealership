'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import DataTransferButtons from '@/components/DataTransferButtons';
import { ROLE_OPTIONS } from '@/lib/rbac';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
}

interface CreateResponse {
  message?: string;
  generatedPassword?: string;
  emailSent?: boolean;
  error?: string;
  user: User;
}

export default function UsersPage() {
  const t = useTranslations('Users');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedPw, setGeneratedPw] = useState('');
  const [formData, setFormData] = useState<UserFormData>({ name: '', email: '', password: '', role: 'Sales Person' });
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u._id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkAction = async (action: 'delete' | 'update-status', isActive?: boolean) => {
    if (action === 'delete' && !confirm(commonT('deleteConfirm'))) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: Array.from(selectedIds), isActive }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Bulk action failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGeneratedPw('');
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...formData };
      if (!payload.password) delete payload.password;
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data: CreateResponse = await res.json();
      if (!res.ok) {
        setError(data.error || t('errors.failedToCreate'));
        return;
      }
      if (data.generatedPassword) {
        setGeneratedPw(data.generatedPassword);
        setSuccess(t('successCreatedWithPw'));
      } else {
        setSuccess(t('successCreated'));
      }
      setShowForm(false);
      setFormData({ name: '', email: '', password: '', role: 'Sales Person' });
      fetchUsers();
    } catch {
      setError(t('errors.networkError'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch {
      alert('Network error');
    }
  };

  const getRoleLabel = (role: string) => {
    const key = role.replace(' ', '').charAt(0).toLowerCase() + role.replace(' ', '').slice(1);
    return t(`roles.${key}`);
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
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexDirection: isRtl ? 'row-reverse' : 'row'
        }}
      >
        <h2 className="page-title">{t('title')}</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <DataTransferButtons entityType="users" showImport={false} />
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: '#28aaa9',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 500,
              padding: '10px 16px',
              borderRadius: '3px',
              border: '1px solid #28aaa9',
              cursor: 'pointer',
            }}
          >
            + {t('addNew')}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '24px', maxWidth: '500px', marginLeft: isRtl ? 'auto' : '0', marginRight: isRtl ? '0' : 'auto' }}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#2a3142',
              marginBottom: '16px',
              textAlign: isRtl ? 'right' : 'left'
            }}
          >
            {t('createUser')}
          </h3>
          {error && (
            <div
              style={{
                background: 'rgba(236, 69, 97, 0.1)',
                border: '1px solid #ec4561',
                borderRadius: '3px',
                padding: '12px',
                marginBottom: '16px',
                textAlign: isRtl ? 'right' : 'left'
              }}
            >
              <p style={{ color: '#ec4561', fontSize: '14px', margin: 0 }}>{error}</p>
            </div>
          )}
          {success && (
            <div
              style={{
                background: 'rgba(40, 170, 169, 0.1)',
                border: '1px solid #28aaa9',
                borderRadius: '3px',
                padding: '12px',
                marginBottom: '16px',
                textAlign: isRtl ? 'right' : 'left'
              }}
            >
              <p style={{ color: '#28aaa9', fontSize: '14px', margin: 0 }}>{success}</p>
              {generatedPw && (
                <div style={{ marginTop: '8px', padding: '8px', background: '#fff', borderRadius: '4px' }}>
                  <p style={{ fontSize: '12px', color: '#9ca8b3', margin: '0 0 4px' }}>{t('generatedPw')}</p>
                  <code style={{ fontSize: '14px', color: '#2a3142', fontWeight: 600 }}>{generatedPw}</code>
                </div>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{t('name')} *</label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{t('email')} *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{t('password')} {formData.password ? '' : t('pwAutoHint')}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                placeholder={t('pwAutoHint')}
                style={inputStyle}
              />
              <p style={{ fontSize: '12px', color: '#9ca8b3', margin: '4px 0 0', textAlign: isRtl ? 'right' : 'left' }}>
                {t('pwHelp')}
              </p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{t('role')} *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                style={inputStyle}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {getRoleLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#2a3142',
                  background: '#ffffff',
                  border: '1px solid #ced4da',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                {commonT('cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#ffffff',
                  background: '#28aaa9',
                  border: '1px solid #28aaa9',
                  borderRadius: '3px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? commonT('loading') : t('createBtn')}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div
          style={{
            position: 'sticky',
            top: '0',
            zIndex: 10,
            background: '#ffffff',
            padding: '12px 16px',
            marginBottom: '16px',
            border: '1px solid #28aaa9',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            flexDirection: isRtl ? 'row-reverse' : 'row'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <span style={{ fontWeight: 600, color: '#28aaa9' }}>{selectedIds.size} {commonT('selected')}</span>
            <div style={{ width: '1px', height: '24px', background: '#eee' }} />
            <button
              onClick={() => handleBulkAction('update-status', true)}
              disabled={bulkActionLoading}
              style={{ height: '32px', padding: '0 12px', fontSize: '13px', borderRadius: '3px', border: '1px solid #28aaa9', background: '#ffffff', color: '#28aaa9', cursor: 'pointer' }}
            >
              {t('activate')}
            </button>
            <button
              onClick={() => handleBulkAction('update-status', false)}
              disabled={bulkActionLoading}
              style={{ height: '32px', padding: '0 12px', fontSize: '13px', borderRadius: '3px', border: '1px solid #525f80', background: '#ffffff', color: '#525f80', cursor: 'pointer' }}
            >
              {t('deactivate')}
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={bulkActionLoading}
              style={{ height: '32px', padding: '0 12px', fontSize: '13px', borderRadius: '3px', border: '1px solid #dc3545', background: '#ffffff', color: '#dc3545', cursor: 'pointer' }}
            >
              {commonT('deleteSelected')}
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{ background: 'none', border: 'none', color: '#9ca8b3', cursor: 'pointer', fontSize: '13px' }}
          >
            {commonT('cancel')}
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '600px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                <th style={{ padding: '12px', width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedIds.size === users.length}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = selectedIds.size > 0 && selectedIds.size < users.length;
                      }
                    }}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('name')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('email')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('role')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('status')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('created')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('actions')}</th>
              </tr>
            </thead>
            <tbody style={{ borderBottom: '1px solid #eee' }}>
              {users.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid #f5f5f5', background: selectedIds.has(u._id) ? '#28aaa905' : 'transparent' }}>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u._id)}
                      onChange={() => toggleSelect(u._id)}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <a href={`/dashboard/users/${u._id}`} style={{ color: '#28aaa9', fontWeight: 500, textDecoration: 'none' }}>{u.name}</a>
                  </td>
                  <td style={{ padding: '12px', color: '#525f80' }}>{u.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        borderRadius: '3px',
                        background: '#28aaa9',
                        color: '#ffffff',
                      }}
                    >
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        borderRadius: '3px',
                        background: u.isActive ? '#42ca7f' : '#adb5bd',
                        color: '#ffffff',
                      }}
                    >
                      {u.isActive ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#525f80' }}>{new Date(u.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                      <button
                        onClick={() => toggleActive(u._id, u.isActive)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#28aaa9',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        {u.isActive ? t('deactivate') : t('activate')}
                      </button>
                      <button
                        onClick={() => handleDelete(u._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        {commonT('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
