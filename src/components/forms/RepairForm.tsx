'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RepairStatus } from '@/types';
import { MultiImageUpload } from '@/components/ImageUpload';
import SearchableSelect from '@/components/SearchableSelect';
import { uploadImage, deleteFile } from '@/lib/uploadClient';
import { useTranslations, useLocale } from 'next-intl';

interface RepairFormData {
  car: string;
  carId: string;
  repairDescription: string;
  partsReplaced: string;
  laborCost: string;
  repairCost: string;
  repairDate: string;
  status: RepairStatus;
  beforeImages: string[];
  afterImages: string[];
}

interface CarOption {
  _id: string;
  carId: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  plateNumber?: string;
}

interface RepairFormProps {
  initialData?: Partial<RepairFormData> & { _id?: string };
  mode: 'create' | 'edit';
  defaultCarId?: string;
}

export default function RepairForm({ initialData, mode, defaultCarId }: RepairFormProps) {
  const t = useTranslations('RepairForm');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [cars, setCars] = useState<CarOption[]>([]);

  const [form, setForm] = useState<RepairFormData>({
    car: defaultCarId || '',
    carId: '',
    repairDescription: '',
    partsReplaced: '',
    laborCost: '0',
    repairCost: '0',
    repairDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    beforeImages: [],
    afterImages: [],
  });

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
        laborCost: initialData.laborCost?.toString() || '0',
        repairCost: initialData.repairCost?.toString() || '0',
      }));
    }
    fetch('/api/cars?limit=100')
      .then((r) => r.json())
      .then((data) => {
        setCars(data.cars || []);
        if (defaultCarId && data.cars) {
          const car = data.cars.find((c: CarOption) => c._id === defaultCarId);
          if (car) setForm((prev) => ({ ...prev, carId: car.carId }));
        }
      })
      .catch(console.error);
  }, [defaultCarId, initialData?._id]);

  const handleCarChange = (val: string) => {
    const selectedCar = cars.find((c) => c._id === val);
    setForm((prev) => ({ ...prev, car: val, carId: selectedCar?.carId || '' }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        laborCost: parseFloat(form.laborCost),
        repairCost: parseFloat(form.repairCost),
      };

      const url = mode === 'edit' && initialData?._id ? `/api/repairs/${initialData._id}` : '/api/repairs';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save repair');
        return;
      }

      router.push('/dashboard/repairs');
      router.refresh();
    } catch {
      setError(commonT('errors.networkError'));
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

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
      {error && (
        <div style={{ background: 'rgba(236, 69, 97, 0.1)', border: '1px solid #ec4561', borderRadius: '3px', padding: '12px', marginBottom: '20px', textAlign: isRtl ? 'right' : 'left' }}>
          <p style={{ color: '#ec4561', fontSize: '14px', margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px', direction: isRtl ? 'rtl' : 'ltr' }}>
        <div>
          <SearchableSelect
            label={`${t('car')} *`}
            value={form.car}
            onChange={handleCarChange}
            options={cars.map(c => ({ 
              value: c._id, 
              label: `${c.brand} ${c.model} (${c.year})${c.plateNumber ? ` - ${c.plateNumber}` : ` - ${c.carId}`}${c.color ? ` - ${c.color}` : ''}`
            }))}
            placeholder={t('selectCar')}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>{t('repairDate')} *</label>
          <input
            name="repairDate"
            type="date"
            required
            value={form.repairDate}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>{t('laborCost')}</label>
          <input
            name="laborCost"
            type="number"
            min="0"
            step="0.01"
            value={form.laborCost}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>{t('repairCost')}</label>
          <input
            name="repairCost"
            type="number"
            min="0"
            step="0.01"
            value={form.repairCost}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>{t('status')}</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            style={inputStyle}
          >
            {['Pending', 'In Progress', 'Completed'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '20px', textAlign: isRtl ? 'right' : 'left' }}>
        <label style={labelStyle}>{t('description')} *</label>
        <textarea
          name="repairDescription"
          required
          value={form.repairDescription}
          onChange={handleChange}
          rows={3}
          style={{ ...inputStyle, height: 'auto', padding: '8px 1rem' }}
        />
      </div>

      <div style={{ marginBottom: '20px', textAlign: isRtl ? 'right' : 'left' }}>
        <label style={labelStyle}>{t('partsReplaced')}</label>
        <textarea
          name="partsReplaced"
          value={form.partsReplaced}
          onChange={handleChange}
          rows={2}
          style={{ ...inputStyle, height: 'auto', padding: '8px 1rem' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px', direction: isRtl ? 'rtl' : 'ltr' }}>
        <div>
          <MultiImageUpload
            label={t('beforeImages')}
            value={form.beforeImages}
            onChange={(imgs) => setForm(prev => ({ ...prev, beforeImages: imgs }))}
            folder="repairs/before"
          />
        </div>
        <div>
          <MultiImageUpload
            label={t('afterImages')}
            value={form.afterImages}
            onChange={(imgs) => setForm(prev => ({ ...prev, afterImages: imgs }))}
            folder="repairs/after"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#2a3142',
            background: '#ffffff',
            border: '1px solid #ced4da',
            borderRadius: '3px',
            cursor: 'pointer',
          }}
        >
          {commonT('cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#ffffff',
            background: '#28aaa9',
            border: '1px solid #28aaa9',
            borderRadius: '3px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? commonT('loading') : mode === 'edit' ? t('updateRepair') : t('addRepair')}
        </button>
      </div>
    </form>
  );
}
