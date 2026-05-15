'use client';

import { useState, useEffect, useCallback } from 'react';
import { PdfUpload } from '@/components/ImageUpload';
import SearchableSelect from '@/components/SearchableSelect';
import EmployeeModal from '@/components/forms/EmployeeModal';
import DataTransferButtons from '@/components/DataTransferButtons';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslations, useLocale } from 'next-intl';

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
  status: 'Active' | 'Completed' | 'Cancelled' | 'Overdue';
  rateType?: 'Daily' | 'Monthly';
  currentStatus?: string;
  notes?: string;
  returnDate?: string;
  actualReturnDate?: string;
  car?: { _id: string; carId: string; brand: string; model: string; images: string[]; plateNumber?: string };
  customer?: { _id: string; fullName: string; phone: string; profilePhoto?: string; customerType?: string; vatRegistrationNumber?: string };
  zatcaStatus?: 'Pending' | 'Cleared' | 'Reported' | 'Failed' | 'NotRequired';
  invoiceType?: 'Standard' | 'Simplified';
  agentName?: string;
  agentCommission?: number;
  agentCommissionType?: 'percentage' | 'flat';
  agentCommissionValue?: number;
  applyVat?: boolean;
  vatRate?: number;
  vatInclusive?: boolean;
  paidAmount?: number;
  remainingAmount?: number;
  totalAmountWithVat?: number;
  lateFee?: number;
}

