'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CarStatus } from '@/types';
import { uploadImage, deleteFile } from '@/lib/uploadClient';
import SearchableSelect from '@/components/SearchableSelect';
import { MultiImageUpload } from '@/components/ImageUpload';
import { useTranslations, useLocale } from 'next-intl';

interface Supplier {
  _id: string;
  supplierId: string;
  companyName: string;
  companyLogo?: string;
  phone: string;
  email?: string;
}

interface PurchaseData {
  supplier: string;
  supplierName: string;
  supplierContact: string;
  purchasePrice: string;
  purchaseDate: string;
  isNewCar: boolean;
  conditionImages: string[];
  insuranceUrl?: string;
  insuranceExpiry?: string;
  registrationUrl?: string;
  registrationExpiry?: string;
  roadPermitUrl?: string;
  roadPermitExpiry?: string;
  documentUrl?: string;
  notes: string;
}

interface CarFormData {
  brand: string;
  model: string;
  year: string;
  engineNumber: string;
  sequenceNumber: string;
  chassisNumber: string;
  color: string;
  status: CarStatus;
  notes: string;
  images: string[];
  purchase: PurchaseData;
}

interface CarFormProps {
  initialData?: Partial<CarFormData> & { _id?: string; purchase?: PurchaseData };
  mode: 'create' | 'edit';
}

const emptyPurchase: PurchaseData = {
  supplier: '',
  supplierName: '',
  supplierContact: '',
  purchasePrice: '',
  purchaseDate: '',
  isNewCar: true,
  conditionImages: [],
  insuranceUrl: '',
  insuranceExpiry: '',
  registrationUrl: '',
  registrationExpiry: '',
  roadPermitUrl: '',
  roadPermitExpiry: '',
  documentUrl: '',
  notes: '',
};

