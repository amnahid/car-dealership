'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RepairStatus } from '@/types';

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
}

interface RepairFormProps {
  initialData?: Partial<RepairFormData> & { _id?: string };
  mode: 'create' | 'edit';
  defaultCarId?: string;
}

export default function RepairForm({ initialData, mode, defaultCarId }: RepairFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
  // initialData._id used as stable dependency for edit mode; defaultCarId for pre-selection
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCarId, initialData?._id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'car') {
      const selectedCar = cars.find((c) => c._id === value);
      setForm((prev) => ({ ...prev, car: value, carId: selectedCar?.carId || '' }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (field: 'beforeImages' | 'afterImages') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setForm((prev) => ({ ...prev, [field]: [...prev[field], base64] }));
      };
      reader.readAsDataURL(file);
    });
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
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#2a3142',
    marginBottom: '4px',
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
      {error && (
        <div
          style={{
            background: 'rgba(236, 69, 97, 0.1)',
            border: '1px solid #ec4561',
            borderRadius: '3px',
            padding: '12px',
            marginBottom: '20px',
          }}
        >
          <p style={{ color: '#ec4561', fontSize: '14px', margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Car *</label>
          <select
            name="car"
            required
            value={form.car}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">Select a car</option>
            {cars.map((car) => (
              <option key={car._id} value={car._id}>
                {car.carId} - {car.brand} {car.model}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Repair Date *</label>
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
          <label style={labelStyle}>Labor Cost ($)</label>
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
          <label style={labelStyle}>Parts/Repair Cost ($)</label>
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
          <label style={labelStyle}>Status</label>
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

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Repair Description *</label>
        <textarea
          name="repairDescription"
          required
          value={form.repairDescription}
          onChange={handleChange}
          rows={3}
          style={{ ...inputStyle, height: 'auto', padding: '8px 1rem' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Parts Replaced</label>
        <textarea
          name="partsReplaced"
          value={form.partsReplaced}
          onChange={handleChange}
          rows={2}
          style={{ ...inputStyle, height: 'auto', padding: '8px 1rem' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Before Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload('beforeImages')}
            style={{ ...inputStyle, height: 'auto', padding: '8px', border: '1px dashed #ced4da', background: '#f8f9fa' }}
          />
          <p style={{ fontSize: '12px', color: '#9ca8b3', marginTop: '4px' }}>Add photos before repair work starts.</p>
          {form.beforeImages.length > 0 && (
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#525f80', marginTop: '8px' }}>
              {form.beforeImages.length} image{form.beforeImages.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>
        <div>
          <label style={labelStyle}>After Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload('afterImages')}
            style={{ ...inputStyle, height: 'auto', padding: '8px', border: '1px dashed #ced4da', background: '#f8f9fa' }}
          />
          <p style={{ fontSize: '12px', color: '#9ca8b3', marginTop: '4px' }}>Add photos after repair is completed.</p>
          {form.afterImages.length > 0 && (
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#525f80', marginTop: '8px' }}>
              {form.afterImages.length} image{form.afterImages.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
          Cancel
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
          {loading ? 'Saving...' : mode === 'edit' ? 'Update Repair' : 'Add Repair'}
        </button>
      </div>
    </form>
  );
}