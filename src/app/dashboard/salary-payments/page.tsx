'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import SearchableSelect from '@/components/SearchableSelect';
import { useTranslations, useLocale } from 'next-intl';

interface SalaryPayment {
  _id: string;
  paymentId: string;
  employee: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  paymentDate: string;
  month: number;
  year: number;
  paymentType: 'Monthly' | 'Bonus' | 'Advance' | 'Deduction';
  status: 'Active' | 'Cancelled';
  notes?: string;
}

const PAYMENT_TYPES = ['Monthly', 'Bonus', 'Advance', 'Deduction'] as const;

interface EmployeeDetail {
  _id: string;
  employeeId: string;
  name: string;
  baseSalary: number;
}

export default function SalaryPaymentsPage() {
  const t = useTranslations('SalaryPayments');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [employees, setEmployees] = useState<EmployeeDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalThisMonth, setTotalThisMonth] = useState(0);
  const [totalShown, setTotalShown] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filters
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterType, setFilterType] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '20' });
    if (filterEmployee) params.set('employeeId', filterEmployee);
    if (filterMonth) params.set('month', filterMonth);
    if (filterYear) params.set('year', filterYear);
    if (filterType) params.set('paymentType', filterType);

    try {
      const res = await fetch(`/api/salary-payments?${params}`);
      const data = await res.json();
      setPayments(data.payments || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalThisMonth(data.totalThisMonth || 0);
      setTotalShown(data.totalShown || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterEmployee, filterMonth, filterYear, filterType]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetch('/api/employees?limit=100&active=true')
      .then(r => r.json())
      .then(d => setEmployees(d.employees || []))
      .catch(console.error);
  }, []);

  const handleCancelPayment = async (id: string) => {
    if (!confirm(t('cancelPayment'))) return;
    const res = await fetch(`/api/salary-payments/${id}`, { method: 'DELETE' });
    if (res.ok) fetchPayments();
    else alert((await res.json()).error || 'Failed to cancel');
  };

  const resetFilters = () => {
    setFilterEmployee('');
    setFilterMonth('');
    setFilterYear('');
    setFilterType('');
    setPage(1);
  };

  const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
    Monthly: { bg: '#28aaa920', color: '#28aaa9' },
    Bonus: { bg: '#42ca7f20', color: '#42ca7f' },
    Advance: { bg: '#f8b42520', color: '#f8b425' },
    Deduction: { bg: '#ec456120', color: '#ec4561' },
  };

  const formatCurrency = (val: number | undefined | null) => `SAR ${(val || 0).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}`;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className={isRtl ? 'text-right' : 'text-left'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <h2 className="page-title">{t('title')}</h2>
        <button onClick={() => setShowAddModal(true)} style={{ background: '#28aaa9', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: 'none', cursor: 'pointer' }}>
          + {t('addNew')}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #ec4561', borderRight: isRtl ? '4px solid #ec4561' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('totalPaidThisMonth')}</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#ec4561', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(totalThisMonth)}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #28aaa9', borderRight: isRtl ? '4px solid #28aaa9' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('shownActive')}</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#28aaa9', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(totalShown)}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #525f80', borderRight: isRtl ? '4px solid #525f80' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('recordsShown')}</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#2a3142', margin: '4px 0 0' }}>{payments.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'flex-end', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <div style={{ minWidth: '200px' }}>
          <SearchableSelect
            value={filterEmployee}
            onChange={(v) => { setFilterEmployee(v); setPage(1); }}
            options={[{ value: '', label: t('allEmployees') }, ...employees.map(e => ({ value: e._id, label: e.name }))]}
            placeholder={t('allEmployees')}
          />
        </div>
        <select value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }} style={{ height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', background: '#fff', textAlign: isRtl ? 'right' : 'left' }}>
          <option value="">{t('allMonths')}</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{t(`fullMonths.${m}`)}</option>)}
        </select>
        <select value={filterYear} onChange={(e) => { setFilterYear(e.target.value); setPage(1); }} style={{ height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', background: '#fff', textAlign: isRtl ? 'right' : 'left' }}>
          <option value="">{t('allYears')}</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} style={{ height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', background: '#fff', textAlign: isRtl ? 'right' : 'left' }}>
          <option value="">{t('allTypes')}</option>
          {PAYMENT_TYPES.map(type => <option key={type} value={type}>{t(`types.${type}`)}</option>)}
        </select>
        {(filterEmployee || filterMonth || filterYear || filterType) && (
          <button onClick={resetFilters} style={{ height: '40px', padding: '0 16px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#fff', cursor: 'pointer', color: '#525f80' }}>
            {commonT('clearFilters')}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{t('noPayments')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '800px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('paymentId')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('employee')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('period')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('type')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('amount')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('date')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('status')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #f5f5f5', opacity: p.status === 'Cancelled' ? 0.5 : 1 }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#28aaa9', fontSize: '13px' }}>{p.paymentId}</td>
                    <td style={{ padding: '12px' }}>
                      <Link href={`/dashboard/employees/${p.employee}`} style={{ color: '#2a3142', textDecoration: 'none', fontWeight: 500 }}>{p.employeeName}</Link>
                      <br />
                      <span style={{ fontSize: '12px', color: '#9ca8b3', fontFamily: 'monospace' }}>{p.employeeId}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {t(`months.${p.month}`)} {p.year}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500, ...TYPE_COLORS[p.paymentType] }}>
                        {t(`types.${p.paymentType}`)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, color: p.paymentType === 'Deduction' ? '#ec4561' : '#2a3142', textAlign: isRtl ? 'left' : 'right' }}>
                      {p.paymentType === 'Deduction' ? '-' : ''}{formatCurrency(p.amount)}
                    </td>
                    <td style={{ padding: '12px' }}>{new Date(p.paymentDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500, background: p.status === 'Active' ? '#42ca7f20' : '#ec456120', color: p.status === 'Active' ? '#42ca7f' : '#ec4561' }}>
                        {p.status === 'Active' ? t('active') : commonT('cancelled')}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {p.status === 'Active' && (
                        <button onClick={() => handleCancelPayment(p._id)} style={{ fontSize: '13px', color: '#ec4561', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          {commonT('cancel')}
                        </button>
                      )}
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
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>{commonT('prev')}</button>
          <span style={{ padding: '8px 12px', fontSize: '12px', color: '#525f80' }}>{commonT('page', { page, total: totalPages })}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>{commonT('next')}</button>
        </div>
      )}

      {showAddModal && (
        <AddPaymentModal
          employees={employees}
          onClose={() => setShowAddModal(false)}
          onSave={() => { setShowAddModal(false); fetchPayments(); }}
        />
      )}
    </div>
  );
}

