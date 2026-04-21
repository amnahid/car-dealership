'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Sale {
  _id: string;
  saleId: string;
  carId: string;
  customerName: string;
  customerPhone: string;
  totalPrice: number;
  downPayment: number;
  monthlyPayment: number;
  tenureMonths: number;
  totalPaid: number;
  remainingAmount: number;
  status: 'Active' | 'Completed' | 'Defaulted' | 'Cancelled';
  nextPaymentDate: string;
  notes?: string;
  interestRate?: number;
}

export default function InstallmentsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalValue: 0, totalPaid: 0, totalRemaining: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [cars, setCars] = useState<{ _id: string; carId: string; brand: string; model: string; price: number }[]>([]);
  const [customers, setCustomers] = useState<{ _id: string; fullName: string; phone: string }[]>([]);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);

    try {
      const res = await fetch(`/api/sales/installments?${params}`);
      const data = await res.json();
      setSales(data.sales || []);
      setTotalPages(data.pagination?.pages || 1);
      setStats({ totalValue: data.totalValue || 0, totalPaid: data.totalPaid || 0, totalRemaining: data.totalRemaining || 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    if (showModal) {
      Promise.all([
        fetch('/api/cars?limit=100').then(r => r.json()),
        fetch('/api/customers?limit=100').then(r => r.json())
      ]).then(([carData, custData]) => {
        setCars(carData.cars?.filter((c: any) => c.status === 'In Stock') || []);
        setCustomers(custData.customers || []);
      });
    }
  }, [showModal]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this installment sale?')) return;
    try {
      const res = await fetch(`/api/sales/installments/${id}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); alert(data.error || 'Failed'); return; }
      fetchSales();
    } catch (err) { console.error(err); }
  };

  const handleUpdateSale = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/sales/installments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const resData = await res.json(); alert(resData.error || 'Failed'); return; }
      setEditingSale(null);
      fetchSales();
    } catch (err) { console.error(err); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#28aaa9';
      case 'Completed': return '#42ca7f';
      case 'Defaulted': return '#ec4561';
      default: return '#9ca8b3';
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 className="page-title">Installment Sales</h2>
        <button onClick={() => setShowModal(true)} style={{ background: '#28aaa9', color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: '1px solid #28aaa9', cursor: 'pointer' }}>
          + New Installment Sale
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#9ca8b3', margin: 0 }}>Total Value</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#28aaa9', margin: '8px 0 0' }}>${stats.totalValue.toLocaleString()}</p>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#9ca8b3', margin: 0 }}>Total Paid</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#42ca7f', margin: '8px 0 0' }}>${stats.totalPaid.toLocaleString()}</p>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#9ca8b3', margin: 0 }}>Remaining</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#ec4561', margin: '8px 0 0' }}>${stats.totalRemaining.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <input type="text" placeholder="Search by customer, car ID..." value={search} onChange={(e) => handleSearch(e.target.value)} style={{ width: '250px', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Defaulted">Defaulted</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
        ) : sales.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No installment sales found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '900px' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  {['Sale ID', 'Car', 'Customer', 'Total', 'Down Payment', 'Monthly', 'Tenure', 'Paid', 'Remaining', 'Status', 'Next Payment', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #eee' }}>
                {sales.map((sale) => (
                  <tr key={sale._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#28aaa9' }}>{sale.saleId}</td>
                    <td style={{ padding: '12px' }}>{sale.carId}</td>
                    <td style={{ padding: '12px' }}>
                      <div>{sale.customerName}</div>
                      <div style={{ fontSize: '12px', color: '#9ca8b3' }}>{sale.customerPhone}</div>
                    </td>
                    <td style={{ padding: '12px' }}>${sale.totalPrice.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>${sale.downPayment.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>${sale.monthlyPayment.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>{sale.tenureMonths} mo</td>
                    <td style={{ padding: '12px', color: '#42ca7f' }}>${sale.totalPaid.toLocaleString()}</td>
                    <td style={{ padding: '12px', color: '#ec4561' }}>${sale.remainingAmount.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500, background: getStatusColor(sale.status) + '20', color: getStatusColor(sale.status) }}>{sale.status}</span>
                    </td>
                    <td style={{ padding: '12px', color: '#525f80' }}>{sale.nextPaymentDate ? new Date(sale.nextPaymentDate).toLocaleDateString() : '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/dashboard/sales/installments/${sale._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>View</Link>
                        {sale.status !== 'Cancelled' && (
                          <>
                            <button onClick={() => handleEdit(sale)} style={{ color: '#f8b425', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '14px' }}>Edit</button>
                            <button onClick={() => handleDelete(sale._id)} style={{ color: '#ec4561', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '14px' }}>Cancel</button>
                          </>
                        )}
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

      {showModal && <InstallmentModal cars={cars} customers={customers} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchSales(); }} />}
      {editingSale && <EditInstallmentModal sale={editingSale} onClose={() => setEditingSale(null)} onSave={handleUpdateSale} />}
    </div>
  );
}

function InstallmentModal({ cars, customers, onClose, onSave }: { cars: any[]; customers: any[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ car: '', carId: '', customer: '', customerName: '', customerPhone: '', totalPrice: '', downPayment: '', interestRate: '0', tenureMonths: '12', startDate: new Date().toISOString().split('T')[0], notes: '' });
  const [loading, setLoading] = useState(false);

  const handleCarChange = (carId: string) => {
    const car = cars.find(c => c.carId === carId);
    setForm({ ...form, car: car?._id || '', carId: carId, totalPrice: car?.purchasePrice?.toString() || '' });
  };

  const handleCustomerChange = (customerId: string) => {
    const cust = customers.find(c => c._id === customerId);
    setForm({ ...form, customer: customerId, customerName: cust?.fullName || '', customerPhone: cust?.phone || '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.car || !form.customer) { alert('Please select a car and customer'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/sales/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const data = await res.json(); alert(data.error || 'Failed'); return; }
      onSave();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>New Installment Sale</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Select Car *</label>
            <select required value={form.carId} onChange={(e) => handleCarChange(e.target.value)} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}>
              <option value="">Select a car</option>
              {cars.map(car => <option key={car._id} value={car.carId}>{car.carId} - {car.brand} {car.model}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Select Customer *</label>
            <select required value={form.customer} onChange={(e) => handleCustomerChange(e.target.value)} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}>
              <option value="">Select a customer</option>
              {customers.map(cust => <option key={cust._id} value={cust._id}>{cust.fullName} - {cust.phone}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Total Price *</label>
              <input required type="number" value={form.totalPrice} onChange={(e) => setForm({ ...form, totalPrice: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Down Payment *</label>
              <input required type="number" value={form.downPayment} onChange={(e) => setForm({ ...form, downPayment: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Interest Rate (%)</label>
              <input type="number" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Tenure (months) *</label>
              <input required type="number" value={form.tenureMonths} onChange={(e) => setForm({ ...form, tenureMonths: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Start Date *</label>
              <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? 'Saving...' : 'Create Sale'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditInstallmentModal({ sale, onClose, onSave }: { sale: Sale; onClose: () => void; onSave: (id: string, data: any) => void }) {
  const [form, setForm] = useState({
    downPayment: sale.downPayment.toString(),
    monthlyPayment: sale.monthlyPayment.toString(),
    interestRate: sale.interestRate?.toString() || '0',
    tenureMonths: sale.tenureMonths.toString(),
    notes: sale.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(sale._id, form);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '500px', maxWidth: '90%' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>Edit Installment Sale - {sale.saleId}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Down Payment</label>
              <input type="number" value={form.downPayment} onChange={(e) => setForm({ ...form, downPayment: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Monthly Payment</label>
              <input type="number" value={form.monthlyPayment} onChange={(e) => setForm({ ...form, monthlyPayment: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Interest Rate (%)</label>
              <input type="number" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Tenure (months)</label>
              <input type="number" value={form.tenureMonths} onChange={(e) => setForm({ ...form, tenureMonths: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ width: '100%', height: '80px', fontSize: '14px', borderRadius: '0', padding: '12px', border: '1px solid #ced4da' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            {sale.status !== 'Cancelled' && (
              <button type="button" onClick={async () => { if (confirm('Cancel this sale?')) { await onSave(sale._id, { ...form, status: 'Cancelled' }); onClose(); } }} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ec4561', borderRadius: '3px', background: '#ffffff', color: '#ec4561', cursor: 'pointer' }}>Cancel Sale</button>
            )}
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>Close</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}