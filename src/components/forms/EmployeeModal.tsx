'use client';

import { useState } from 'react';
import ImageUpload, { DocumentUpload } from '@/components/ImageUpload';
import SearchableSelect from '@/components/SearchableSelect';
import { useTranslations, useLocale } from 'next-intl';

export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  phone: string;
  email?: string;
  passportNumber?: string;
  designation: string;
  department: string;
  baseSalary: number;
  joiningDate: string;
  isActive: boolean;
  photo?: string;
  passportDocument?: string;
  passportExpiryDate?: string;
  commissionRate?: number;
}

export const DEPARTMENTS = ['Sales', 'Service', 'Accounts', 'Finance', 'Admin', 'Management', 'Operations'] as const;

interface EmployeeModalProps {
  employee: Employee | null;
  onClose: () => void;
  onSave: (newEmployee?: any) => void;
}

export default function EmployeeModal({ employee, onClose, onSave }: EmployeeModalProps) {
  const t = useTranslations('Employees');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [form, setForm] = useState({
    name: employee?.name || '',
    phone: employee?.phone || '',
    email: employee?.email || '',
    designation: employee?.designation || '',
    department: employee?.department || 'Sales',
    baseSalary: employee?.baseSalary?.toString() || '',
    commissionRate: employee?.commissionRate?.toString() || '',
    joiningDate: employee?.joiningDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    isActive: employee?.isActive ?? true,
    photo: employee?.photo || '',
    passportNumber: (employee as any)?.passportNumber || '',
    passportDocument: (employee as any)?.passportDocument || '',
    passportExpiryDate: (employee as any)?.passportExpiryDate?.split('T')[0] || '',
  });
  const [loading, setLoading] = useState(false);

  const getDeptLabel = (dept: string) => {
    const key = dept.toLowerCase();
    return t(`departments.${key}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = employee ? `/api/employees/${employee._id}` : '/api/employees';
      const method = employee ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { 
        const data = await res.json(); 
        alert(data.error || 'Failed'); 
        return; 
      }
      const data = await res.json();
      onSave(data.employee);
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '500px', maxHeight: '90vh', overflow: 'auto', textAlign: isRtl ? 'right' : 'left' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>{employee ? t('editEmployee') : t('addEmployee')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <ImageUpload value={form.photo} onChange={(url) => setForm({ ...form, photo: url })} folder="employees" label={form.name || t('name')} size={80} />
            </div>
            <div><label style={labelStyle}>{t('name')} *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('phone')} *</label><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('email')}</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('designation')} *</label><input required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('department')} *</label><SearchableSelect value={form.department} onChange={(v) => setForm({ ...form, department: v })} options={DEPARTMENTS.map(d => ({ value: d, label: getDeptLabel(d) }))} placeholder={t('department')} /></div>
            <div><label style={labelStyle}>{t('salary')} *</label><input required type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('commissionRate')}</label><input type="number" min="0" max="100" step="0.1" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>{t('joiningDate')} *</label><input required type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>{commonT('passportNumber')}</label><input value={form.passportNumber} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>{commonT('passportExpiryDate')}</label><input type="date" value={form.passportExpiryDate} onChange={(e) => setForm({ ...form, passportExpiryDate: e.target.value })} style={inputStyle} /></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ ...labelStyle, fontSize: '12px', color: '#6c757d' }}>{commonT('passportDocument')}</label>
              <DocumentUpload value={form.passportDocument} onChange={(url) => setForm({ ...form, passportDocument: url })} label={commonT('passportDocument')} />
            </div>
            <div><label style={labelStyle}>{t('status')}</label><SearchableSelect value={form.isActive.toString()} onChange={(v) => setForm({ ...form, isActive: v === 'true' })} options={[{ value: 'true', label: t('active') }, { value: 'false', label: t('inactive') }]} /></div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            {employee && (
              <button type="button" onClick={async () => { if (confirm(t('deleteConfirm'))) { await fetch(`/api/employees/${employee._id}`, { method: 'DELETE' }); onSave(); onClose(); } }} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ec4561', borderRadius: '3px', background: '#ffffff', color: '#ec4561', cursor: 'pointer' }}>{commonT('delete')}</button>
            )}
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#ffffff', cursor: 'pointer' }}>{commonT('cancel')}</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>{loading ? commonT('loading') : commonT('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
