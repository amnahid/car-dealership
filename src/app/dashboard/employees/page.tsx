'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import SearchableSelect from '@/components/SearchableSelect';
import DataTransferButtons from '@/components/DataTransferButtons';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslations, useLocale } from 'next-intl';

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  phone: string;
  email?: string;
  designation: string;
  department: string;
  baseSalary: number;
  joiningDate: string;
  isActive: boolean;
  photo?: string;
  commissionRate?: number;
}

const DEPARTMENTS = ['Sales', 'Service', 'Accounts', 'Admin', 'Management'] as const;

export default function EmployeesPage() {
  const t = useTranslations('Employees');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMonthlySalary, setTotalMonthlySalary] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.size === employees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map((e) => e._id)));
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

  const handleBulkDelete = async () => {
    if (!confirm(commonT('deleteConfirm'))) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/employees/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        fetchEmployees();
      } else {
        const data = await res.json();
        alert(data.error || 'Bulk delete failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (deptFilter) params.set('department', deptFilter);

    try {
      const res = await fetch(`/api/employees?${params}`);
      const data = await res.json();
      setEmployees(data.employees || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalMonthlySalary(data.totalMonthlySalary || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, deptFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const getDeptLabel = (dept: string) => {
    const key = dept.toLowerCase();
    return t(`departments.${key}`);
  };

  const formatCurrency = (val: number | undefined | null) => `SAR ${(val || 0).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}`;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className={isRtl ? 'text-right' : 'text-left'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <h2 className="page-title">{t('title')}</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <DataTransferButtons entityType="employees" onImportSuccess={fetchEmployees} />
          <button
            onClick={() => { setEditingEmployee(null); setShowModal(true); }}
            style={{ background: '#28aaa9', color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: '1px solid #28aaa9', cursor: 'pointer' }}
          >
            + {t('addNew')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #28aaa9', borderRight: isRtl ? '4px solid #28aaa9' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('totalEmployees')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#28aaa9', margin: '4px 0 0' }}>{employees.length}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #ec4561', borderRight: isRtl ? '4px solid #ec4561' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('monthlySalaryExpense')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#ec4561', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(totalMonthlySalary)}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'flex-end', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: '300px', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', textAlign: isRtl ? 'right' : 'left' }}
        />
        <div style={{ minWidth: '200px' }}>
          <SearchableSelect
            value={deptFilter}
            onChange={(v) => { setDeptFilter(v); setPage(1); }}
            options={[{ value: '', label: t('allDepartments') }, ...DEPARTMENTS.map(d => ({ value: d, label: getDeptLabel(d) }))]}
            placeholder={t('allDepartments')}
          />
        </div>
      </div>

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
            <button
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
              style={{
                height: '32px',
                padding: '0 12px',
                fontSize: '13px',
                borderRadius: '3px',
                border: '1px solid #dc3545',
                background: '#ffffff',
                color: '#dc3545',
                cursor: 'pointer'
              }}
            >
              {commonT('deleteSelected')}
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca8b3',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {commonT('cancel')}
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{t('noEmployees')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '900px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  <th style={{ padding: '12px', width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={employees.length > 0 && selectedIds.size === employees.length}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = selectedIds.size > 0 && selectedIds.size < employees.length;
                        }
                      }}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('id')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('photo')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('name')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('phone')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('email')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('designation')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('department')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('salary')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('status')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('actions')}</th>
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #eee' }}>
                {employees.map((emp) => (
                  <tr key={emp._id} style={{ borderBottom: '1px solid #f5f5f5', background: selectedIds.has(emp._id) ? '#28aaa905' : 'transparent' }}>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(emp._id)}
                        onChange={() => toggleSelect(emp._id)}
                      />
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#28aaa9' }}>{emp.employeeId}</td>
                    <td style={{ padding: '12px' }}>
                      {emp.photo ? (
                        <img src={emp.photo} alt={emp.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#9ca8b3', fontWeight: 600 }}>
                          {emp.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 500 }}>{emp.name}</td>
                    <td style={{ padding: '12px' }}>{emp.phone}</td>
                    <td style={{ padding: '12px' }}>{emp.email || '-'}</td>
                    <td style={{ padding: '12px' }}>{emp.designation}</td>
                    <td style={{ padding: '12px' }}>{getDeptLabel(emp.department)}</td>
                    <td style={{ padding: '12px', fontWeight: 600, textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(emp.baseSalary)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500, background: emp.isActive ? '#42ca7f20' : '#ec456120', color: emp.isActive ? '#42ca7f' : '#ec4561' }}>
                        {emp.isActive ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <button onClick={() => { setEditingEmployee(emp); setShowModal(true); }} style={{ color: '#f8b425', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '14px' }}>{commonT('edit')}</button>
                        <Link href={`/dashboard/employees/${emp._id}`} style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>{commonT('view')}</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>{commonT('prev')}</button>
          <span style={{ padding: '8px 12px', fontSize: '12px', color: '#525f80' }}>{commonT('page', { page, total: totalPages })}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>{commonT('next')}</button>
        </div>
      )}

      {showModal && <EmployeeModal employee={editingEmployee} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchEmployees(); }} />}
    </div>
  );
}

function EmployeeModal({ employee, onClose, onSave }: { employee: Employee | null; onClose: () => void; onSave: () => void }) {
  const t = useTranslations('Employees');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [form, setForm] = useState({
    name: employee?.name || '',
    phone: employee?.phone || '',
    email: employee?.email || '',
    designation: employee?.designation || '',
    department: employee?.department || 'Sales',
    baseSalary: employee?.baseSalary?.toString() || '',
    commissionRate: employee?.commissionRate?.toString() || '',
    joiningDate: employee?.joiningDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    isActive: employee?.isActive ?? true,
    photo: employee?.photo || '',
  });
  const [loading, setLoading] = useState(false);

  const getDeptLabel = (dept: string) => {
    const key = dept.toLowerCase();
    return t(`departments.${key}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = employee ? `/api/employees/${employee._id}` : '/api/employees';
      const method = employee ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const data = await res.json(); alert(data.error || 'Failed'); return; }
      onSave();
    } catch (err) { console.error(err); } finally { setLoading(false); }
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflow: 'auto', textAlign: isRtl ? 'right' : 'left' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{employee ? t('editEmployee') : t('addEmployee')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <ImageUpload value={form.photo} onChange={(url) => setForm({ ...form, photo: url })} folder="employees" label={form.name || t('name')} size={80} />
            </div>
            <div><label style={labelStyle}>{t('name')} *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('phone')} *</label><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('email')}</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('designation')} *</label><input required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('department')} *</label><SearchableSelect value={form.department} onChange={(v) => setForm({ ...form, department: v })} options={DEPARTMENTS.map(d => ({ value: d, label: getDeptLabel(d) }))} placeholder={t('department')} /></div>
            <div><label style={labelStyle}>{t('salary')} *</label><input required type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('commissionRate')}</label><input type="number" min="0" max="100" step="0.1" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('joiningDate')} *</label><input required type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('status')}</label><SearchableSelect value={form.isActive.toString()} onChange={(v) => setForm({ ...form, isActive: v === 'true' })} options={[{ value: 'true', label: t('active') }, { value: 'false', label: t('inactive') }]} /></div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            {employee && (
              <button type="button" onClick={async () => { if (confirm(t('deleteConfirm'))) { await fetch(`/api/employees/${employee._id}`, { method: 'DELETE' }); onSave(); onClose(); } }} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ec4561', borderRadius: '3px', background: '#ffffff', color: '#ec4561', cursor: 'pointer' }}>{commonT('delete')}</button>
            )}
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>{commonT('cancel')}</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? commonT('loading') : commonT('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