function formatDateForInput(dateString: string | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export default function CarForm({ initialData, mode }: CarFormProps) {
  const t = useTranslations('CarForm');
  const commonT = useTranslations('Common');
  const statusT = useTranslations('Status');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ companyName: '', companyNumber: '', phone: '', email: '' });

  const [form, setForm] = useState<CarFormData>({
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    engineNumber: '',
    sequenceNumber: '',
    chassisNumber: '',
    color: '',
    status: 'In Stock',
    notes: '',
    images: [],
    purchase: { ...emptyPurchase },
  });

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
        year: initialData.year?.toString() || new Date().getFullYear().toString(),
        sequenceNumber: initialData.sequenceNumber || '',
        purchase: initialData.purchase ? {
          ...emptyPurchase,
          supplier: initialData.purchase.supplier || '',
          supplierName: initialData.purchase.supplierName || '',
          supplierContact: initialData.purchase.supplierContact || '',
          purchasePrice: initialData.purchase.purchasePrice?.toString() || '',
          purchaseDate: formatDateForInput(initialData.purchase.purchaseDate),
          isNewCar: initialData.purchase.isNewCar ?? true,
          conditionImages: initialData.purchase.conditionImages || [],
          insuranceUrl: initialData.purchase.insuranceUrl || '',
          insuranceExpiry: formatDateForInput(initialData.purchase.insuranceExpiry),
          registrationUrl: initialData.purchase.registrationUrl || '',
          registrationExpiry: formatDateForInput(initialData.purchase.registrationExpiry),
          roadPermitUrl: initialData.purchase.roadPermitUrl || '',
          roadPermitExpiry: formatDateForInput(initialData.purchase.roadPermitExpiry),
          documentUrl: initialData.purchase.documentUrl || '',
          notes: initialData.purchase.notes || '',
        } : { ...emptyPurchase },
      }));
    }
  }, [initialData?._id]);

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const res = await fetch('/api/suppliers?list=true');
      const data = await res.json();
      if (data.suppliers) {
        setSuppliers(data.suppliers);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSupplierChange = (supplierId: string) => {
    if (supplierId === '__new__') {
      setShowSupplierModal(true);
      return;
    }
    
    const selectedSupplier = suppliers.find(s => s._id === supplierId);
    
    setForm(prev => ({
      ...prev,
      purchase: {
        ...prev.purchase,
        supplier: supplierId,
        supplierName: selectedSupplier?.companyName || '',
        supplierContact: selectedSupplier?.phone || '',
      }
    }));
  };

  const saveNewSupplier = async () => {
    if (!newSupplier.companyName || !newSupplier.companyNumber || !newSupplier.phone) {
      alert(t('fillRequired'));
      return;
    }
    
    setSavingSupplier(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: newSupplier.companyName,
          companyNumber: newSupplier.companyNumber,
          phone: newSupplier.phone,
          email: newSupplier.email,
          address: '',
          status: 'active',
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.supplier) {
        await fetchSuppliers();
        setForm(prev => ({
          ...prev,
          purchase: {
            ...prev.purchase,
            supplier: data.supplier._id,
            supplierName: data.supplier.companyName,
            supplierContact: data.supplier.phone,
          }
        }));
        setShowSupplierModal(false);
        setNewSupplier({ companyName: '', companyNumber: '', phone: '', email: '' });
      } else {
        alert(data.error || t('failedCreateSupplier'));
      }
    } catch {
      alert(t('failedCreateSupplier'));
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith('purchase.')) {
      const field = name.replace('purchase.', '');
      setForm((prev) => ({
        ...prev,
        purchase: { ...prev.purchase, [field]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImage(file, field.includes('purchase') ? 'cars/purchase' : 'cars/documents');
      if (result.url) {
        setForm((prev) => ({
          ...prev,
          purchase: { ...prev.purchase, [field]: result.url },
        }));
      } else {
        alert(`Failed to upload: ${result.error}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        year: parseInt(form.year),
        purchase: {
          ...form.purchase,
          purchasePrice: parseFloat(form.purchase.purchasePrice),
        },
      };

      const url = mode === 'edit' && initialData?._id ? `/api/cars/${initialData._id}` : '/api/cars';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save car');
        return;
      }

      router.push('/dashboard/cars');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    fontSize: '14px',
    borderRadius: '0',
    padding: '0.375rem 1rem',
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

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2a3142',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e9ecef',
    textAlign: isRtl ? 'right' : 'left'
  };

  const fileInputStyle: React.CSSProperties = {
    ...inputStyle,
    height: 'auto',
    padding: '8px',
    border: '1px dashed #ced4da',
    background: '#f8f9fa',
    cursor: 'pointer',
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
      {error && (
        <div style={{ background: 'rgba(236, 69, 97, 0.1)', border: '1px solid #ec4561', borderRadius: '3px', padding: '12px', marginBottom: '20px', textAlign: isRtl ? 'right' : 'left' }}>
          <p style={{ color: '#ec4561', fontSize: '14px', margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={sectionTitleStyle}>{t('purchaseInfo')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px', direction: isRtl ? 'rtl' : 'ltr' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <div style={{ flex: 1 }}>
            <SearchableSelect
              label={t('supplier')}
              value={form.purchase.supplier}
              onChange={handleSupplierChange}
              options={[
                { value: '__new__', label: `+ ${t('addNewSupplier')}` },
                ...suppliers.map(s => ({ value: s._id, label: `${s.companyName} (${s.supplierId})` }))
              ]}
              placeholder={t('searchSupplier')}
              disabled={loadingSuppliers}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowSupplierModal(true)}
            style={{
              height: '40px',
              padding: '0 12px',
              background: '#fff',
              border: '1px solid #ced4da',
              borderRadius: '3px',
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              color: '#28aaa9',
            }}
          >
            + {commonT('add')}
          </button>
        </div>
        
        {showSupplierModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '400px', maxWidth: '90vw', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', textAlign: isRtl ? 'right' : 'left' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: '#2b2d5d' }}>{t('addNewSupplier')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={labelStyle}>{t('companyName')} *</label><input value={newSupplier.companyName} onChange={(e) => setNewSupplier({ ...newSupplier, companyName: e.target.value })} style={inputStyle} autoFocus /></div>
              <div><label style={labelStyle}>{t('companyNumber')} *</label><input value={newSupplier.companyNumber} onChange={(e) => setNewSupplier({ ...newSupplier, companyNumber: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>{t('phone')} *</label><input value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>{t('email')}</label><input type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <button type="button" onClick={() => setShowSupplierModal(false)} style={{ padding: '10px 16px', background: '#fff', color: '#666', border: '1px solid #ddd', borderRadius: '3px', fontSize: '14px', cursor: 'pointer' }}>{commonT('cancel')}</button>
              <button type="button" onClick={saveNewSupplier} disabled={savingSupplier} style={{ padding: '10px 16px', background: '#28aaa9', color: '#fff', border: 'none', borderRadius: '3px', fontSize: '14px', cursor: savingSupplier ? 'not-allowed' : 'pointer', opacity: savingSupplier ? 0.6 : 1 }}>{savingSupplier ? commonT('loading') : t('saveSupplier')}</button>
            </div>
          </div>
        </div>
      )}

        <div><label style={labelStyle}>{t('purchasePrice')} *</label><input name="purchase.purchasePrice" type="number" required value={form.purchase.purchasePrice} onChange={handleChange} style={inputStyle} /></div>
        <div><label style={labelStyle}>{t('purchaseDate')} *</label><input name="purchase.purchaseDate" type="date" required value={form.purchase.purchaseDate} onChange={handleChange} style={inputStyle} /></div>
        <div>
          <label style={labelStyle}>{t('carType')}</label>
          <select name="purchase.isNewCar" value={form.purchase.isNewCar.toString()} onChange={(e) => setForm((prev) => ({ ...prev, purchase: { ...prev.purchase, isNewCar: e.target.value === 'true' } }))} style={{ ...inputStyle, background: '#fff' }}>
            <option value="true">{t('newCar')}</option>
            <option value="false">{t('usedCar')}</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '20px', textAlign: isRtl ? 'right' : 'left' }}>
        <MultiImageUpload label={t('conditionImages')} value={form.purchase.conditionImages} onChange={(imgs) => setForm(prev => ({ ...prev, purchase: { ...prev.purchase, conditionImages: imgs } }))} folder="cars/condition" />
      </div>

      <div style={sectionTitleStyle}>{t('vehicleDocs')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px', direction: isRtl ? 'rtl' : 'ltr' }}>
        {[
          { label: t('insuranceDoc'), field: 'insuranceUrl', expiry: 'insuranceExpiry', expiryLabel: t('insuranceExpiry') },
          { label: t('registrationCard'), field: 'registrationUrl', expiry: 'registrationExpiry', expiryLabel: t('registrationExpiry') },
          { label: t('roadPermit'), field: 'roadPermitUrl', expiry: 'roadPermitExpiry', expiryLabel: t('roadPermitExpiry') },
        ].map((doc) => (
          <div key={doc.field}>
            <label style={labelStyle}>{doc.label}</label>
            <input type="file" accept="application/pdf,image/*" onChange={(e) => handleFileUpload(e, doc.field)} disabled={uploading} style={fileInputStyle} />
            {(form.purchase as any)[doc.field] && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <a href={(form.purchase as any)[doc.field]} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', fontSize: '14px' }}>{t('viewDoc')}</a>
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, purchase: { ...prev.purchase, [doc.field]: '' } }))} style={{ color: '#ec4561', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>{t('remove')}</button>
              </div>
            )}
            <div style={{ marginTop: '12px' }}>
              <label style={labelStyle}>{doc.expiryLabel}</label>
              <input name={`purchase.${doc.expiry}`} type="date" value={(form.purchase as any)[doc.expiry]} onChange={handleChange} style={inputStyle} />
            </div>
          </div>
        ))}
      </div>

      <div style={sectionTitleStyle}>{t('vehicleInfo')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px', direction: isRtl ? 'rtl' : 'ltr' }}>
        <div><label style={labelStyle}>{t('brand')} *</label><input name="brand" required value={form.brand} onChange={handleChange} style={inputStyle} /></div>
        <div><label style={labelStyle}>{t('model')} *</label><input name="model" required value={form.model} onChange={handleChange} style={inputStyle} /></div>
        <div><label style={labelStyle}>{t('year')} *</label><input name="year" type="number" required value={form.year} onChange={handleChange} style={inputStyle} /></div>
        <div><label style={labelStyle}>{t('color')}</label><input name="color" value={form.color} onChange={handleChange} style={inputStyle} /></div>
        <div><label style={labelStyle}>{t('engineNumber')}</label><input name="engineNumber" value={form.engineNumber} onChange={handleChange} style={inputStyle} /></div>
        <div><label style={labelStyle}>{t('sequenceNumber')}</label><input name="sequenceNumber" value={form.sequenceNumber} onChange={handleChange} style={inputStyle} /></div>
        <div><label style={labelStyle}>{t('chassisNumber')} *</label><input name="chassisNumber" required value={form.chassisNumber} onChange={handleChange} style={inputStyle} /></div>
        <div>
          <label style={labelStyle}>{t('status')}</label>
          <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
            {['In Stock', 'Under Repair', 'Reserved', 'On Installment', 'Sold', 'Rented', 'Defaulted'].map((s) => (
              <option key={s} value={s}>{statusT(s.replace(' ', '').charAt(0).toLowerCase() + s.replace(' ', '').slice(1))}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '20px', textAlign: isRtl ? 'right' : 'left' }}>
        <label style={labelStyle}>{t('notes')}</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} style={{ ...inputStyle, height: 'auto', padding: '8px 1rem' }} />
      </div>

      <div style={{ marginBottom: '20px', textAlign: isRtl ? 'right' : 'left' }}>
        <MultiImageUpload label={t('images')} value={form.images} onChange={(imgs) => setForm(prev => ({ ...prev, images: imgs }))} folder="cars" />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <button type="button" onClick={() => router.back()} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, color: '#2a3142', background: '#ffffff', border: '1px solid #ced4da', borderRadius: '3px', cursor: 'pointer' }}>{commonT('cancel')}</button>
        <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, color: '#ffffff', background: '#28aaa9', border: '1px solid #28aaa9', borderRadius: '3px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? commonT('loading') : mode === 'edit' ? t('updateCar') : t('addCar')}
        </button>
      </div>
    </form>
  );
}
