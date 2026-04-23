'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import SearchableSelect from '@/components/SearchableSelect';

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  phone: string;
  email?: string;
  designation: string;
  department: string;
  baseSalary: number;
  commissionRate?: number;
  joiningDate: string;
  isActive: boolean;
  photo?: string;
}

interface SalaryPayment {
  _id: string;
  paymentId: string;
  amount: number;
  paymentDate: string;
  month: number;
  year: number;
  paymentType: 'Monthly' | 'Bonus' | 'Advance' | 'Deduction';
  status: 'Active' | 'Cancelled';
  notes?: string;
}

interface CommissionSale {
  _id: string;
  saleId: string;
  agentCommission: number;
  createdAt: string;
  finalPrice?: number;
}

const DEPARTMENTS = ['Sales', 'Service', 'Accounts', 'Admin', 'Management'];
const PAYMENT_TYPES = ['Monthly', 'Bonus', 'Advance', 'Deduction'] as const;
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [commissions, setCommissions] = useState<{ totalCommission: number; salesCount: number; sales: CommissionSale[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<SalaryPayment | null>(null);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPayments = useCallback(async (id: string) => {
    const res = await fetch(`/api/salary-payments?employeeId=${id}&limit=100`);
    const data = await res.json();
    setPayments(data.payments || []);
  }, []);

  const fetchCommissions = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/employees/${id}/commissions`);
      const data = await res.json();
      setCommissions(data);
    } catch {
      setCommissions({ totalCommission: 0, salesCount: 0, sales: [] });
    }
  }, []);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;
    fetch(`/api/employees/${id}`)
      .then((res) => { if (!res.ok) throw new Error('Employee not found'); return res.json(); })
      .then((data) => setEmployee(data.employee))
      .catch((err) => setError(err.message || 'Failed to load employee'))
      .finally(() => setLoading(false));
    fetchPayments(id);
    fetchCommissions(id);
  }, [params?.id, fetchPayments, fetchCommissions]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    if (!confirm('This action cannot be undone. Continue?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/employees/${employee?._id}`, { method: 'DELETE' });
      if (!res.ok) { alert((await res.json()).error || 'Failed to delete'); return; }
      router.push('/dashboard/employees');
    } catch (err) { console.error(err); } finally { setDeleting(false); }
  };

  const handleCancelPayment = async (paymentId: string) => {
    if (!confirm('Cancel this payment? This cannot be undone.')) return;
    const res = await fetch(`/api/salary-payments/${paymentId}`, { method: 'DELETE' });
    if (res.ok) fetchPayments(params?.id as string);
    else alert((await res.json()).error || 'Failed to cancel');
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>;
  if (error || !employee) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ec4561' }}>
        {error || 'Employee not found'}
        <div style={{ marginTop: '16px' }}><Link href="/dashboard/employees" style={{ color: '#28aaa9' }}>← Back to Employees</Link></div>
      </div>
    );
  }

  const activePayments = payments.filter(p => p.status === 'Active');
  const totalPaid = activePayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/employees" style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>← Back to Employees</Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 className="page-title">Employee Details</h2>
        <button onClick={() => setShowEditEmployee(true)} style={{ background: '#f8b425', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: 'none', cursor: 'pointer' }}>
          ✎ Edit Employee
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Personal Information */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Personal Information</h3>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <ImageUpload value={employee.photo} onChange={async (url) => {
              const res = await fetch(`/api/employees/${employee._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photo: url }) });
              if (res.ok) setEmployee({ ...employee, photo: url });
            }} folder="employees" label={employee.name} size={80} />
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { label: 'Employee ID', value: <span style={{ color: '#28aaa9', fontWeight: 600, fontFamily: 'monospace' }}>{employee.employeeId}</span> },
              { label: 'Name', value: <span style={{ fontWeight: 500 }}>{employee.name}</span> },
              { label: 'Phone', value: employee.phone },
              { label: 'Email', value: employee.email || '-' },
              { label: 'Designation', value: employee.designation },
              { label: 'Department', value: employee.department },
              { label: 'Base Salary', value: <span style={{ fontWeight: 600 }}>SAR {employee.baseSalary.toLocaleString()}</span> },
              { label: 'Commission Rate', value: employee.commissionRate != null ? `${employee.commissionRate}%` : '-' },
              { label: 'Joining Date', value: new Date(employee.joiningDate).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca8b3' }}>{label}</span>
                <span style={{ color: '#2a3142' }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#9ca8b3' }}>Status</span>
              <span style={{ padding: '4px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500, background: employee.isActive ? '#28aaa920' : '#ec456120', color: employee.isActive ? '#28aaa9' : '#ec4561' }}>
                {employee.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Salary Payments */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142' }}>Salary Payments</h3>
            <button onClick={() => { setEditingPayment(null); setShowPaymentModal(true); }} style={{ padding: '8px 16px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#fff', cursor: 'pointer' }}>
              + Add Payment
            </button>
          </div>
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#525f80' }}>Total Paid (Active)</span>
            <span style={{ color: '#28aaa9', fontWeight: 700 }}>SAR {totalPaid.toLocaleString()}</span>
          </div>
          {payments.length === 0 ? (
            <div style={{ color: '#9ca8b3', textAlign: 'center', padding: '20px' }}>No payments recorded</div>
          ) : (
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    {['Date', 'Type', 'Amount', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '8px', textAlign: h === 'Amount' ? 'right' : 'left', color: '#525f80', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id} style={{ borderBottom: '1px solid #f5f5f5', opacity: p.status === 'Cancelled' ? 0.5 : 1 }}>
                      <td style={{ padding: '8px' }}>
                        {new Date(p.paymentDate).toLocaleDateString()}
                        <br />
                        <span style={{ fontSize: '11px', color: '#9ca8b3' }}>{MONTH_NAMES[p.month - 1]} {p.year}</span>
                      </td>
                      <td style={{ padding: '8px' }}>{p.paymentType}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 500, color: p.paymentType === 'Deduction' ? '#ec4561' : '#2a3142' }}>
                        {p.paymentType === 'Deduction' ? '-' : ''}SAR {p.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: 500, background: p.status === 'Active' ? '#42ca7f20' : '#ec456120', color: p.status === 'Active' ? '#42ca7f' : '#ec4561' }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        {p.status === 'Active' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => { setEditingPayment(p); setShowPaymentModal(true); }} style={{ fontSize: '11px', color: '#f8b425', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Edit</button>
                            <button onClick={() => handleCancelPayment(p._id)} style={{ fontSize: '11px', color: '#ec4561', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Cancel</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sales Commissions */}
        <div className="card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Sales Commissions</h3>
          {commissions === null ? (
            <div style={{ color: '#9ca8b3', textAlign: 'center', padding: '20px' }}>Loading commissions...</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#f8f9fa', borderRadius: '4px', padding: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: '#9ca8b3', margin: 0 }}>Commission Rate</p>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: '#28aaa9', margin: '6px 0 0' }}>{employee.commissionRate != null ? `${employee.commissionRate}%` : '—'}</p>
                </div>
                <div style={{ background: '#f8f9fa', borderRadius: '4px', padding: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: '#9ca8b3', margin: 0 }}>Total Earned</p>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: '#42ca7f', margin: '6px 0 0' }}>SAR {commissions.totalCommission.toLocaleString()}</p>
                </div>
                <div style={{ background: '#f8f9fa', borderRadius: '4px', padding: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: '#9ca8b3', margin: 0 }}>Sales with Commission</p>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: '#2a3142', margin: '6px 0 0' }}>{commissions.salesCount}</p>
                </div>
              </div>
              {commissions.sales.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '13px' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                      <tr>
                        {['Sale ID', 'Date', 'Sale Amount', 'Commission'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.sales.map((s) => (
                        <tr key={s._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#28aaa9' }}>{s.saleId}</td>
                          <td style={{ padding: '10px 12px' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '10px 12px' }}>{s.finalPrice != null ? `SAR ${s.finalPrice.toLocaleString()}` : '-'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#42ca7f' }}>SAR {(s.agentCommission || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#9ca8b3', textAlign: 'center', padding: '20px' }}>No sales commissions recorded for this employee.</p>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button onClick={handleDelete} disabled={deleting} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ec4561', borderRadius: '3px', background: '#fff', color: '#ec4561', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}>
          {deleting ? 'Deleting...' : 'Delete Employee'}
        </button>
      </div>

      {showPaymentModal && (
        <PaymentModal
          employee={employee}
          payment={editingPayment}
          onClose={() => { setShowPaymentModal(false); setEditingPayment(null); }}
          onSave={() => { setShowPaymentModal(false); setEditingPayment(null); fetchPayments(params?.id as string); }}
        />
      )}

      {showEditEmployee && (
        <EmployeeEditModal
          employee={employee}
          onClose={() => setShowEditEmployee(false)}
          onSave={(updated) => { setEmployee(updated); setShowEditEmployee(false); }}
        />
      )}
    </div>
  );
}

function PaymentModal({ employee, payment, onClose, onSave }: {
  employee: Employee;
  payment: SalaryPayment | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    amount: payment?.amount?.toString() || employee.baseSalary.toString(),
    paymentDate: payment?.paymentDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    paymentType: payment?.paymentType || 'Monthly',
    notes: payment?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const paymentDate = new Date(form.paymentDate);
      const url = payment ? `/api/salary-payments/${payment._id}` : '/api/salary-payments';
      const method = payment ? 'PUT' : 'POST';
      const body = payment
        ? { amount: parseFloat(form.amount), paymentDate: form.paymentDate, paymentType: form.paymentType, notes: form.notes }
        : {
            employee: employee._id,
            employeeId: employee.employeeId,
            employeeName: employee.name,
            amount: parseFloat(form.amount),
            paymentDate: form.paymentDate,
            month: paymentDate.getMonth() + 1,
            year: paymentDate.getFullYear(),
            paymentType: form.paymentType,
            notes: form.notes,
          };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { alert((await res.json()).error || 'Failed'); return; }
      onSave();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '400px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{payment ? 'Edit Payment' : 'Add Salary Payment'}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Amount (SAR) *</label>
            <input required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Payment Date *</label>
            <input required type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <SearchableSelect
              label="Type"
              value={form.paymentType}
              onChange={(v) => setForm({ ...form, paymentType: v as typeof PAYMENT_TYPES[number] })}
              options={PAYMENT_TYPES.map(t => ({ value: t, label: t }))}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ width: '100%', height: '60px', fontSize: '14px', borderRadius: '0', padding: '12px', border: '1px solid #ced4da' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmployeeEditModal({ employee, onClose, onSave }: {
  employee: Employee;
  onClose: () => void;
  onSave: (updated: Employee) => void;
}) {
  const [form, setForm] = useState({
    name: employee.name,
    phone: employee.phone,
    email: employee.email || '',
    designation: employee.designation,
    department: employee.department,
    baseSalary: employee.baseSalary.toString(),
    commissionRate: employee.commissionRate?.toString() || '',
    joiningDate: employee.joiningDate?.split('T')[0] || '',
    isActive: employee.isActive,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employee._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          baseSalary: parseFloat(form.baseSalary),
          commissionRate: form.commissionRate ? parseFloat(form.commissionRate) : undefined,
        }),
      });
      if (!res.ok) { alert((await res.json()).error || 'Failed'); return; }
      const data = await res.json();
      onSave(data.employee);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '520px', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>Edit Employee — {employee.employeeId}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Phone *</label><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Designation *</label><input required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Department *</label><SearchableSelect required value={form.department} onChange={(v) => setForm({ ...form, department: v })} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} placeholder="Select department..." /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Base Salary (SAR) *</label><input required type="number" min="0" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Commission Rate (%)</label><input type="number" min="0" max="100" step="0.1" placeholder="e.g. 2.5" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Joining Date *</label><input required type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Status</label><SearchableSelect value={form.isActive.toString()} onChange={(v) => setForm({ ...form, isActive: v === 'true' })} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} /></div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
