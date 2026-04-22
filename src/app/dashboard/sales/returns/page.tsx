'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Sale {
  id: string;
  saleId: string;
  type: string;
  carId: string;
  car?: { brand: string; model: string; images: string[] };
  customerName: string;
  customerPhone: string;
  totalPrice: number;
  status: string;
}

interface PurchaseReturn {
  _id: string;
  returnId: string;
  originalSaleId: string;
  saleType: 'Cash' | 'Installment' | 'Rental';
  carId: string;
  customerName: string;
  customerPhone: string;
  originalPrice: number;
  refundAmount: number;
  penaltyAmount: number;
  returnDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  car?: { _id: string; carId: string; brand: string; model: string; images: string[] };
  customer?: { _id: string; fullName: string; phone: string; profilePhoto?: string };
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ totalRefunds: 0, totalPenalty: 0, count: 0 });
  const [showModal, setShowModal] = useState(false);
  const [availableSales, setAvailableSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [formData, setFormData] = useState({
    originalSaleId: '',
    saleType: 'Installment',
    refundAmount: '',
    penaltyAmount: '0',
    returnDate: '',
    notes: '',
  });

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);

    try {
      const res = await fetch(`/api/sales/returns?${params}`);
      const data = await res.json();
      setReturns(data.returns || []);
      setStats(data.stats || { totalRefunds: 0, totalPenalty: 0, count: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchAvailableSales = async (type: string) => {
    try {
      const res = await fetch(`/api/sales/available?type=${type}`);
      const data = await res.json();
      setAvailableSales(data.sales || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  useEffect(() => {
    if (showModal) {
      fetchAvailableSales(formData.saleType);
      setSelectedSale(null);
      setFormData(prev => ({ ...prev, originalSaleId: '' }));
    }
  }, [showModal, formData.saleType]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSaleSelect = (saleId: string) => {
    const sale = availableSales.find(s => s.saleId === saleId);
    setSelectedSale(sale || null);
    setFormData(prev => ({ 
      ...prev, 
      originalSaleId: saleId,
      refundAmount: sale ? sale.totalPrice.toString() : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;

    try {
      const payload = {
        ...formData,
        carId: selectedSale.carId,
        customerName: selectedSale.customerName,
        customerPhone: selectedSale.customerPhone,
        originalPrice: selectedSale.totalPrice,
      };
      const res = await fetch('/api/sales/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          originalSaleId: '',
          saleType: 'Installment',
          refundAmount: '',
          penaltyAmount: '0',
          returnDate: '',
          notes: '',
        });
        setSelectedSale(null);
        fetchReturns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#f5a623';
      case 'Approved': return '#28aaa9';
      case 'Rejected': return '#ec4561';
      case 'Completed': return '#42ca7f';
      default: return '#9ca8b3';
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 className="page-title">Purchase Returns</h2>
        <button onClick={() => setShowModal(true)} style={{ background: '#28aaa9', color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: '1px solid #28aaa9', cursor: 'pointer' }}>
          + New Return Request
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #28aaa9' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Total Returns</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#28aaa9', margin: '4px 0 0' }}>{stats.count}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #42ca7f' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Total Refunds</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#42ca7f', margin: '4px 0 0' }}>SAR{stats.totalRefunds.toLocaleString()}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f5a623' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Penalty Amount</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#f5a623', margin: '4px 0 0' }}>SAR{stats.totalPenalty.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <input type="text" placeholder="Search by customer, car ID..." value={search} onChange={(e) => handleSearch(e.target.value)} style={{ width: '250px', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
        ) : returns.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No purchase returns found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '800px' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  {['Car', 'Return ID', 'Customer', 'Original Sale', 'Refund', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #eee' }}>
                {returns.map((ret) => (
                  <tr key={ret._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '8px', width: '60px' }}>
                      {ret.car?.images?.[0] ? (
                        <img src={ret.car.images[0]} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (
                        <div style={{ width: '50px', height: '50px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '10px', color: '#9ca8b3' }}>🚗</span></div>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#28aaa9' }}>{ret.returnId}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {ret.customer?.profilePhoto ? (
                          <img src={ret.customer.profilePhoto} alt="" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#28aaa9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 600 }}>{ret.customerName?.[0] || '?'}</div>
                        )}
                        <div>
                          <div>{ret.customerName}</div>
                          <div style={{ fontSize: '12px', color: '#9ca8b3' }}>{ret.customerPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div>{ret.originalSaleId}</div>
                      <div style={{ fontSize: '12px', color: '#9ca8b3' }}>{ret.saleType}</div>
                    </td>
                    <td style={{ padding: '12px', color: '#42ca7f', fontWeight: 600 }}>SAR{ret.refundAmount.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500, background: getStatusColor(ret.status) + '20', color: getStatusColor(ret.status) }}>{ret.status}</span>
                    </td>
                    <td style={{ padding: '12px', color: '#525f80' }}>{ret.returnDate ? new Date(ret.returnDate).toLocaleDateString() : '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/dashboard/sales/returns/${ret._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>View</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '4px', width: '500px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>New Purchase Return</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>Sale Type</label>
                <select value={formData.saleType} onChange={(e) => setFormData({ ...formData, saleType: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} required>
                  <option value="Cash">Cash Sale</option>
                  <option value="Installment">Installment Sale</option>
                  <option value="Rental">Rental</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>Select Sale</label>
                <select value={formData.originalSaleId} onChange={(e) => handleSaleSelect(e.target.value)} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} required>
                  <option value="">-- Select a sale --</option>
                  {availableSales.map((sale) => (
                    <option key={sale.saleId} value={sale.saleId}>
                      {sale.saleId} - {sale.carId} - {sale.customerName} (SAR{sale.totalPrice.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSale && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '4px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Selected Sale Details</div>
                  <div style={{ fontSize: '13px', color: '#525f80', display: 'grid', gap: '4px' }}>
                    <div><strong>Car:</strong> {selectedSale.carId} - {selectedSale.car?.brand} {selectedSale.car?.model}</div>
                    <div><strong>Customer:</strong> {selectedSale.customerName} ({selectedSale.customerPhone})</div>
                    <div><strong>Price:</strong> SAR{selectedSale.totalPrice.toLocaleString()}</div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>Refund Amount</label>
                <input type="number" value={formData.refundAmount} onChange={(e) => setFormData({ ...formData, refundAmount: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} required />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>Penalty Amount (Optional)</label>
                <input type="number" value={formData.penaltyAmount} onChange={(e) => setFormData({ ...formData, penaltyAmount: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>Return Date</label>
                <input type="date" value={formData.returnDate} onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} required />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} style={{ width: '100%', height: '80px', fontSize: '14px', borderRadius: '0', padding: '8px 12px', border: '1px solid #ced4da' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#fff', color: '#525f80', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: '1px solid #ced4da', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={!selectedSale} style={{ background: selectedSale ? '#28aaa9' : '#ccc', color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: '1px solid #28aaa9', cursor: selectedSale ? 'pointer' : 'not-allowed' }}>Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}