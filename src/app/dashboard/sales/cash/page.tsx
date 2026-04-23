'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SearchableSelect from '@/components/SearchableSelect';

interface Car {
  _id: string;
  carId: string;
  brand: string;
  model: string;
  images: string[];
}

interface Customer {
  _id: string;
  fullName: string;
  phone: string;
  profilePhoto?: string;
}

interface Sale {
  _id: string;
  saleId: string;
  carId: string;
  customerName: string;
  customerPhone: string;
  salePrice: number;
  discountType?: 'flat' | 'percentage';
  discountValue?: number;
  discountAmount: number;
  finalPrice: number;
  agentName?: string;
  agentCommission?: number;
  saleDate: string;
  notes?: string;
  status?: string;
  car?: Car;
  customer?: Customer;
  zatcaStatus?: 'Pending' | 'Cleared' | 'Reported' | 'Failed' | 'NotRequired';
  invoiceType?: 'Standard' | 'Simplified';
  buyerTrn?: string;
  zatcaUUID?: string;
  zatcaQRCode?: string;
  vatAmount?: number;
  finalPriceWithVat?: number;
}

export default function CashSalesPage() {
  const searchParams = useSearchParams();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      fetch(`/api/sales/cash/${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.sale) {
            setEditingSale(data.sale);
          }
        });
    }
  }, [searchParams]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [cars, setCars] = useState<{ _id: string; carId: string; brand: string; model: string; price: number }[]>([]);
  const [customers, setCustomers] = useState<{ _id: string; fullName: string; phone: string }[]>([]);
  const [employees, setEmployees] = useState<{ _id: string; name: string; designation: string; commissionRate: number }[]>([]);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (search) params.set('search', search);

    try {
      const res = await fetch(`/api/sales/cash?${params}`);
      const data = await res.json();
      setSales(data.sales || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalRevenue(data.totalRevenue || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    if (showModal) {
      Promise.all([
        fetch('/api/cars?limit=100').then(r => r.json()),
        fetch('/api/customers?limit=100').then(r => r.json()),
        fetch('/api/employees?limit=100&active=true').then(r => r.json()),
      ]).then(([carData, custData, empData]) => {
        setCars(carData.cars?.filter((c: any) => c.status === 'In Stock') || []);
        setCustomers(custData.customers || []);
        setEmployees(empData.employees || []);
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
    if (!confirm('Are you sure you want to cancel this sale?')) return;
    try {
      const res = await fetch(`/api/sales/cash/${id}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); alert(data.error || 'Failed'); return; }
      fetchSales();
    } catch (err) { console.error(err); }
  };

  const handleUpdateSale = async (id: string, data: any) => {
    const res = await fetch(`/api/sales/cash/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const resData = await res.json(); alert(resData.error || 'Failed'); throw new Error('Failed'); }
    setEditingSale(null);
    fetchSales();
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 className="page-title">Cash Sales</h2>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: '#28aaa9', color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: '1px solid #28aaa9', cursor: 'pointer' }}
        >
          + New Cash Sale
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #28aaa9' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Total Sales</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#28aaa9', margin: '4px 0 0' }}>{sales.length}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #42ca7f' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Total Revenue</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#42ca7f', margin: '4px 0 0' }}>SAR{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f5a623' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Avg per Sale</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#f5a623', margin: '4px 0 0' }}>SAR{sales.length ? Math.round(totalRevenue / sales.length).toLocaleString() : 0}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search by customer, car ID..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: '300px', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
        ) : sales.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No sales found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '800px' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  {['Car', 'Sale ID', 'Customer', 'Amount', 'Date', 'ZATCA', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #eee' }}>
                {sales.map((sale) => (
                  <tr key={sale._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '8px', width: '60px' }}>
                      {sale.car?.images?.[0] ? (
                        <img src={sale.car.images[0]} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (
                        <div style={{ width: '50px', height: '50px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '10px', color: '#9ca8b3' }}>🚗</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#28aaa9' }}>{sale.saleId}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {sale.customer?.profilePhoto ? (
                          <img src={sale.customer.profilePhoto} alt="" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#28aaa9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                            {sale.customerName?.[0] || '?'}
                          </div>
                        )}
                        <div>
                          <div>{sale.customerName}</div>
                          <div style={{ fontSize: '12px', color: '#9ca8b3' }}>{sale.customerPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>SAR{sale.finalPrice.toLocaleString()}</td>
                    <td style={{ padding: '12px', color: '#525f80' }}>{new Date(sale.saleDate).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>
                      <ZatcaStatusBadge status={sale.zatcaStatus} saleId={sale._id} saleType="CashSale" />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/dashboard/sales/cash/${sale._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>View</Link>
                        <Link href={`/dashboard/sales/cash/${sale._id}/edit`} style={{ color: '#f8b425', textDecoration: 'none' }}>Edit</Link>
                        {sale.status === 'Active' && (
                          <button onClick={() => handleDelete(sale._id)} style={{ color: '#ec4561', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '14px' }}>Cancel</button>
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

      {showModal && <CashSaleModal cars={cars} customers={customers} employees={employees} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchSales(); }} />}
      {editingSale && <EditCashSaleModal sale={editingSale} employees={employees} onClose={() => setEditingSale(null)} onSave={handleUpdateSale} />}
    </div>
  );
}

function CashSaleModal({ cars, customers, employees, onClose, onSave }: { cars: any[]; customers: any[]; employees: any[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ car: '', carId: '', customer: '', customerName: '', customerPhone: '', salePrice: '', discountType: 'flat' as 'flat' | 'percentage', discountValue: '0', agentName: '', agentCommission: '', saleDate: new Date().toISOString().split('T')[0], notes: '', invoiceType: 'Simplified', buyerTrn: '' });
  const [agentId, setAgentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ fullName: '', phone: '', email: '', address: '' });

  const handleCarChange = (carId: string) => {
    const car = cars.find(c => c.carId === carId);
    setForm({ ...form, car: car?._id || '', carId: carId, salePrice: car?.purchasePrice?.toString() || '' });
  };

  const handleCustomerChange = (customerId: string) => {
    if (customerId === '__new__') {
      setShowCustomerModal(true);
      return;
    }
    const cust = customers.find(c => c._id === customerId);
    setForm({ ...form, customer: customerId, customerName: cust?.fullName || '', customerPhone: cust?.phone || '', invoiceType: cust?.customerType === 'Business' ? 'Standard' : 'Simplified', buyerTrn: cust?.vatRegistrationNumber || '' });
  };

  const handleAgentChange = (empId: string) => {
    setAgentId(empId);
    const emp = employees.find(e => e._id === empId);
    setForm(prev => ({ ...prev, agentName: emp?.name || '', agentCommission: emp?.commissionRate?.toString() || '' }));
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.fullName || !newCustomer.phone || !newCustomer.address) {
      alert('Please fill in required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });
      if (!res.ok) { const data = await res.json(); alert(data.error || 'Failed'); return; }
      const created = await res.json();
      setForm({ ...form, customer: created.customer?._id || created._id, customerName: newCustomer.fullName, customerPhone: newCustomer.phone, invoiceType: 'Simplified', buyerTrn: '' });
      setShowCustomerModal(false);
      setNewCustomer({ fullName: '', phone: '', email: '', address: '' });
      onSave();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.car || !form.customer) { alert('Please select a car and customer'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/sales/cash', {
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
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '500px', maxWidth: '90%' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>New Cash Sale</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <SearchableSelect
              label="Select Car *"
              value={form.carId}
              onChange={handleCarChange}
              options={cars.map(c => ({ value: c.carId, label: `${c.carId} - ${c.brand} ${c.model}` }))}
              placeholder="Search car..."
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <SearchableSelect
              label="Select Customer *"
              value={form.customer}
              onChange={handleCustomerChange}
              options={[
                { value: '__new__', label: '+ Add New Customer' },
                ...customers.map(c => ({ value: c._id, label: `${c.fullName} - ${c.phone}` }))
              ]}
              placeholder="Search customer..."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Sale Price *</label>
              <input required type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Discount</label>
              <div style={{ display: 'flex', border: '1px solid #ced4da' }}>
                <button type="button" onClick={() => setForm({ ...form, discountType: 'flat' })} style={{ padding: '0 12px', height: '40px', background: form.discountType === 'flat' ? '#28aaa9' : '#ffffff', color: form.discountType === 'flat' ? '#ffffff' : '#525f80', border: 'none', borderRight: '1px solid #ced4da', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>SAR</button>
                <button type="button" onClick={() => setForm({ ...form, discountType: 'percentage' })} style={{ padding: '0 12px', height: '40px', background: form.discountType === 'percentage' ? '#28aaa9' : '#ffffff', color: form.discountType === 'percentage' ? '#ffffff' : '#525f80', border: 'none', borderRight: '1px solid #ced4da', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>%</button>
                <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} style={{ flex: 1, height: '40px', fontSize: '14px', padding: '0 12px', border: 'none', outline: 'none' }} />
              </div>
              {form.discountType === 'percentage' && Number(form.discountValue) > 0 && Number(form.salePrice) > 0 && (
                <span style={{ fontSize: '12px', color: '#525f80' }}>= SAR {(Math.round(Number(form.salePrice) * Number(form.discountValue) / 100 * 100) / 100).toLocaleString()}</span>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Sale Date *</label>
              <input required type="date" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <SearchableSelect
                label="Sales Agent"
                value={agentId}
                onChange={handleAgentChange}
                options={[
                  { value: '', label: 'None' },
                  ...employees.map(e => ({ value: e._id, label: `${e.name}${e.designation ? ` (${e.designation})` : ''}` })),
                ]}
                placeholder="Select agent..."
              />
              {agentId && (
                <span style={{ fontSize: '12px', color: '#525f80' }}>Commission: {employees.find(e => e._id === agentId)?.commissionRate || 0}%</span>
              )}
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase', marginBottom: '8px' }}>ZATCA / Tax Invoice</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Invoice Type</label>
                <select value={form.invoiceType} onChange={(e) => setForm({ ...form, invoiceType: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}>
                  <option value="Simplified">Simplified (B2C)</option>
                  <option value="Standard">Standard (B2B)</option>
                </select>
              </div>
              {form.invoiceType === 'Standard' && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Buyer TRN</label>
                  <input value={form.buyerTrn} onChange={(e) => setForm({ ...form, buyerTrn: e.target.value })} placeholder="15-digit VAT number" style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? 'Saving...' : 'Create Sale'}</button>
          </div>
        </form>
      </div>
      
      {showCustomerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>Add Customer</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Full Name *</label>
                <input required value={newCustomer.fullName} onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} placeholder="Full Name" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Phone *</label>
                <input required value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} placeholder="Phone" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Email</label>
                <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} placeholder="Email" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Address *</label>
                <input required value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} placeholder="Address" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowCustomerModal(false)} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleAddCustomer} disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? 'Saving...' : 'Add Customer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditCashSaleModal({ sale, employees, onClose, onSave }: { sale: Sale; employees: any[]; onClose: () => void; onSave: (id: string, data: any) => void }) {
  const [form, setForm] = useState({
    salePrice: sale.salePrice.toString(),
    discountType: (sale.discountType || 'flat') as 'flat' | 'percentage',
    discountValue: (sale.discountValue ?? sale.discountAmount).toString(),
    agentName: sale.agentName || '',
    agentCommission: sale.agentCommission?.toString() || '',
    saleDate: sale.saleDate.split('T')[0],
    notes: sale.notes || '',
  });
  const [agentId, setAgentId] = useState(() => employees.find(e => e.name === sale.agentName)?._id || '');
  const [loading, setLoading] = useState(false);

  const handleAgentChange = (empId: string) => {
    setAgentId(empId);
    const emp = employees.find(e => e._id === empId);
    setForm(prev => ({ ...prev, agentName: emp?.name || '', agentCommission: emp?.commissionRate?.toString() || '' }));
  };

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
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>Edit Cash Sale - {sale.saleId}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Sale Price</label>
              <input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Discount</label>
              <div style={{ display: 'flex', border: '1px solid #ced4da' }}>
                <button type="button" onClick={() => setForm({ ...form, discountType: 'flat' })} style={{ padding: '0 12px', height: '40px', background: form.discountType === 'flat' ? '#28aaa9' : '#ffffff', color: form.discountType === 'flat' ? '#ffffff' : '#525f80', border: 'none', borderRight: '1px solid #ced4da', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>SAR</button>
                <button type="button" onClick={() => setForm({ ...form, discountType: 'percentage' })} style={{ padding: '0 12px', height: '40px', background: form.discountType === 'percentage' ? '#28aaa9' : '#ffffff', color: form.discountType === 'percentage' ? '#ffffff' : '#525f80', border: 'none', borderRight: '1px solid #ced4da', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>%</button>
                <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} style={{ flex: 1, height: '40px', fontSize: '14px', padding: '0 12px', border: 'none', outline: 'none' }} />
              </div>
              {form.discountType === 'percentage' && Number(form.discountValue) > 0 && Number(form.salePrice) > 0 && (
                <span style={{ fontSize: '12px', color: '#525f80' }}>= SAR {(Math.round(Number(form.salePrice) * Number(form.discountValue) / 100 * 100) / 100).toLocaleString()}</span>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Sale Date</label>
              <input type="date" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            </div>
            <div>
              <SearchableSelect
                label="Sales Agent"
                value={agentId}
                onChange={handleAgentChange}
                options={[
                  { value: '', label: 'None' },
                  ...employees.map(e => ({ value: e._id, label: `${e.name}${e.designation ? ` (${e.designation})` : ''}` })),
                ]}
                placeholder="Select agent..."
              />
              {agentId && (
                <span style={{ fontSize: '12px', color: '#525f80' }}>Commission: {employees.find(e => e._id === agentId)?.commissionRate || 0}%</span>
              )}
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ width: '100%', height: '80px', fontSize: '14px', borderRadius: '0', padding: '12px', border: '1px solid #ced4da' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            {sale.status !== 'Cancelled' && (
              <button type="button" onClick={async () => { if (confirm('Cancel this sale?')) { try { await onSave(sale._id, { status: 'Cancelled' }); onClose(); } catch (e) { /* error already shown */ } } }} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ec4561', borderRadius: '3px', background: '#ffffff', color: '#ec4561', cursor: 'pointer' }}>Cancel Sale</button>
            )}
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>Close</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
const ZATCA_BADGE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  Cleared:     { bg: '#e6f4ea', color: '#2e7d32', label: 'Cleared' },
  Reported:    { bg: '#e8f5e9', color: '#388e3c', label: 'Reported' },
  Pending:     { bg: '#fff8e1', color: '#f57c00', label: 'Pending' },
  Failed:      { bg: '#fce4ec', color: '#c62828', label: 'Failed' },
  NotRequired: { bg: '#f5f5f5', color: '#757575', label: 'N/A' },
};

function ZatcaStatusBadge({ status, saleId, saleType }: { status?: string; saleId: string; saleType: string }) {
  const [retrying, setRetrying] = useState(false);
  const s = status ? ZATCA_BADGE_COLORS[status] : ZATCA_BADGE_COLORS['NotRequired'];

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await fetch('/api/zatca/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceId: saleId, referenceType: saleType }),
      });
      window.location.reload();
    } catch { /* silent */ } finally { setRetrying(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: s.bg, color: s.color }}>
        {s.label}
      </span>
      {status === 'Failed' && (
        <button onClick={handleRetry} disabled={retrying} style={{ fontSize: '11px', color: '#28aaa9', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {retrying ? 'Retrying...' : '↺ Retry'}
        </button>
      )}
    </div>
  );
}
