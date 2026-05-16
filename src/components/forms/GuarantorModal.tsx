'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import ImageUpload, { DocumentUpload, MultiDocumentUpload } from '@/components/ImageUpload';

export interface IGuarantor {
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
  createdAt?: string;
}

interface GuarantorModalProps {
  guarantor?: IGuarantor | null;
  onClose: () => void;
  onSave: (newGuarantor?: IGuarantor) => void;
}

export default function GuarantorModal({ guarantor, onClose, onSave }: GuarantorModalProps) {
  const t = useTranslations('Guarantors');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [form, setForm] = useState({
    fullName: guarantor?.fullName || '',
    phone: guarantor?.phone || '',
    email: guarantor?.email || '',
    passportNumber: guarantor?.passportNumber || '',
    employer: guarantor?.employer || '',
    salary: guarantor?.salary?.toString() || '',
    buildingNumber: guarantor?.buildingNumber || '',
    streetName: guarantor?.streetName || '',
    district: guarantor?.district || '',
    city: guarantor?.city || '',
    postalCode: guarantor?.postalCode || '',
    countryCode: guarantor?.countryCode || 'SA',
    documents: guarantor?.documents || [],
    passportDocument: guarantor?.passportDocument || '',
    passportExpiryDate: guarantor?.passportExpiryDate?.split('T')[0] || '',
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
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed');
        return;
      }
      const data = await res.json();
      onSave(data.guarantor);
    } catch (err) {
      console.error(err);
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
    background: '#ffffff',
    textAlign: isRtl ? 'right' : 'left',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#2a3142',
    marginBottom: '4px',
    textAlign: isRtl ? 'right' : 'left',
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '700px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto', textAlign: isRtl ? 'right' : 'left' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{guarantor ? t('editGuarantor') : t('addNew')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'center' }}>
              <ImageUpload value={form.profilePhoto} onChange={(url) => setForm({ ...form, profilePhoto: url })} folder="guarantors" label={form.fullName} size={80} />
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

          <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '15px', direction: isRtl ? 'rtl' : 'ltr' }}>{t('address')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div>
              <label style={labelStyle}>{commonT('buildingNumber')}</label>
              <input value={form.buildingNumber} onChange={(e) => setForm({ ...form, buildingNumber: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{commonT('streetName')}</label>
              <input value={form.streetName} onChange={(e) => setForm({ ...form, streetName: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{commonT('district')}</label>
              <input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{commonT('city')}</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{commonT('postalCode')}</label>
              <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '15px', direction: isRtl ? 'rtl' : 'ltr' }}>{t('documents')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px', direction: isRtl ? 'rtl' : 'ltr' }}>
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

          <div style={{ marginBottom: '16px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <label style={{ ...labelStyle, fontSize: '12px', color: '#6c757d' }}>{isRtl ? 'وثائق أخرى' : 'Other Documents'}</label>
            <MultiDocumentUpload values={form.documents} onChange={(urls) => setForm({ ...form, documents: urls })} folder="guarantors" />
          </div>

          <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
            <label style={labelStyle}>{t('notes')}</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: '80px', paddingTop: '8px' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
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
