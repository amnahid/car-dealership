'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import ImageUpload, { DocumentUpload, MultiDocumentUpload } from '@/components/ImageUpload';
import { useTranslations, useLocale } from 'next-intl';

interface Guarantor {
  _id: string;
  guarantorId: string;
  fullName: string;
  phone: string;
  email?: string;
  passportNumber?: string;
  employer?: string;
  salary?: number;
  buildingNumber: string;
  streetName: string;
  district: string;
  city: string;
  postalCode: string;
  countryCode: string;
  documents: string[];
  passportDocument?: string;
  passportExpiryDate?: string;
  drivingLicenseDocument?: string;
  iqamaDocument?: string;
  profilePhoto?: string;
  notes?: string;
  createdAt: string;
}

export default function GuarantorsPage() {
  const t = useTranslations('Guarantors');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingGuarantor, setEditingGuarantor] = useState<Guarantor | null>(null);

  const fetchGuarantors = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (debouncedSearch) params.set('search', debouncedSearch);

    try {
      const res = await fetch(`/api/guarantors?${params}`);
      const data = await res.json();
      setGuarantors(data.guarantors || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchGuarantors();
  }, [fetchGuarantors]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      const res = await fetch(`/api/guarantors/${id}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); alert(data.error || 'Failed'); return; }
      fetchGuarantors();
    } catch (err) { console.error(err); }
  };

  const formatAddress = (g: Guarantor) => {
    return `${g.buildingNumber} ${g.streetName}, ${g.district}, ${g.city}, ${g.postalCode}`;
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <h2 className="page-title">{t('title')}</h2>
        <button
          onClick={() => { setEditingGuarantor(null); setShowModal(true); }}
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

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>
        ) : guarantors.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{t('noGuarantorsFound')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '1000px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{t('guarantorId')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{t('fullName')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{t('phone')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{t('passportNumber')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{t('address')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{commonT('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {guarantors.map((guarantor) => (
                  <tr key={guarantor._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#28aaa9' }}>{guarantor.guarantorId}</td>
                    <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {guarantor.profilePhoto && <img src={guarantor.profilePhoto} style={{ width: '24px', height: '24px', borderRadius: '50%' }} alt="" />}
                            {guarantor.fullName}
                        </div>
                    </td>
                    <td style={{ padding: '12px' }}>{guarantor.phone}</td>
                    <td style={{ padding: '12px' }}>{guarantor.passportNumber}</td>
                    <td style={{ padding: '12px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatAddress(guarantor)}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setEditingGuarantor(guarantor); setShowModal(true); }} style={{ color: '#f8b425', background: 'none', border: 'none', cursor: 'pointer' }}>{commonT('edit')}</button>
                        <button onClick={() => handleDelete(guarantor._id)} style={{ color: '#ec4561', background: 'none', border: 'none', cursor: 'pointer' }}>{commonT('delete')}</button>
                        <Link href={`/dashboard/crm/guarantors/${guarantor._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>{commonT('view')}</Link>
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
        <GuarantorModal
          guarantor={editingGuarantor}
          onClose={() => { setShowModal(false); setEditingGuarantor(null); }}
          onSave={() => { setShowModal(false); setEditingGuarantor(null); fetchGuarantors(); }}
        />
      )}
    </div>
  );
}

function GuarantorModal({ guarantor, onClose, onSave }: { guarantor?: Guarantor | null; onClose: () => void; onSave: () => void }) {
  const t = useTranslations('Guarantors');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [form, setForm] = useState({
    fullName: guarantor?.fullName || '',
    phone: guarantor?.phone || '',
    email: guarantor?.email || '',
    passportNumber: (guarantor as any)?.passportNumber || '',
    employer: guarantor?.employer || '',
    salary: guarantor?.salary?.toString() || '',
    buildingNumber: guarantor?.buildingNumber || '',
    streetName: guarantor?.streetName || '',
    district: guarantor?.district || '',
    city: guarantor?.city || '',
    postalCode: guarantor?.postalCode || '',
    countryCode: guarantor?.countryCode || 'SA',
    documents: guarantor?.documents || [],
    passportDocument: (guarantor as any)?.passportDocument || '',
    passportExpiryDate: (guarantor as any)?.passportExpiryDate?.split('T')[0] || '',
    drivingLicenseDocument: guarantor?.drivingLicenseDocument || '',
    iqamaDocument: guarantor?.iqamaDocument || '',
    profilePhoto: guarantor?.profilePhoto || '',
    notes: guarantor?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = guarantor ? `/api/guarantors/${guarantor._id}` : '/api/guarantors';
      const method = guarantor ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, salary: form.salary ? parseFloat(form.salary) : 0 }),
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
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '700px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>{guarantor ? t('editGuarantor') : t('addNew')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'center' }}>
                <ImageUpload value={form.profilePhoto} onChange={(url) => setForm({...form, profilePhoto: url})} folder="guarantors" label={form.fullName} size={80} />
            </div>
            <div>
              <label style={labelStyle}>{t('fullName')} *</label>
              <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('phone')} *</label>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
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
              <label style={labelStyle}>{t('email')}</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('employer')}</label>
              <input value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('salary')}</label>
              <input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '15px' }}>{t('address')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>{commonT('buildingNumber')} *</label>
              <input required value={form.buildingNumber} onChange={(e) => setForm({ ...form, buildingNumber: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{commonT('streetName')} *</label>
              <input required value={form.streetName} onChange={(e) => setForm({ ...form, streetName: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{commonT('district')} *</label>
              <input required value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{commonT('city')} *</label>
              <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{commonT('postalCode')} *</label>
              <input required value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '15px' }}>{t('documents')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '12px', color: '#6c757d' }}>{commonT('passportDocument')}</label>
              <DocumentUpload value={form.passportDocument} onChange={(url) => setForm({ ...form, passportDocument: url })} label={commonT('passportDocument')} />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '12px', color: '#6c757d' }}>{commonT('drivingLicense')}</label>
              <DocumentUpload value={form.drivingLicenseDocument} onChange={(url) => setForm({ ...form, drivingLicenseDocument: url })} label={commonT('drivingLicense')} />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '12px', color: '#6c757d' }}>{commonT('iqama')}</label>
              <DocumentUpload value={form.iqamaDocument} onChange={(url) => setForm({ ...form, iqamaDocument: url })} label={commonT('iqama')} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ ...labelStyle, fontSize: '12px', color: '#6c757d' }}>{isRtl ? 'وثائق أخرى' : 'Other Documents'}</label>
             <MultiDocumentUpload 
                values={form.documents} 
                onChange={(urls) => setForm({...form, documents: urls})} 
                folder="guarantors"
             />
          </div>

          <div>
            <label style={labelStyle}>{t('notes')}</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: '80px', paddingTop: '8px' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #ced4da', background: '#fff', cursor: 'pointer' }}>{commonT('cancel')}</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', border: 'none', background: '#28aaa9', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? commonT('loading') : commonT('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