function AddPaymentModal({ employees, onClose, onSave }: {
  employees: EmployeeDetail[];
  onClose: () => void;
  onSave: () => void;
}) {
  const t = useTranslations('SalaryPayments');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetail | null>(null);
  const [form, setForm] = useState({
    employeeId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentType: 'Monthly' as any,
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleEmployeeChange = (empId: string) => {
    const emp = employees.find(e => e._id === empId) || null;
    setSelectedEmployee(emp);
    setForm(f => ({ ...f, employeeId: empId, amount: emp ? emp.baseSalary.toString() : '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) { alert('Please select an employee'); return; }
    setLoading(true);
    try {
      const paymentDate = new Date(form.paymentDate);
      const res = await fetch('/api/salary-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee: selectedEmployee._id,
          employeeId: selectedEmployee.employeeId,
          employeeName: selectedEmployee.name,
          amount: parseFloat(form.amount),
          paymentDate: form.paymentDate,
          month: paymentDate.getMonth() + 1,
          year: paymentDate.getFullYear(),
          paymentType: form.paymentType,
          notes: form.notes,
        }),
      });
      if (!res.ok) { alert((await res.json()).error || 'Failed to add payment'); return; }
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
    textAlign: isRtl ? 'right' : 'left'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '4px',
    textAlign: isRtl ? 'right' : 'left'
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '440px', maxHeight: '90vh', overflowY: 'auto', textAlign: isRtl ? 'right' : 'left' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{t('addPayment')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>{t('employee')} *</label>
            <select required value={form.employeeId} onChange={(e) => handleEmployeeChange(e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
              <option value="">{t('selectEmployee')}</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.employeeId})</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>{t('amount')} *</label>
            <input required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>{t('date')} *</label>
            <input required type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>{t('type')}</label>
            <select value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value as any })} style={{ ...inputStyle, background: '#fff' }}>
              {PAYMENT_TYPES.map(type => <option key={type} value={type}>{t(`types.${type}`)}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{commonT('notes')}</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: '60px', padding: '12px' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#fff', cursor: 'pointer' }}>{commonT('cancel')}</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? commonT('loading') : t('savePayment')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
