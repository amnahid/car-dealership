'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import EditCustomerModal from '@/components/EditCustomerModal';
import DataTransferButtons from '@/components/DataTransferButtons';
import { useDebounce } from '@/hooks/useDebounce';
import ImageUpload, { DocumentUpload } from '@/components/ImageUpload';
import { useTranslations, useLocale } from 'next-intl';

interface Customer {
  _id: string;
  customerId: string;
  fullName: string;
  phone: string;
  email?: string;
  passportNumber?: string;
  buildingNumber: string;
  streetName: string;
  district: string;
  city: string;
  postalCode: string;
  countryCode: string;
  passportDocument?: string;
  passportExpiryDate?: string;
  drivingLicenseDocument?: string;
  iqamaDocument?: string;
  profilePhoto?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  createdAt: string;
  customerType?: 'Individual' | 'Business';
  vatRegistrationNumber?: string;
  otherId?: string;
  otherIdType?: 'CRN' | 'MOM' | 'MLSD' | 'SAGIA' | 'OTH';
  licenseExpiryDate?: string;
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
      const res = await fetch(`/api/customers?${params}`, { cache: 'no-store' });
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
      const resData = await res.json();
      if (!res.ok) { alert(resData.error || 'Failed'); return; }
      
      if (resData.isPending) {
        alert(resData.message || 'Edit request submitted for admin approval');
      }
      
