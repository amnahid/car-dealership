'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

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
}

interface SalaryPayment {
  _id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  paymentDate: string;
  month: number;
  year: number;
  paymentType: string;
  notes?: string;
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    fetch(`/api/employees/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Employee not found');
        return res.json();
      })
      .then((data) => {
        setEmployee(data.employee);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load employee');
      })
      .finally(() => setLoading(false));

    fetch(`/api/salary-payments?employeeId=${id}`)
      .then(res => res.json())
      .then(data => setPayments(data.payments || []))
      .catch(console.error);
  }, [params?.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    if (!confirm('This action cannot be undone. Continue?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/employees/${employee?._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
        return;
      }
      router.push('/dashboard/employees');
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const paymentData = {
      employee: employee?._id,
      employeeId: employee?.employeeId,
      employeeName: employee?.name,
      amount: parseFloat(formData.get('amount') as string),
      paymentDate: formData.get('paymentDate'),
      month: new Date(formData.get('paymentDate') as string).getMonth() + 1,
      year: new Date(formData.get('paymentDate') as string).getFullYear(),
      paymentType: formData.get('paymentType'),
      notes: formData.get('notes'),
    };

    try {
      const res = await fetch('/api/salary-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      if (!res.ok) throw new Error('Failed to add payment');
      
      const data = await res.json();
      setPayments([data.payment, ...payments]);
      setShowPaymentModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add payment');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>;
  }

  if (error || !employee) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ec4561' }}>
        {error || 'Employee not found'}
        <div style={{ marginTop: '16px' }}>
          <Link href="/dashboard/employees" style={{ color: '#28aaa9' }}>← Back to Employees</Link>
        </div>
      </div>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/employees" style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Employees
        </Link>
      </div>

      <h2 className="page-title" style={{ marginBottom: '24px' }}>Employee Details</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Personal Information</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Employee ID</span>
              <span style={{ color: '#28aaa9', fontWeight: 600, fontFamily: 'monospace' }}>{employee.employeeId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Name</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{employee.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Phone</span>
              <span style={{ color: '#2a3142' }}>{employee.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Email</span>
              <span style={{ color: '#2a3142' }}>{employee.email || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Designation</span>
              <span style={{ color: '#2a3142' }}>{employee.designation}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Department</span>
              <span style={{ color: '#2a3142' }}>{employee.department}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Base Salary</span>
              <span style={{ color: '#2a3142', fontWeight: 600 }}>${employee.baseSalary.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Joining Date</span>
              <span style={{ color: '#2a3142' }}>{new Date(employee.joiningDate).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Status</span>
              <span style={{ padding: '4px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500, background: employee.isActive ? '#28aaa920' : '#ec456120', color: employee.isActive ? '#28aaa9' : '#ec4561' }}>
                {employee.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142' }}>Salary Payments</h3>
            <button onClick={() => setShowPaymentModal(true)} style={{ padding: '8px 16px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: 'pointer' }}>
              + Add Payment
            </button>
          </div>
          
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#525f80' }}>Total Paid</span>
            <span style={{ color: '#28aaa9', fontWeight: 700 }}>${totalPaid.toLocaleString()}</span>
          </div>

          {payments.length === 0 ? (
            <div style={{ color: '#9ca8b3', textAlign: 'center', padding: '20px' }}>No payments recorded</div>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '8px', textAlign: 'left', color: '#525f80' }}>Date</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: '#525f80' }}>Type</th>
                    <th style={{ padding: '8px', textAlign: 'right', color: '#525f80' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '8px' }}>{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td style={{ padding: '8px' }}>{p.paymentType}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#2a3142' }}>${p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ec4561', borderRadius: '3px', background: '#ffffff', color: '#ec4561', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}
        >
          {deleting ? 'Deleting...' : 'Delete Employee'}
        </button>
      </div>

      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '400px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>Add Salary Payment</h3>
            <form onSubmit={handlePaymentSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Amount *</label>
                <input required type="number" name="amount" defaultValue={employee.baseSalary} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Payment Date *</label>
                <input required type="date" name="paymentDate" defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Type</label>
                <select name="paymentType" defaultValue="Monthly" style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}>
                  <option value="Monthly">Monthly</option>
                  <option value="Bonus">Bonus</option>
                  <option value="Advance">Advance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Notes</label>
                <textarea name="notes" style={{ width: '100%', height: '60px', fontSize: '14px', borderRadius: '0', padding: '12px', border: '1px solid #ced4da' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: 'pointer' }}>Add Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}