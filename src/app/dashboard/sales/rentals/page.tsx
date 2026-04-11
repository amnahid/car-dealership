'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Rental {
  _id: string;
  rentalId: string;
  carId: string;
  customerName: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
  totalAmount: number;
  securityDeposit: number;
  status: 'Active' | 'Completed' | 'Cancelled';
}

export default function RentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [cars, setCars] = useState<{ _id: string; carId: string; brand: string; model: string }[]>([]);
  const [customers, setCustomers] = useState<{ _id: string; fullName: string; phone: string }[]>([]);

  const fetchRentals = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);

    try {
      const res = await fetch(`/api/sales/rentals?${params}`);
      const data = await res.json();
      setRentals(data.rentals || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalRevenue(data.totalRevenue || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#28aaa9';
      case 'Completed': return '#42ca7f';
      case 'Cancelled': return '#ec4561';
      default: return '#9ca8b3';
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 className="page-title">Rentals</h2>
        <button onClick={() => setShowModal(true)} style={{ background: '#28aaa9', color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: '1px solid #28aaa9', cursor: 'pointer' }}>
          + New Rental
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#9ca8b3', margin: 0 }}>Total Revenue</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#28aaa9', margin: '8px 0 0' }}>${totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <input type="text" placeholder="Search by customer, car ID..." value={search} onChange={(e) => handleSearch(e.target.value)} style={{ width: '250px', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
        ) : rentals.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No rentals found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '800px' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  {['Rental ID', 'Car', 'Customer', 'Start Date', 'End Date', 'Daily Rate', 'Total', 'Deposit', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #eee' }}>
                {rentals.map((rental) => (
                  <tr key={rental._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#28aaa9' }}>{rental.rentalId}</td>
                    <td style={{ padding: '12px' }}>{rental.carId}</td>
                    <td style={{ padding: '12px' }}>
                      <div>{rental.customerName}</div>
                      <div style={{ fontSize: '12px', color: '#9ca8b3' }}>{rental.customerPhone}</div>
                    </td>
                    <td style={{ padding: '12px', color: '#525f80' }}>{new Date(rental.startDate).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', color: '#525f80' }}>{new Date(rental.endDate).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>${rental.dailyRate}/day</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>${rental.totalAmount.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>${rental.securityDeposit.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500, background: getStatusColor(rental.status) + '20', color: getStatusColor(rental.status) }}>{rental.status}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <Link href={`/dashboard/sales/rentals/${rental._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>View</Link>
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

      {showModal && <RentalModal cars={cars} customers={customers} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchRentals(); }} />}
    </div>
  );
}

function RentalModal({ cars, customers, onClose, onSave }: { cars: any[]; customers: any[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ car: '', carId: '', customer: '', customerName: '', customerPhone: '', startDate: '', endDate: '', dailyRate: '', securityDeposit: '0', notes: '' });
  const [loading, setLoading] = useState(false);

  const handleCarChange = (carId: string) => {
    setForm({ ...form, car: cars.find(c => c.carId === carId)?._id || '', carId });
  };

  const handleCustomerChange = (customerId: string) => {
    const cust = customers.find(c => c._id === customerId);
    setForm({ ...form, customer: customerId, customerName: cust?.fullName || '', customerPhone: cust?.phone || '' });
  };

  const calculateTotal = () => {
    if (!form.startDate || !form.endDate || !form.dailyRate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days * parseFloat(form.dailyRate || '0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.car || !form.customer || !form.startDate || !form.endDate) { alert('Please fill required fields'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/sales/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, totalAmount: calculateTotal() }),
      });
      if (!res.ok) { const data = await res.json(); alert(data.error || 'Failed'); return; }
      onSave();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>New Rental</h3>
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
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Start Date *</label>
              <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>End Date *</label>
              <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Daily Rate *</label>
              <input required type="number" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Security Deposit</label>
              <input type="number" value={form.securityDeposit} onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
          </div>
          {form.startDate && form.endDate && form.dailyRate && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '4px' }}>
              <p style={{ margin: 0, fontSize: '14px' }}>Total: <strong>${calculateTotal().toLocaleString()}</strong></p>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? 'Saving...' : 'Create Rental'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}