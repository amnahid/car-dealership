'use client';

import { useState, useEffect, useCallback } from 'react';

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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<UserFormData>({ name: '', email: '', password: '', role: 'Sales Agent' });
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create user');
        return;
      }
      setShowForm(false);
      setFormData({ name: '', email: '', password: '', role: 'Sales Agent' });
      fetchUsers();
    } catch {
      setError('Network error');
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    fontSize: '14px',
    borderRadius: '0',
    padding: '0 12px',
    border: '1px solid #ced4da',
    background: '#ffffff',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#2a3142',
    marginBottom: '4px',
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <h2 className="page-title">User Management</h2>
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
          + Add User
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '24px', maxWidth: '500px' }}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#2a3142',
              marginBottom: '16px',
              fontFamily: '"Sarabun", sans-serif',
            }}
          >
            Create New User
          </h3>
          {error && (
            <div
              style={{
                background: 'rgba(236, 69, 97, 0.1)',
                border: '1px solid #ec4561',
                borderRadius: '3px',
                padding: '12px',
                marginBottom: '16px',
              }}
            >
              <p style={{ color: '#ec4561', fontSize: '14px', margin: 0 }}>{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Name *</label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                style={inputStyle}
              >
                {['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
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
                Cancel
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
                {saving ? 'Saving...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '600px' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#525f80',
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ borderBottom: '1px solid #eee' }}>
              {users.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{u.name}</td>
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
                      {u.role}
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
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#525f80' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => toggleActive(u._id, u.isActive)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#28aaa9',
                        fontSize: '14px',
                        cursor: 'pointer',
                        textDecoration: 'none',
                      }}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
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