      setShowModal(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) { console.error(err); }
  };

  const formatAddress = (c: Customer) => {
    return `${c.buildingNumber} ${c.streetName}, ${c.district}, ${c.city}, ${c.postalCode}`;
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <h2 className="page-title">{t('title')}</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <DataTransferButtons entityType="customers" onImportSuccess={fetchCustomers} />
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

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{t('noCustomersFound')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '1000px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  <th style={{ padding: '12px', width: '40px', textAlign: 'center' }}>
                    <input type="checkbox" checked={customers.length > 0 && selectedIds.size === customers.length} onChange={toggleSelectAll} />
                  </th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{t('customerId')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{t('fullName')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{t('phone')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{t('customerType')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{t('address')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{commonT('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedIds.has(customer._id)} onChange={() => toggleSelect(customer._id)} />
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#28aaa9' }}>{customer.customerId}</td>
                    <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {customer.profilePhoto && <img src={customer.profilePhoto} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />}
                            {customer.fullName}
                        </div>
                    </td>
                    <td style={{ padding: '12px' }}>{customer.phone}</td>
                    <td style={{ padding: '12px' }}>{customer.customerType || 'Individual'}</td>
                    <td style={{ padding: '12px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatAddress(customer)}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setEditingCustomer(customer); setShowModal(true); }} style={{ color: '#f8b425', background: 'none', border: 'none', cursor: 'pointer' }}>{commonT('edit')}</button>
                        <button onClick={() => handleDelete(customer._id)} style={{ color: '#ec4561', background: 'none', border: 'none', cursor: 'pointer' }}>{commonT('delete')}</button>
                        <Link href={`/dashboard/customers/${customer._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>{commonT('view')}</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && !editingCustomer && (
        <CustomerModal
          onClose={() => setShowModal(false)}
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

function CustomerModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const t = useTranslations('Customers');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    passportNumber: '',
    buildingNumber: '',
    streetName: '',
    district: '',
    city: '',
    postalCode: '',
    countryCode: 'SA',
    customerType: 'Individual' as 'Individual' | 'Business',
    vatRegistrationNumber: '',
    otherId: '',
    otherIdType: 'CRN' as 'CRN' | 'MOM' | 'MLSD' | 'SAGIA' | 'OTH',
    licenseExpiryDate: '',
    passportExpiryDate: '',
    profilePhoto: '',
    passportDocument: '',
    drivingLicenseDocument: '',
    iqamaDocument: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const data = await res.json(); alert(data.error || 'Failed'); return; }
      onSave();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da', background: '#ffffff', textAlign: isRtl ? 'right' : 'left'
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '14px', fontWeight: 500, color: '#2a3142', marginBottom: '4px', textAlign: isRtl ? 'right' : 'left'
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '700px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto', textAlign: isRtl ? 'right' : 'left' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{t('addCustomer')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <label style={{ ...labelStyle, textAlign: 'center' }}>{t('profilePhoto')}</label>
              <ImageUpload
                value={form.profilePhoto}
                onChange={(url) => setForm({ ...form, profilePhoto: url })}
                folder="customers"
                label={t('photo')}
                size={100}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div>
              <label style={labelStyle}>{t('fullName')} *</label>
              <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('phone')} *</label>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('email')}</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('passportNumber')} *</label>
              <input required value={form.passportNumber} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{commonT('passportExpiryDate')} *</label>
              <input required type="date" value={form.passportExpiryDate} onChange={(e) => setForm({ ...form, passportExpiryDate: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('customerType')}</label>
              <select value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value as 'Individual' | 'Business' })} style={{ ...inputStyle, background: '#fff' }}>
                <option value="Individual">{t('individual')}</option>
                <option value="Business">{t('business')}</option>
              </select>
            </div>
            <div>
                <label style={labelStyle}>{t('vatTrn')}</label>
                <input value={form.vatRegistrationNumber} onChange={(e) => setForm({ ...form, vatRegistrationNumber: e.target.value })} placeholder="3xxxxxxxxxxxxxx3" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
              <div>
                <label style={labelStyle}>{t('otherIdType')}</label>
                <select value={form.otherIdType} onChange={(e) => setForm({ ...form, otherIdType: e.target.value as 'CRN' | 'MOM' | 'MLSD' | 'SAGIA' | 'OTH' })} style={{ ...inputStyle, background: '#fff' }}>
                  <option value="CRN">CRN</option>
                  <option value="MOM">MOM</option>
                  <option value="MLSD">MLSD</option>
                  <option value="SAGIA">SAGIA</option>
                  <option value="OTH">OTH</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t('otherId')}</label>
                <input value={form.otherId} onChange={(e) => setForm({ ...form, otherId: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>{t('licenseExpiry')}</label>
              <input type="date" value={form.licenseExpiryDate} onChange={(e) => setForm({ ...form, licenseExpiryDate: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <h4 style={{ margin: '20px 0 10px', color: '#2a3142', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>{t('address')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div>
              <label style={labelStyle}>{t('buildingNumber')}</label>
              <input value={form.buildingNumber} onChange={(e) => setForm({ ...form, buildingNumber: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('streetName')}</label>
              <input value={form.streetName} onChange={(e) => setForm({ ...form, streetName: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('district')}</label>
              <input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('city')}</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('postalCode')}</label>
              <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div>
              <label style={labelStyle}>{t('emergencyContactName')}</label>
              <input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('emergencyContactPhone')}</label>
              <input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div>
              <label style={labelStyle}>{commonT('passportExpiryDate')}</label>
              <input type="date" value={form.passportExpiryDate} onChange={(e) => setForm({ ...form, passportExpiryDate: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('licenseExpiry')}</label>
              <input type="date" value={form.licenseExpiryDate} onChange={(e) => setForm({ ...form, licenseExpiryDate: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '20px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
            <label style={labelStyle}>{t('documents')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px', color: '#6c757d' }}>{commonT('passportDocument')}</label>
                <DocumentUpload value={form.passportDocument} onChange={(url) => setForm({ ...form, passportDocument: url })} label={commonT('passportDocument')} />
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px', color: '#6c757d' }}>{t('drivingLicense')}</label>
                <DocumentUpload value={form.drivingLicenseDocument} onChange={(url) => setForm({ ...form, drivingLicenseDocument: url })} label={t('drivingLicense')} />
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px', color: '#6c757d' }}>{t('iqama')}</label>
                <DocumentUpload value={form.iqamaDocument} onChange={(url) => setForm({ ...form, iqamaDocument: url })} label={t('iqama')} />
              </div>
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{t('notes')}</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: '80px', padding: '12px' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #ced4da', background: '#ffffff', cursor: 'pointer' }}>{commonT('cancel')}</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', border: 'none', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? commonT('loading') : commonT('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
