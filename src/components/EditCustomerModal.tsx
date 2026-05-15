'use client';

import { useState } from 'react';
import { ImageUpload, DocumentUpload } from '@/components/ImageUpload';
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
  customerType?: 'Individual' | 'Business';
  vatRegistrationNumber?: string;
  otherId?: string;
  otherIdType?: 'CRN' | 'MOM' | 'MLSD' | 'SAGIA' | 'OTH';
  licenseExpiryDate?: string;
}

interface EditCustomerModalProps {
  customer: Customer;
  onClose: () => void;
  onSave: (data: Partial<Customer>) => void;
}

export default function EditCustomerModal({ customer, onClose, onSave }: EditCustomerModalProps) {
  const t = useTranslations('Customers');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [form, setForm] = useState({
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email || '',
    passportNumber: customer.passportNumber || '',
    buildingNumber: customer.buildingNumber || '',
    streetName: customer.streetName || '',
    district: customer.district || '',
    city: customer.city || '',
    postalCode: customer.postalCode || '',
    countryCode: customer.countryCode || 'SA',
    passportDocument: customer.passportDocument || '',
    drivingLicenseDocument: customer.drivingLicenseDocument || '',
    iqamaDocument: customer.iqamaDocument || '',
    profilePhoto: customer.profilePhoto || '',
    emergencyContactName: customer.emergencyContactName || '',
    emergencyContactPhone: customer.emergencyContactPhone || '',
    notes: customer.notes || '',
    customerType: customer.customerType || 'Individual' as 'Individual' | 'Business',
    vatRegistrationNumber: customer.vatRegistrationNumber || '',
    otherId: customer.otherId || '',
    otherIdType: customer.otherIdType || 'CRN' as 'CRN' | 'MOM' | 'MLSD' | 'SAGIA' | 'OTH',
    licenseExpiryDate: customer.licenseExpiryDate ? new Date(customer.licenseExpiryDate).toISOString().split('T')[0] : '',
    passportExpiryDate: customer.passportExpiryDate ? new Date(customer.passportExpiryDate).toISOString().split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(form);
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
    textAlign: isRtl ? 'right' : 'left'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#2a3142',
    marginBottom: '4px',
    textAlign: isRtl ? 'right' : 'left'
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '700px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto', textAlign: isRtl ? 'right' : 'left' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{t('editCustomer')} - {customer.customerId}</h3>
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
            <div>
              <label style={labelStyle}>{t('passportNumber')}</label>
              <input value={form.passportNumber} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('passportExpiryDate')}</label>
              <input type="date" value={form.passportExpiryDate} onChange={(e) => setForm({ ...form, passportExpiryDate: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
              <div>
                <label style={labelStyle}>{t('otherIdType')}</label>
                <select value={form.otherIdType} onChange={(e) => setForm({ ...form, otherIdType: e.target.value as any })} style={{ ...inputStyle, background: '#fff' }}>
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

          <div style={{ marginBottom: '20px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
            <label style={labelStyle}>{t('documents')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px', color: '#6c757d' }}>{t('passportDocument')}</label>
                <DocumentUpload value={form.passportDocument} onChange={(url) => setForm({ ...form, passportDocument: url })} label={t('passportDocument')} />
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
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>{commonT('cancel')}</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? commonT('loading') : commonT('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
