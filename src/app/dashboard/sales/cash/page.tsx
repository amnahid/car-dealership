'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SearchableSelect from '@/components/SearchableSelect';
import DataTransferButtons from '@/components/DataTransferButtons';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslations, useLocale } from 'next-intl';

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
  customerType?: string;
  vatRegistrationNumber?: string;
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
  const t = useTranslations('CashSales');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const searchParams = useSearchParams();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const toggleSelectAll = () => {
    const activeSales = sales.filter(s => s.status === 'Active');
    if (selectedIds.size === activeSales.length && activeSales.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeSales.map((s) => s._id)));
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

  const handleBulkCancel = async () => {
    if (!confirm(t('cancelConfirm'))) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/sales/cash/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        fetchSales();
      } else {
        const data = await res.json();
        alert(data.error || 'Bulk cancel failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const [cars, setCars] = useState<{ _id: string; carId: string; brand: string; model: string; price: number; purchasePrice?: number }[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<{ _id: string; name: string; designation: string; commissionRate: number }[]>([]);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (debouncedSearch) params.set('search', debouncedSearch);

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
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    Promise.all([
      fetch('/api/cars?limit=100').then(r => r.json()),
      fetch('/api/customers?limit=100').then(r => r.json()),
      fetch('/api/employees?limit=100&active=true').then(r => r.json()),
    ]).then(([carData, custData, empData]) => {
      setCars(carData.cars?.filter((c: any) => c.status === 'In Stock') || []);
      setCustomers(custData.customers || []);
      setEmployees(empData.employees || []);
    });
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('cancelConfirm'))) return;
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

  const formatCurrency = (val: number | undefined | null) => `SAR ${(val || 0).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}`;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className={isRtl ? 'text-right' : 'text-left'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <h2 className="page-title">{t('title')}</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <DataTransferButtons entityType="cashSales" onImportSuccess={fetchSales} />
          <button
            onClick={() => setShowModal(true)}
            style={{ background: '#28aaa9', color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: '1px solid #28aaa9', cursor: 'pointer' }}
          >
            + {t('addNew')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #28aaa9', borderRight: isRtl ? '4px solid #28aaa9' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('totalSales')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#28aaa9', margin: '4px 0 0' }}>{sales.length}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #42ca7f', borderRight: isRtl ? '4px solid #42ca7f' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('totalRevenue')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#42ca7f', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #f5a623', borderRight: isRtl ? '4px solid #f5a623' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('avgPerSale')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#f5a623', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(sales.length ? Math.round(totalRevenue / sales.length) : 0)}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: '300px', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', textAlign: isRtl ? 'right' : 'left' }}
        />
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
              onClick={handleBulkCancel}
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
              {t('cancelSale')}
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
        ) : sales.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{t('noSales')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '800px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  <th style={{ padding: '12px', width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={sales.length > 0 && sales.every(s => s.status === 'Cancelled' || selectedIds.has(s._id))}
                      ref={(input) => {
                        if (input) {
                          const activeSales = sales.filter(s => s.status === 'Active');
                          input.indeterminate = selectedIds.size > 0 && selectedIds.size < activeSales.length;
                        }
                      }}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('car')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('saleId')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('customer')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('amount')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('date')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('zatca')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('actions')}</th>
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #eee' }}>
                {sales.map((sale) => (
                  <tr key={sale._id} style={{ borderBottom: '1px solid #f5f5f5', opacity: sale.status === 'Cancelled' ? 0.5 : 1, background: selectedIds.has(sale._id) ? '#28aaa905' : 'transparent' }}>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {sale.status === 'Active' && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(sale._id)}
                          onChange={() => toggleSelect(sale._id)}
                        />
                      )}
                    </td>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        {sale.customer?.profilePhoto ? (
                          <img src={sale.customer.profilePhoto} alt="" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#28aaa9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                            {sale.customerName?.[0] || '?'}
                          </div>
                        )}
                        <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                          <div>{sale.customerName}</div>
                          <div style={{ fontSize: '12px', color: '#9ca8b3' }}>{sale.customerPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(sale.finalPrice)}</td>
                    <td style={{ padding: '12px', color: '#525f80' }}>{new Date(sale.saleDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}</td>
                    <td style={{ padding: '12px' }}>
                      <ZatcaStatusBadge status={sale.zatcaStatus} saleId={sale._id} saleType="CashSale" t={t} />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <Link href={`/dashboard/sales/cash/${sale._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>{commonT('view')}</Link>
                        <Link href={`/dashboard/sales/cash/${sale._id}/edit`} style={{ color: '#f8b425', textDecoration: 'none' }}>{commonT('edit')}</Link>
                        {sale.status === 'Active' && (
                          <button onClick={() => handleDelete(sale._id)} style={{ color: '#ec4561', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '14px' }}>{t('cancelSale')}</button>
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
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>{commonT('prev')}</button>
          <span style={{ padding: '8px 12px', fontSize: '12px', color: '#525f80' }}>{commonT('page', { page, total: totalPages })}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>{commonT('next')}</button>
        </div>
      )}

      {showModal && <CashSaleModal cars={cars} customers={customers} employees={employees} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchSales(); }} />}
      {editingSale && <EditCashSaleModal sale={editingSale} employees={employees} onClose={() => setEditingSale(null)} onSave={handleUpdateSale} />}
    </div>
  );
}

function CashSaleModal({ cars, customers, employees, onClose, onSave }: { cars: any[]; customers: Customer[]; employees: any[]; onClose: () => void; onSave: () => void }) {
  const t = useTranslations('CashSales');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

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
      alert(commonT('fillRequired'));
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
      const data = await res.json();
      const created = data.customer || data;
      setForm({ ...form, customer: created._id, customerName: newCustomer.fullName, customerPhone: newCustomer.phone, invoiceType: 'Simplified', buyerTrn: '' });
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
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '500px', maxWidth: '90%', textAlign: isRtl ? 'right' : 'left' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{t('newSale')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <SearchableSelect
              label={`${t('selectCar')} *`}
              value={form.carId}
              onChange={handleCarChange}
              options={cars.map(c => ({ value: c.carId, label: `${c.carId} - ${c.brand} ${c.model}` }))}
              placeholder={t('searchCar')}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <SearchableSelect
              label={`${t('selectCustomer')} *`}
              value={form.customer}
              onChange={handleCustomerChange}
              options={[
                { value: '__new__', label: t('addNewCustomer') },
                ...customers.map(c => ({ value: c._id, label: `${c.fullName} - ${c.phone}` }))
              ]}
              placeholder={t('searchCustomer')}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div>
              <label style={labelStyle}>{t('salePrice')} *</label>
              <input required type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('discount')}</label>
              <div style={{ display: 'flex', border: '1px solid #ced4da', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <button type="button" onClick={() => setForm({ ...form, discountType: 'flat' })} style={{ padding: '0 12px', height: '40px', background: form.discountType === 'flat' ? '#28aaa9' : '#ffffff', color: form.discountType === 'flat' ? '#ffffff' : '#525f80', border: 'none', borderRight: isRtl ? 'none' : '1px solid #ced4da', borderLeft: isRtl ? '1px solid #ced4da' : 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>SAR</button>
                <button type="button" onClick={() => setForm({ ...form, discountType: 'percentage' })} style={{ padding: '0 12px', height: '40px', background: form.discountType === 'percentage' ? '#28aaa9' : '#ffffff', color: form.discountType === 'percentage' ? '#ffffff' : '#525f80', border: 'none', borderRight: isRtl ? 'none' : '1px solid #ced4da', borderLeft: isRtl ? '1px solid #ced4da' : 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>%</button>
                <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} style={{ flex: 1, height: '40px', fontSize: '14px', padding: '0 12px', border: 'none', outline: 'none', textAlign: isRtl ? 'right' : 'left' }} />
              </div>
              {form.discountType === 'percentage' && Number(form.discountValue) > 0 && Number(form.salePrice) > 0 && (
                <span style={{ fontSize: '12px', color: '#525f80' }}>= SAR {(Math.round(Number(form.salePrice) * Number(form.discountValue) / 100 * 100) / 100).toLocaleString()}</span>
              )}
            </div>
            <div>
              <label style={labelStyle}>{t('saleDate')} *</label>
              <input required type="date" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <SearchableSelect
                label={t('salesAgent')}
                value={agentId}
                onChange={handleAgentChange}
                options={[
                  { value: '', label: t('none') },
                  ...employees.map(e => ({ value: e._id, label: `${e.name}${e.designation ? ` (${e.designation})` : ''}` })),
                ]}
                placeholder={t('selectAgent')}
              />
              {agentId && (
                <span style={{ fontSize: '12px', color: '#525f80' }}>{t('commission')}: {employees.find(e => e._id === agentId)?.commissionRate || 0}%</span>
              )}
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase', marginBottom: '8px' }}>{t('taxInvoice')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <div>
                <label style={labelStyle}>{t('invoiceType')}</label>
                <select value={form.invoiceType} onChange={(e) => setForm({ ...form, invoiceType: e.target.value })} style={inputStyle}>
                  <option value="Simplified">{t('simplified')}</option>
                  <option value="Standard">{t('standard')}</option>
                </select>
              </div>
              {form.invoiceType === 'Standard' && (
                <div>
                  <label style={labelStyle}>{t('buyerTrn')}</label>
                  <input value={form.buyerTrn} onChange={(e) => setForm({ ...form, buyerTrn: e.target.value })} placeholder={t('vatPlaceholder')} style={inputStyle} />
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>{commonT('cancel')}</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? commonT('loading') : t('createSale')}</button>
          </div>
        </form>
      </div>
      
      {showCustomerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%', textAlign: isRtl ? 'right' : 'left' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{t('addCustomer')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>{commonT('fullName')} *</label>
                <input required value={newCustomer.fullName} onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })} style={inputStyle} placeholder={commonT('fullName')} />
              </div>
              <div>
                <label style={labelStyle}>{commonT('phone')} *</label>
                <input required value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} style={inputStyle} placeholder={commonT('phone')} />
              </div>
              <div>
                <label style={labelStyle}>{commonT('email')}</label>
                <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} style={inputStyle} placeholder={commonT('email')} />
              </div>
              <div>
                <label style={labelStyle}>{commonT('address')} *</label>
                <input required value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} style={inputStyle} placeholder={commonT('address')} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <button type="button" onClick={() => setShowCustomerModal(false)} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>{commonT('cancel')}</button>
              <button type="button" onClick={handleAddCustomer} disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? commonT('loading') : t('addCustomer')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditCashSaleModal({ sale, employees, onClose, onSave }: { sale: Sale; employees: any[]; onClose: () => void; onSave: (id: string, data: any) => void }) {
  const t = useTranslations('CashSales');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

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
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '500px', maxWidth: '90%', textAlign: isRtl ? 'right' : 'left' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{t('editSale', { id: sale.saleId })}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div>
              <label style={labelStyle}>{t('salePrice')}</label>
              <input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('discount')}</label>
              <div style={{ display: 'flex', border: '1px solid #ced4da', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <button type="button" onClick={() => setForm({ ...form, discountType: 'flat' })} style={{ padding: '0 12px', height: '40px', background: form.discountType === 'flat' ? '#28aaa9' : '#ffffff', color: form.discountType === 'flat' ? '#ffffff' : '#525f80', border: 'none', borderRight: isRtl ? 'none' : '1px solid #ced4da', borderLeft: isRtl ? '1px solid #ced4da' : 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>SAR</button>
                <button type="button" onClick={() => setForm({ ...form, discountType: 'percentage' })} style={{ padding: '0 12px', height: '40px', background: form.discountType === 'percentage' ? '#28aaa9' : '#ffffff', color: form.discountType === 'percentage' ? '#ffffff' : '#525f80', border: 'none', borderRight: isRtl ? 'none' : '1px solid #ced4da', borderLeft: isRtl ? '1px solid #ced4da' : 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>%</button>
                <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} style={{ flex: 1, height: '40px', fontSize: '14px', padding: '0 12px', border: 'none', outline: 'none', textAlign: isRtl ? 'right' : 'left' }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>{t('saleDate')}</label>
              <input type="date" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <SearchableSelect
                label={t('salesAgent')}
                value={agentId}
                onChange={handleAgentChange}
                options={[
                  { value: '', label: t('none') },
                  ...employees.map(e => ({ value: e._id, label: `${e.name}${e.designation ? ` (${e.designation})` : ''}` })),
                ]}
                placeholder={t('selectAgent')}
              />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{commonT('description')}</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: '80px', padding: '12px' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            {sale.status !== 'Cancelled' && (
              <button type="button" onClick={async () => { if (confirm(t('cancelConfirm'))) { try { await onSave(sale._id, { status: 'Cancelled' }); onClose(); } catch (e) { /* error already shown */ } } }} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ec4561', borderRadius: '3px', background: '#ffffff', color: '#ec4561', cursor: 'pointer' }}>{t('cancelSale')}</button>
            )}
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>{commonT('close')}</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? commonT('loading') : commonT('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ZatcaStatusBadge({ status, saleId, saleType, t }: { status?: string; saleId: string; saleType: string; t: any }) {
  const [retrying, setRetrying] = useState(false);
  
  const ZATCA_BADGE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
    Cleared:     { bg: '#e6f4ea', color: '#2e7d32', label: 'Cleared' },
    Reported:    { bg: '#e8f5e9', color: '#388e3c', label: 'Reported' },
    Pending:     { bg: '#fff8e1', color: '#f57c00', label: 'Pending' },
    Failed:      { bg: '#fce4ec', color: '#c62828', label: 'Failed' },
    NotRequired: { bg: '#f5f5f5', color: '#757575', label: 'N/A' },
  };
  
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
