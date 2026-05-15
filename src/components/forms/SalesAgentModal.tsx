'use client';

import { useState } from 'react';
import ImageUpload, { DocumentUpload } from '@/components/ImageUpload';
import { useTranslations, useLocale } from 'next-intl';

export interface SalesAgent {
  _id: string;
  agentId: string;
  fullName: string;
  phone: string;
  email?: string;
  passportNumber?: string;
  address?: string;
  passportDocument?: string;
  passportExpiryDate?: string;
  drivingLicenseDocument?: string;
  iqamaDocument?: string;
  profilePhoto?: string;
  notes?: string;
  createdAt: string;
}

interface SalesAgentModalProps {
  agent?: SalesAgent | null;
  onClose: () => void;
  onSave: () => void;
}

export default function SalesAgentModal({ agent, onClose, onSave }: SalesAgentModalProps) {
  const t = useTranslations('SalesAgents');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [form, setForm] = useState({
    fullName: agent?.fullName || '',
    phone: agent?.phone || '',
    email: agent?.email || '',
    passportNumber: agent?.passportNumber || '',
    address: agent?.address || '',
    passportDocument: agent?.passportDocument || '',
    passportExpiryDate: agent?.passportExpiryDate?.split('T')[0] || '',
    drivingLicenseDocument: agent?.drivingLicenseDocument || '',
    iqamaDocument: agent?.iqamaDocument || '',
    profilePhoto: agent?.profilePhoto || '',
    notes: agent?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = agent ? `/api/crm/sales-agents/${agent._id}` : '/api/crm/sales-agents';
      const method = agent ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
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
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '700px', maxWidth: '90%', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>{agent ? t('editAgent') : t('addNew')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'center' }}>
                <ImageUpload value={form.profilePhoto} onChange={(url) => setForm({...form, profilePhoto: url})} folder="sales-agents" label={form.fullName} size={80} />
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
              <label style={labelStyle}>{t('email')}</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('passportNumber')}</label>
              <input value={form.passportNumber} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{commonT('passportExpiryDate')}</label>
              <input type="date" value={form.passportExpiryDate} onChange={(e) => setForm({ ...form, passportExpiryDate: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>{t('address')}</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '15px' }}>{t('documents')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '12px', color: '#6c757d' }}>{commonT('passportDocument')}</label>
              <DocumentUpload value={form.passportDocument} onChange={(url) => setForm({ ...form, passportDocument: url })} label={commonT('passportDocument')} folder="sales-agents" />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '12px', color: '#6c757d' }}>{commonT('drivingLicense')}</label>
              <DocumentUpload value={form.drivingLicenseDocument} onChange={(url) => setForm({ ...form, drivingLicenseDocument: url })} label={commonT('drivingLicense')} folder="sales-agents" />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '12px', color: '#6c757d' }}>{commonT('iqama')}</label>
              <DocumentUpload value={form.iqamaDocument} onChange={(url) => setForm({ ...form, iqamaDocument: url })} label={commonT('iqama')} folder="sales-agents" />
            </div>
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
