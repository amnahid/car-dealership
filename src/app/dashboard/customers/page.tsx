'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import EditCustomerModal from '@/components/EditCustomerModal';
import { useDebounce } from '@/hooks/useDebounce';
import ImageUpload, { DocumentUpload } from '@/components/ImageUpload';
import { useTranslations, useLocale } from 'next-intl';

interface Customer {
  _id: string;
  customerId: string;
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  nationalIdDocument?: string;
  drivingLicenseDocument?: string;
  iqamaDocument?: string;
  profilePhoto?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  createdAt: string;
}

export default function CustomersPage() {
  const t = useTranslations('Customers');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map((c) => c._id)));
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

  const handleBulkDelete = async () => {
    if (!confirm(commonT('deleteConfirm'))) return;
    if (!confirm(commonT('deleteActionUndone'))) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/customers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        fetchCustomers();
      } else {
        const data = await res.json();
        alert(data.error || 'Bulk delete failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (debouncedSearch) params.set('search', debouncedSearch);

    try {
      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    if (!confirm(t('deleteActionUndone'))) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); alert(data.error || 'Failed'); return; }
      fetchCustomers();
    } catch (err) { console.error(err); }
  };

  const handleUpdateCustomer = async (id: string, data: Partial<Customer>) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const resData = await res.json(); alert(resData.error || 'Failed'); return; }
      setShowModal(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <h2 className="page-title">{t('title')}</h2>
        <button
          onClick={() => { setEditingCustomer(null); setShowModal(true); }}
          style={{
            background: '#28aaa9',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 500,
            padding: '10px 16px',
            borderRadius: '3px',
            textDecoration: 'none',
            border: '1px solid #28aaa9',
            cursor: 'pointer',
          }}
        >
          + {t('addNew')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: '300px',
            height: '40px',
            fontSize: '14px',
            borderRadius: '0',
            padding: '0 12px',
            border: '1px solid #ced4da',
            background: '#ffffff',
            textAlign: isRtl ? 'right' : 'left'
          }}
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
              onClick={handleBulkDelete}
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
              {commonT('deleteSelected')}
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
        ) : customers.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{t('noCustomersFound')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '800px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  <th style={{ padding: '12px', width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={customers.length > 0 && selectedIds.size === customers.length}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = selectedIds.size > 0 && selectedIds.size < customers.length;
                        }
                      }}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('customerId')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('photo')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('fullName')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('phone')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('email')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('address')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('created')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('actions')}</th>
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #eee' }}>
                {customers.map((customer) => (
                  <tr key={customer._id} style={{ borderBottom: '1px solid #f5f5f5', background: selectedIds.has(customer._id) ? '#28aaa905' : 'transparent' }}>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(customer._id)}
                        onChange={() => toggleSelect(customer._id)}
                      />
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#28aaa9' }}>{customer.customerId}</td>
                    <td style={{ padding: '12px' }}>
                      {customer.profilePhoto ? (
                        <img src={customer.profilePhoto} alt={customer.fullName} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#9ca8b3', fontWeight: 600 }}>
                          {customer.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>{customer.fullName}</td>
                    <td style={{ padding: '12px' }}>{customer.phone}</td>
                    <td style={{ padding: '12px' }}>{customer.email || '-'}</td>
                    <td style={{ padding: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.address}</td>
                    <td style={{ padding: '12px', color: '#525f80' }}>{new Date(customer.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <button
                          onClick={() => { setEditingCustomer(customer); setShowModal(true); }}
                          style={{ color: '#f8b425', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                        >
                          {commonT('edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(customer._id)}
                          style={{ color: '#ec4561', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                        >
                          {commonT('delete')}
                        </button>
                        <Link href={`/dashboard/customers/${customer._id}`} style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>
                          {commonT('view')}
                        </Link>
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
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
          >
            {commonT('prev')}
          </button>
          <span style={{ padding: '8px 12px', fontSize: '12px', color: '#525f80' }}>
            {commonT('page', { page, total: totalPages })}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
          >
            {commonT('next')}
          </button>
        </div>
      )}

      {showModal && !editingCustomer && (
        <CustomerModal
          customer={null}
          onClose={() => { setShowModal(false); setEditingCustomer(null); }}
          onSave={() => { setShowModal(false); fetchCustomers(); }}
        />
      )}

      {showModal && editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => { setShowModal(false); setEditingCustomer(null); }}
          onSave={(data) => handleUpdateCustomer(editingCustomer._id, data)}
        />
      )}
    </div>
  );
}

function CustomerModal({ customer, onClose, onSave }: { customer: Customer | null; onClose: () => void; onSave: () => void }) {
  const t = useTranslations('Customers');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [form, setForm] = useState({
    fullName: customer?.fullName || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    nationalIdDocument: customer?.nationalIdDocument || '',
    drivingLicenseDocument: customer?.drivingLicenseDocument || '',
    iqamaDocument: customer?.iqamaDocument || '',
    profilePhoto: customer?.profilePhoto || '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = customer ? `/api/customers/${customer._id}` : '/api/customers';
      const method = customer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to save');
        return;
      }

      onSave();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '600px', maxWidth: '90%', textAlign: isRtl ? 'right' : 'left' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{customer ? t('editCustomer') : t('addCustomer')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <ImageUpload value={form.profilePhoto} onChange={(url) => setForm({ ...form, profilePhoto: url })} folder="customers" label={form.fullName || t('photo')} size={80} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t('fullName')} *</label>
              <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', textAlign: isRtl ? 'right' : 'left' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t('phone')} *</label>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', textAlign: isRtl ? 'right' : 'left' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t('email')}</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', textAlign: isRtl ? 'right' : 'left' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: '#6c757d' }}>{t('nationalId')}</label>
              <DocumentUpload value={form.nationalIdDocument} onChange={(url) => setForm({ ...form, nationalIdDocument: url })} label={t('nationalId')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: '#6c757d' }}>{t('drivingLicense')}</label>
              <DocumentUpload value={form.drivingLicenseDocument} onChange={(url) => setForm({ ...form, drivingLicenseDocument: url })} label={t('drivingLicense')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: '#6c757d' }}>{t('iqama')}</label>
              <DocumentUpload value={form.iqamaDocument} onChange={(url) => setForm({ ...form, iqamaDocument: url })} label={t('iqama')} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t('address')} *</label>
            <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={{ width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', textAlign: isRtl ? 'right' : 'left' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>{commonT('cancel')}</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? commonT('loading') : commonT('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