export default function RentalsPage() {
  const t = useTranslations('Rentals');
  const commonT = useTranslations('Common');
  const cashT = useTranslations('CashSales');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [paymentRental, setPaymentRental] = useState<Rental | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const toggleSelectAll = () => {
    const activeRentals = rentals.filter(r => r.status === 'Active');
    if (selectedIds.size === activeRentals.length && activeRentals.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeRentals.map((r) => r._id)));
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
      const res = await fetch('/api/sales/rentals/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        fetchRentals();
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

  const [cars, setCars] = useState<{ _id: string; carId: string; brand: string; model: string; purchasePrice?: number }[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<{ _id: string; name: string; designation: string; commissionRate: number }[]>([]);

  const fetchRentals = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (statusFilter) params.set('status', statusFilter);
    if (dateRange.startDate) params.set('startDate', dateRange.startDate);
    if (dateRange.endDate) params.set('endDate', dateRange.endDate);

    try {
      const res = await fetch(`/api/sales/rentals?${params}`, { cache: 'no-store' });
      const data = await res.json();
      setRentals(data.rentals || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalRevenue(data.totalRevenue || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, dateRange]);

  const fetchCars = useCallback(async () => {
    try {
      const res = await fetch('/api/cars?limit=100', { cache: 'no-store' });
      const data = await res.json();
      setCars(data.cars || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers?limit=100', { cache: 'no-store' });
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees?limit=100&active=true&department=Sales', { cache: 'no-store' });
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateRange]);

  useEffect(() => {
    fetchCars();
    fetchCustomers();
    fetchEmployees();
  }, [fetchCars, fetchCustomers, fetchEmployees]);


  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('cancelConfirm'))) return;
    try {
      const res = await fetch(`/api/sales/rentals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      if (!res.ok) { const data = await res.json(); alert(data.error || 'Failed'); return; }
      fetchRentals();
    } catch (err) { console.error(err); }
  };

  const handleUpdateRental = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/sales/rentals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) { alert(resData.error || 'Failed'); return; }
      
      if (resData.isPending) {
        alert(resData.message || 'Edit request submitted for admin approval');
      }

      setEditingRental(null);
      fetchRentals();
    } catch (err) { console.error(err); }
  };

  const getStatusLabel = (status: string) => {
    const key = status.toLowerCase();
    return t(`statuses.${key}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#28aaa9';
      case 'Overdue': return '#ec4561';
      case 'Completed': return '#42ca7f';
      case 'Cancelled': return '#9ca8b3';
      default: return '#9ca8b3';
    }
  };

  const formatCurrency = (val: number | undefined | null) => `SAR ${(val || 0).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}`;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className={isRtl ? 'text-right' : 'text-left'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <h2 className="page-title">{t('title')}</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <DataTransferButtons entityType="rentals" onImportSuccess={fetchRentals} />
          <button onClick={() => setShowModal(true)} style={{ background: '#28aaa9', color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: '1px solid #28aaa9', cursor: 'pointer' }}>
            + {t('addNew')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #28aaa9', borderRight: isRtl ? '4px solid #28aaa9' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('totalRentals')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#28aaa9', margin: '4px 0 0' }}>{rentals.length}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #42ca7f', borderRight: isRtl ? '4px solid #42ca7f' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{cashT('totalRevenue')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#42ca7f', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #f5a623', borderRight: isRtl ? '4px solid #f5a623' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('active')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#f5a623', margin: '4px 0 0' }}>{rentals.filter(r => r.status === 'Active').length}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <input type="text" placeholder={cashT('searchPlaceholder')} value={search} onChange={(e) => handleSearch(e.target.value)} style={{ width: '300px', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', textAlign: isRtl ? 'right' : 'left' }} />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', textAlign: isRtl ? 'right' : 'left' }}>
          <option value="">{cashT('allStatus')}</option>
          <option value="Active">{t('statuses.active')}</option>
          <option value="Overdue">{t('statuses.overdue')}</option>
          <option value="Completed">{t('statuses.completed')}</option>
          <option value="Cancelled">{t('statuses.cancelled')}</option>
        </select>
        <DateRangeFilter onChange={(start, end) => setDateRange({ startDate: start, endDate: end })} />
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
              {t('cancelRental')}
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
        ) : rentals.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{t('noRentals')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '800px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  <th style={{ padding: '12px', width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={rentals.length > 0 && rentals.every(r => r.status === 'Cancelled' || selectedIds.has(r._id))}
                      ref={(input) => {
                        if (input) {
                          const activeRentals = rentals.filter(r => r.status === 'Active');
                          input.indeterminate = selectedIds.size > 0 && selectedIds.size < activeRentals.length;
                        }
                      }}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('car')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('plateNo')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('rentalId')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('customer')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('total')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('paid')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('remaining')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('lateFee') || 'Late Fee'}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('status')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{cashT('zatca')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('actions')}</th>
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #eee' }}>
                {rentals.map((rental) => (
                  <tr key={rental._id} style={{ borderBottom: '1px solid #f5f5f5', opacity: rental.status === 'Cancelled' ? 0.5 : 1, background: selectedIds.has(rental._id) ? '#28aaa905' : 'transparent' }}>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {rental.status === 'Active' && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(rental._id)}
                          onChange={() => toggleSelect(rental._id)}
                        />
                      )}
                    </td>
                    <td style={{ padding: '8px', width: '60px' }}>
                      {rental.car?.images?.[0] ? (
                        <img src={rental.car.images[0]} alt="" style={{ width: '50px', height: '50px', objectFit: 'contain', background: '#f8f9fa', borderRadius: '4px' }} />
                      ) : (
                        <div style={{ width: '50px', height: '50px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '10px', color: '#9ca8b3' }}>🚗</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 500, color: '#525f80' }}>{rental.car?.plateNumber || '-'}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#28aaa9' }}>{rental.rentalId}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        {rental.customer?.profilePhoto ? (
                          <img src={rental.customer.profilePhoto} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain', background: '#f8f9fa', borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#28aaa9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                            {rental.customerName?.[0] || '?'}
                          </div>
                        )}
                        <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                          <div>{rental.customerName}</div>
                          <div style={{ fontSize: '12px', color: '#9ca8b3' }}>{rental.customerPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(rental.totalAmountWithVat || rental.totalAmount)}</td>
                    <td style={{ padding: '12px', color: '#42ca7f', fontWeight: 500, textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(rental.paidAmount || 0)}</td>
                    <td style={{ padding: '12px', color: (rental.remainingAmount || 0) > 0 ? '#ec4561' : '#9ca8b3', fontWeight: 500, textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(rental.remainingAmount || 0)}</td>
                    <td style={{ padding: '12px', color: (rental.lateFee || 0) > 0 ? '#ec4561' : '#9ca8b3', fontWeight: 500, textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(rental.lateFee || 0)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500, background: getStatusColor(rental.currentStatus || rental.status) + '20', color: getStatusColor(rental.currentStatus || rental.status) }}>{getStatusLabel(rental.currentStatus || rental.status)}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <ZatcaStatusBadge status={rental.zatcaStatus} saleId={rental._id} saleType="Rental" t={cashT} />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center' }}>
                        <a href={`/dashboard/sales/rentals/${rental._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>{commonT('view')}</a>
                        {rental.status !== 'Cancelled' && (
                          <button onClick={() => setPaymentRental(rental)} style={{ color: '#42ca7f', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '14px' }}>{t('recordPayment')}</button>
                        )}
                        <button onClick={() => setEditingRental(rental)} style={{ color: '#f8b425', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '14px' }}>{commonT('edit')}</button>
                        {rental.status !== 'Cancelled' && (
                          <button onClick={() => handleDelete(rental._id)} style={{ color: '#ec4561', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '14px' }}>{t('cancelRental')}</button>
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

      {showModal && (
        <RentalModal 
          cars={cars} 
          customers={customers} 
          employees={employees} 
          fetchCustomers={fetchCustomers} 
          fetchEmployees={fetchEmployees}
          onClose={() => setShowModal(false)} 
          onSave={() => { setShowModal(false); fetchRentals(); }} 
        />
      )}
      {editingRental && (
        <EditRentalModal 
          rental={editingRental} 
          employees={employees} 
          fetchEmployees={fetchEmployees}
          onClose={() => setEditingRental(null)} 
          onSave={handleUpdateRental} 
        />
      )}
      {paymentRental && (
        <RecordPaymentModal
          rental={paymentRental}
          onClose={() => setPaymentRental(null)}
          onSave={() => {
            setPaymentRental(null);
            fetchRentals();
          }}
        />
      )}
    </div>
  );
}

function RecordPaymentModal({ rental, onClose, onSave }: { rental: any; onClose: () => void; onSave: () => void }) {
  const t = useTranslations('Rentals');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [form, setForm] = useState({
    amount: rental.remainingAmount?.toString() || '',
    method: 'Cash',
    reference: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/sales/rentals/${rental._id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        onSave();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setLoading(false);
    }
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
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%', textAlign: isRtl ? 'right' : 'left' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{t('recordPayment')}</h3>
        <p style={{ fontSize: '14px', color: '#525f80', marginBottom: '20px' }}>
          {rental.rentalId} - {rental.customerName}<br />
          <strong>{t('remaining')}: {rental.remainingAmount?.toLocaleString()} SAR</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{t('amount')} *</label>
            <input required type="number" step="any" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{t('paymentMethod')}</label>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} style={inputStyle}>
              <option value="Cash">{t('cash')}</option>
              <option value="Bank">{t('bank')}</option>
              <option value="Online">{t('online')}</option>
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{t('paymentReference')}</label>
            <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{t('date')}</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>{t('notes')}</label>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <button type="button" onClick={onClose} style={{ background: '#fff', color: '#525f80', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: '1px solid #ced4da', cursor: 'pointer' }}>{commonT('cancel')}</button>
            <button type="submit" disabled={loading} style={{ background: '#28aaa9', color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '10px 16px', borderRadius: '3px', border: '1px solid #28aaa9', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? commonT('loading') : t('recordPayment')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RentalModal({ cars, customers, employees, fetchCustomers, fetchEmployees, onClose, onSave }: { cars: any[]; customers: any[]; employees: any[]; fetchCustomers: () => void; fetchEmployees: () => void; onClose: () => void; onSave: () => void }) {
  const t = useTranslations('Rentals');
  const commonT = useTranslations('Common');
  const cashT = useTranslations('CashSales');
  const customersT = useTranslations('Customers');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [form, setForm] = useState({
    car: '',
    carId: '',
    customer: '',
    customerName: '',
    customerPhone: '',
    startDate: '',
    endDate: '',
    dailyRate: '',
    securityDeposit: '0',
    notes: '',
    lateFee: '0',
    agreementDocument: '',
    invoiceType: 'Simplified',
    buyerTrn: '',
    agentName: '',
    agentCommission: '',
    agentCommissionType: 'percentage' as 'percentage' | 'flat',
    agentCommissionValue: '',
    tafweedAuthorizedTo: '',
    tafweedDriverIqama: '',
    tafweedExpiryDate: '',
    tafweedDurationMonths: '12',
    calculateVat: true,
    vatInclusive: false,
    rateType: 'Daily',
    advancePayment: '0',
    paymentMethod: 'Cash',
    paymentReference: '',
  });
  const [agentId, setAgentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ fullName: '', phone: '', email: '', passportNumber: '', passportExpiryDate: '', buildingNumber: '', streetName: '', district: '', city: '', postalCode: '', countryCode: 'SA' });

  const handleCarChange = (carId: string) => {
    setForm({ ...form, car: cars.find(c => c.carId === carId)?._id || '', carId });
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
    if (empId === '__new_agent__') {
      setShowAgentModal(true);
      return;
    }
    setAgentId(empId);
    const emp = employees.find(e => e._id === empId);
    setForm(prev => ({ 
      ...prev, 
      agentName: emp?.name || '', 
      agentCommissionType: 'percentage',
      agentCommissionValue: emp?.commissionRate?.toString() || '' 
    }));
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.fullName || !newCustomer.phone || !newCustomer.passportNumber || !newCustomer.passportExpiryDate) {
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
      setNewCustomer({ fullName: '', phone: '', email: '', passportNumber: '', passportExpiryDate: '', buildingNumber: '', streetName: '', district: '', city: '', postalCode: '', countryCode: 'SA' });
      fetchCustomers();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const calculateTotal = () => {
    if (!form.startDate || !form.endDate || !form.dailyRate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (form.rateType === 'Monthly') {
      const months = Math.ceil(days / 30);
      return months * parseFloat(form.dailyRate || '0');
    }
    
    return days * parseFloat(form.dailyRate || '0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.car || !form.customer || !form.startDate || !form.endDate) { alert('Please fill required fields'); return; }
    setLoading(true);
    try {
      const totalAmount = calculateTotal();
      const commValue = parseFloat(form.agentCommissionValue) || 0;
      const calculatedCommission = form.agentCommissionType === 'percentage'
        ? (totalAmount * commValue / 100)
        : commValue;

      const payload = {
        ...form,
        totalAmount,
        agentCommission: calculatedCommission,
        applyVat: form.calculateVat,
        vatRate: form.calculateVat ? 15 : 0,
        vatInclusive: form.calculateVat ? form.vatInclusive : false,
      };
      const res = await fetch('/api/sales/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflow: 'auto', textAlign: isRtl ? 'right' : 'left' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{t('newRental')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <SearchableSelect
              label={`${t('car')} *`}
              value={form.carId}
              onChange={handleCarChange}
              options={cars.map(c => ({ 
                value: c.carId, 
                label: `${c.brand} ${c.model} (${c.year})${c.plateNumber ? ` - ${c.plateNumber}` : ` - ${c.carId}`}${c.color ? ` - ${c.color}` : ''}`
              }))}
              placeholder={cashT('searchCar')}
              required
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <SearchableSelect
              label={`${cashT('selectCustomer')} *`}
              value={form.customer}
              onChange={handleCustomerChange}
              options={[
                { value: '__new__', label: cashT('addNewCustomer') },
                ...customers.map(c => ({ value: c._id, label: `${c.fullName} - ${c.phone}` })),
              ]}
              placeholder={cashT('searchCustomer')}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div>
              <label style={labelStyle}>{t('startDate')} *</label>
              <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('endDate')} *</label>
              <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('rateType')} *</label>
              <select value={form.rateType} onChange={(e) => setForm({ ...form, rateType: e.target.value as 'Daily' | 'Monthly' })} style={inputStyle}>
                <option value="Daily">{t('daily')}</option>
                <option value="Monthly">{t('monthly')}</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{form.rateType === 'Monthly' ? t('monthlyRate') : t('dailyRate')} *</label>
              <input required type="number" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('securityDeposit')}</label>
              <input type="number" value={form.securityDeposit} onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('lateFee')}</label>
              <input type="number" value={form.lateFee} onChange={(e) => setForm({ ...form, lateFee: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase', marginBottom: '8px' }}>{t('advancePayment')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <div>
                <label style={labelStyle}>{t('amount')}</label>
                <input type="number" value={form.advancePayment} onChange={(e) => setForm({ ...form, advancePayment: e.target.value })} style={inputStyle} placeholder="0" />
              </div>
              <div>
                <label style={labelStyle}>{t('paymentMethod')}</label>
                <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} style={inputStyle}>
                  <option value="Cash">{t('cash')}</option>
                  <option value="Bank">{t('bank')}</option>
                  <option value="Online">{t('online')}</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t('paymentReference')}</label>
                <input value={form.paymentReference} onChange={(e) => setForm({ ...form, paymentReference: e.target.value })} style={inputStyle} placeholder="Ref #" />
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase', marginBottom: '8px' }}>{t('agreementDoc')}</div>
            <PdfUpload value={form.agreementDocument} onChange={(url) => setForm({ ...form, agreementDocument: url })} label={t('agreementDoc')} />
          </div>
          {form.startDate && form.endDate && form.dailyRate && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '4px' }}>
              <p style={{ margin: 0, fontSize: '14px' }}>{commonT('total')}: <strong>SAR {calculateTotal().toLocaleString()}</strong></p>
            </div>
          )}
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase', marginBottom: '8px' }}>{cashT('salesAgent')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <div>
                <SearchableSelect
                  label={cashT('salesAgent')}
                  value={agentId}
                  onChange={handleAgentChange}
                  options={[
                    { value: '', label: cashT('none') },
                    { value: '__new_agent__', label: cashT('addNewAgent') },
                    ...employees.map(e => ({ value: e._id, label: `${e.name}${e.designation ? ` (${e.designation})` : ''}` })),
                  ]}
                  placeholder={cashT('selectAgent')}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>{commonT('commissionType')}</label>
                  <select
                    value={form.agentCommissionType}
                    onChange={(e) => setForm({ ...form, agentCommissionType: e.target.value as 'percentage' | 'flat' })}
                    style={inputStyle}
                  >
                    <option value="percentage">{commonT('percentage')}</option>
                    <option value="flat">{commonT('flatAmount')}</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>
                    {form.agentCommissionType === 'percentage' ? commonT('commissionValue') + ' (%)' : commonT('commissionValue') + ' (SAR)'}
                  </label>
                  <input
                    type="number"
                    value={form.agentCommissionValue}
                    onChange={(e) => setForm({ ...form, agentCommissionValue: e.target.value })}
                    style={inputStyle}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase', marginBottom: '8px' }}>{cashT('taxInvoice')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', direction: isRtl ? 'rtl' : 'ltr', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setForm({ ...form, calculateVat: !form.calculateVat })}>
                <input type="checkbox" checked={form.calculateVat} onChange={() => {}} style={{ cursor: 'pointer' }} />
                <span style={{ fontSize: '13px', color: '#2a3142' }}>{isRtl ? 'حساب ضريبة القيمة المضافة (15%)' : 'Calculate 15% VAT'}</span>
              </div>
              {form.calculateVat && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setForm({ ...form, vatInclusive: !form.vatInclusive })}>
                  <input type="checkbox" checked={form.vatInclusive} onChange={() => {}} style={{ cursor: 'pointer' }} />
                  <span style={{ fontSize: '13px', color: '#2a3142' }}>{isRtl ? 'السعر شامل الضريبة' : 'Price is VAT Inclusive'}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', direction: isRtl ? 'rtl' : 'ltr' }}>

              <div>
                <label style={labelStyle}>{cashT('invoiceType')}</label>
                <select value={form.invoiceType} onChange={(e) => setForm({ ...form, invoiceType: e.target.value })} style={inputStyle}>
                  <option value="Simplified">{cashT('simplified')}</option>
                  <option value="Standard">{cashT('standard')}</option>
                </select>
              </div>
              {form.invoiceType === 'Standard' && (
                <div>
                  <label style={labelStyle}>{cashT('buyerTrn')}</label>
                  <input value={form.buyerTrn} onChange={(e) => setForm({ ...form, buyerTrn: e.target.value })} placeholder={cashT('vatPlaceholder')} style={inputStyle} />
                </div>
              )}
            </div>
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase', marginBottom: '8px' }}>Vehicle Authorization (Tafweed) *</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Driver&apos;s Full Name</label>
              <input value={form.tafweedAuthorizedTo} onChange={(e) => setForm({ ...form, tafweedAuthorizedTo: e.target.value })} style={inputStyle} placeholder="Leave blank to use customer name" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Driver&apos;s Iqama Number *</label>
                <input value={form.tafweedDriverIqama} onChange={(e) => setForm({ ...form, tafweedDriverIqama: e.target.value })} style={inputStyle} placeholder="Driver&apos;s Iqama" required />
              </div>
              <div>
                <label style={labelStyle}>Tafweed Expiration Date *</label>
                <input type="date" value={form.tafweedExpiryDate} onChange={(e) => setForm({ ...form, tafweedExpiryDate: e.target.value })} style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Authorization Duration (Months) *</label>
                <input type="number" min="1" value={form.tafweedDurationMonths} onChange={(e) => setForm({ ...form, tafweedDurationMonths: e.target.value })} style={inputStyle} required />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>{commonT('cancel')}</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? commonT('loading') : t('createRental')}</button>
          </div>
        </form>
        
        {showCustomerModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%', textAlign: isRtl ? 'right' : 'left' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{cashT('addCustomer')}</h3>
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
                  <label style={labelStyle}>{commonT('passportNumber')} *</label>
                  <input required value={newCustomer.passportNumber} onChange={(e) => setNewCustomer({ ...newCustomer, passportNumber: e.target.value })} style={inputStyle} placeholder={commonT('passportNumber')} />
                </div>
                <div>
                  <label style={labelStyle}>{commonT('passportExpiryDate')} *</label>
                  <input required type="date" value={newCustomer.passportExpiryDate} onChange={(e) => setNewCustomer({ ...newCustomer, passportExpiryDate: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{customersT('buildingNumber')}</label>
                  <input value={newCustomer.buildingNumber} onChange={(e) => setNewCustomer({ ...newCustomer, buildingNumber: e.target.value })} style={inputStyle} placeholder={customersT('buildingNumber')} />
                </div>
                <div>
                  <label style={labelStyle}>{customersT('streetName')}</label>
                  <input value={newCustomer.streetName} onChange={(e) => setNewCustomer({ ...newCustomer, streetName: e.target.value })} style={inputStyle} placeholder={customersT('streetName')} />
                </div>
                <div>
                  <label style={labelStyle}>{customersT('district')}</label>
                  <input value={newCustomer.district} onChange={(e) => setNewCustomer({ ...newCustomer, district: e.target.value })} style={inputStyle} placeholder={customersT('district')} />
                </div>
                <div>
                  <label style={labelStyle}>{customersT('city')}</label>
                  <input value={newCustomer.city} onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })} style={inputStyle} placeholder={customersT('city')} />
                </div>
                <div>
                  <label style={labelStyle}>{customersT('postalCode')}</label>
                  <input value={newCustomer.postalCode} onChange={(e) => setNewCustomer({ ...newCustomer, postalCode: e.target.value })} style={inputStyle} placeholder={customersT('postalCode')} />
                </div>
                </div>              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <button type="button" onClick={() => setShowCustomerModal(false)} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>{commonT('cancel')}</button>
                <button type="button" onClick={handleAddCustomer} disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? commonT('loading') : cashT('addCustomer')}</button>
              </div>
            </div>
          </div>
        )}

        {showAgentModal && (
          <EmployeeModal 
            employee={null} 
            onClose={() => setShowAgentModal(false)} 
            onSave={(newEmp) => {
              fetchEmployees();
              setShowAgentModal(false);
              if (newEmp) {
                setAgentId(newEmp._id);
                setForm(prev => ({
                  ...prev,
                  agentName: newEmp.name,
                  agentCommissionType: 'percentage',
                  agentCommissionValue: newEmp.commissionRate?.toString() || '0'
                }));
              }
            }} 
          />
        )}
      </div>
    </div>
  );
}

function EditRentalModal({ rental, employees, fetchEmployees, onClose, onSave }: { rental: Rental; employees: any[]; fetchEmployees: () => void; onClose: () => void; onSave: (id: string, data: any) => void }) {
  const t = useTranslations('Rentals');
  const commonT = useTranslations('Common');
  const cashT = useTranslations('CashSales');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [form, setForm] = useState({
    dailyRate: rental.dailyRate.toString(),
    rateType: rental.rateType || 'Daily',
    securityDeposit: rental.securityDeposit.toString(),
    returnDate: rental.returnDate?.split('T')[0] || '',
    actualReturnDate: rental.actualReturnDate?.split('T')[0] || '',
    notes: rental.notes || '',
    agentName: rental.agentName || '',
    agentCommission: rental.agentCommission?.toString() || '',
    agentCommissionType: (rental.agentCommissionType || 'flat') as 'percentage' | 'flat',
    agentCommissionValue: (rental.agentCommissionValue || rental.agentCommission || 0).toString(),
    calculateVat: rental.applyVat ?? ((rental.vatRate || 0) > 0),
    vatInclusive: !!rental.vatInclusive,
  });
  const [agentId, setAgentId] = useState(() => employees.find(e => e.name === rental.agentName)?._id || '');
  const [loading, setLoading] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);

  const handleAgentChange = (empId: string) => {
    if (empId === '__new_agent__') {
      setShowAgentModal(true);
      return;
    }
    setAgentId(empId);
    const emp = employees.find(e => e._id === empId);
    setForm(prev => ({
      ...prev,
      agentName: emp?.name || '',
      agentCommissionType: 'percentage',
      agentCommissionValue: emp?.commissionRate?.toString() || ''
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const price = rental.totalAmount;
      const commValue = parseFloat(form.agentCommissionValue) || 0;
      const calculatedCommission = form.agentCommissionType === 'percentage'
        ? (price * commValue / 100)
        : commValue;

      const payload = {
        ...form,
        agentCommission: calculatedCommission,
        applyVat: form.calculateVat,
        vatRate: form.calculateVat ? 15 : 0,
        vatInclusive: form.calculateVat ? form.vatInclusive : false,
      };
      await onSave(rental._id, payload);
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
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{t('editRental', { id: rental.rentalId })}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div>
              <label style={labelStyle}>{t('rateType')}</label>
              <select value={form.rateType} onChange={(e) => setForm({ ...form, rateType: e.target.value as 'Daily' | 'Monthly' })} style={inputStyle}>
                <option value="Daily">{t('daily')}</option>
                <option value="Monthly">{t('monthly')}</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{form.rateType === 'Monthly' ? t('monthlyRate') : t('dailyRate')}</label>
              <input type="number" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('securityDeposit')}</label>
              <input type="number" value={form.securityDeposit} onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('returnDate')}</label>
              <input type="date" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('actualReturnDate')}</label>
              <input type="date" value={form.actualReturnDate} onChange={(e) => setForm({ ...form, actualReturnDate: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{commonT('notes')}</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: '80px', padding: '12px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setForm({ ...form, calculateVat: !form.calculateVat })}>
              <input type="checkbox" checked={form.calculateVat} onChange={() => {}} style={{ cursor: 'pointer' }} />
              <span style={{ fontSize: '13px', color: '#2a3142' }}>{isRtl ? 'حساب ضريبة القيمة المضافة (15%)' : 'Calculate 15% VAT'}</span>
            </div>
            {form.calculateVat && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setForm({ ...form, vatInclusive: !form.vatInclusive })}>
                <input type="checkbox" checked={form.vatInclusive} onChange={() => {}} style={{ cursor: 'pointer' }} />
                <span style={{ fontSize: '13px', color: '#2a3142' }}>{isRtl ? 'السعر شامل الضريبة' : 'Price is VAT Inclusive'}</span>
              </div>
            )}
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase', marginBottom: '8px' }}>{cashT('salesAgent')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <div>
                <SearchableSelect
                  label={cashT('salesAgent')}
                  value={agentId}
                  onChange={handleAgentChange}
                  options={[
                    { value: '', label: cashT('none') },
                    { value: '__new_agent__', label: cashT('addNewAgent') },
                    ...employees.map(e => ({ value: e._id, label: `${e.name}${e.designation ? ` (${e.designation})` : ''}` })),
                  ]}
                  placeholder={cashT('selectAgent')}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>{commonT('commissionType')}</label>
                  <select
                    value={form.agentCommissionType}
                    onChange={(e) => setForm({ ...form, agentCommissionType: e.target.value as 'percentage' | 'flat' })}
                    style={inputStyle}
                  >
                    <option value="percentage">{commonT('percentage')}</option>
                    <option value="flat">{commonT('flatAmount')}</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>
                    {form.agentCommissionType === 'percentage' ? commonT('commissionValue') + ' (%)' : commonT('commissionValue') + ' (SAR)'}
                  </label>
                  <input
                    type="number"
                    value={form.agentCommissionValue}
                    onChange={(e) => setForm({ ...form, agentCommissionValue: e.target.value })}
                    style={inputStyle}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            {rental.status !== 'Cancelled' && rental.status !== 'Completed' && (
              <>
                <button type="button" onClick={async () => { if (confirm(t('returnConfirm'))) { try { await onSave(rental._id, { ...form, status: 'Completed' }); onClose(); } catch (e) { /* error shown */ } } }} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #28aaa9', borderRadius: '3px', background: '#ffffff', color: '#28aaa9', cursor: 'pointer' }}>{t('returnCar')}</button>
                <button type="button" onClick={async () => { if (confirm(t('cancelConfirm'))) { try { await onSave(rental._id, { ...form, status: 'Cancelled' }); onClose(); } catch (e) { /* error shown */ } } }} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ec4561', borderRadius: '3px', background: '#ffffff', color: '#ec4561', cursor: 'pointer' }}>{t('cancelRental')}</button>
              </>
            )}
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>{commonT('close')}</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? commonT('loading') : commonT('save')}</button>
          </div>
        </form>
      </div>

      {showAgentModal && (
        <EmployeeModal 
          employee={null} 
          onClose={() => setShowAgentModal(false)} 
          onSave={(newEmp) => {
            fetchEmployees();
            setShowAgentModal(false);
            if (newEmp) {
              setAgentId(newEmp._id);
              setForm(prev => ({
                ...prev,
                agentName: newEmp.name,
                agentCommissionType: 'percentage',
                agentCommissionValue: newEmp.commissionRate?.toString() || '0'
              }));
            }
          }} 
        />
      )}
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
      {(status === 'Failed' || status === 'Pending') && (
        <button onClick={handleRetry} disabled={retrying} style={{ fontSize: '11px', color: '#28aaa9', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {retrying ? 'Retrying...' : '↺ Retry'}
        </button>
      )}
    </div>
  );
}
