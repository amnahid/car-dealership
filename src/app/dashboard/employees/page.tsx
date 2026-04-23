'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  joiningDate: string;
  isActive: boolean;
  photo?: string;
}

const DEPARTMENTS = ['Sales', 'Service', 'Accounts', 'Admin', 'Management'] as const;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMonthlySalary, setTotalMonthlySalary] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (search) params.set('search', search);
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
  }, [page, search, deptFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const departments = ['Sales', 'Service', 'Accounts', 'Admin', 'Management'];

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 className="page-title">Employees</h2>
        <button
          onClick={() => { setEditingEmployee(null); setShowModal(true); }}
          style={{ background: '#28aaa9', color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: '1px solid #28aaa9', cursor: 'pointer' }}
        >
          + Add Employee
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#9ca8b3', margin: 0 }}>Total Employees</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#28aaa9', margin: '8px 0 0' }}>{employees.length}</p>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#9ca8b3', margin: 0 }}>Monthly Salary Expense</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#ec4561', margin: '8px 0 0' }}>SAR {totalMonthlySalary.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'flex-end' }}>
        <input
          type="text"
          placeholder="Search by name, phone, ID..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: '250px', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}
        />
        <div style={{ minWidth: '180px' }}>
          <SearchableSelect
            value={deptFilter}
            onChange={(v) => { setDeptFilter(v); setPage(1); }}
            options={[{ value: '', label: 'All Departments' }, ...DEPARTMENTS.map(d => ({ value: d, label: d }))]}
            placeholder="All Departments"
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No employees found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '900px' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  {['ID', 'Photo', 'Name', 'Phone', 'Email', 'Designation', 'Department', 'Salary', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #eee' }}>
                {employees.map((emp) => (
                  <tr key={emp._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
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
                    <td style={{ padding: '12px' }}>{emp.department}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>SAR {emp.baseSalary.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500, background: emp.isActive ? '#42ca7f20' : '#ec456120', color: emp.isActive ? '#42ca7f' : '#ec4561' }}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setEditingEmployee(emp); setShowModal(true); }} style={{ color: '#f8b425', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Edit</button>
                        <Link href={`/dashboard/employees/${emp._id}`} style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>View</Link>
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
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>Prev</button>
          <span style={{ padding: '8px 12px', fontSize: '12px', color: '#525f80' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>Next</button>
        </div>
      )}

      {showModal && <EmployeeModal employee={editingEmployee} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchEmployees(); }} />}
    </div>
  );
}

function EmployeeModal({ employee, onClose, onSave }: { employee: Employee | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: employee?.name || '',
    phone: employee?.phone || '',
    email: employee?.email || '',
    designation: employee?.designation || '',
    department: employee?.department || 'Sales',
    baseSalary: employee?.baseSalary?.toString() || '',
    commissionRate: (employee as Employee & { commissionRate?: number })?.commissionRate?.toString() || '',
    joiningDate: employee?.joiningDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    isActive: employee?.isActive ?? true,
    photo: employee?.photo || '',
  });
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{employee ? 'Edit Employee' : 'Add Employee'}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <ImageUpload value={form.photo} onChange={(url) => setForm({ ...form, photo: url })} folder="employees" label={form.name || 'Employee'} size={80} />
            </div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Phone *</label><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Designation *</label><input required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Department *</label><SearchableSelect required value={form.department} onChange={(v) => setForm({ ...form, department: v })} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} placeholder="Select department..." /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Base Salary *</label><input required type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Commission Rate (%)</label><input type="number" min="0" max="100" step="0.1" placeholder="e.g. 2.5" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Joining Date *</label><input required type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} /></div>
            <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Status</label><SearchableSelect value={form.isActive.toString()} onChange={(v) => setForm({ ...form, isActive: v === 'true' })} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} /></div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            {employee && (
              <button type="button" onClick={async () => { if (confirm('Delete this employee?')) { await fetch(`/api/employees/${employee._id}`, { method: 'DELETE' }); onSave(); onClose(); } }} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ec4561', borderRadius: '3px', background: '#ffffff', color: '#ec4561', cursor: 'pointer' }}>Delete</button>
            )}
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>Close</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}