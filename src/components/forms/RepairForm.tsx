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

  const inputClass =
    'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const fileInputClass =
    'block w-full cursor-pointer rounded-md border border-dashed border-gray-300 bg-gray-50 p-2 text-sm text-gray-700 transition-colors focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Car *</label>
          <select name="car" required value={form.car} onChange={handleChange} className={inputClass}>
            <option value="">Select a car</option>
            {cars.map((car) => (
              <option key={car._id} value={car._id}>
                {car.carId} - {car.brand} {car.model}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Repair Date *</label>
          <input name="repairDate" type="date" required value={form.repairDate} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Labor Cost ($)</label>
          <input name="laborCost" type="number" min="0" step="0.01" value={form.laborCost} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Parts/Repair Cost ($)</label>
          <input name="repairCost" type="number" min="0" step="0.01" value={form.repairCost} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            {['Pending', 'In Progress', 'Completed'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Repair Description *</label>
        <textarea name="repairDescription" required value={form.repairDescription} onChange={handleChange} rows={3} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Parts Replaced</label>
        <textarea name="partsReplaced" value={form.partsReplaced} onChange={handleChange} rows={2} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="before-images" className={labelClass}>Before Images</label>
          <input
            id="before-images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload('beforeImages')}
            className={fileInputClass}
          />
          <p className="mt-1 text-xs text-gray-500">Add photos before repair work starts.</p>
          {form.beforeImages.length > 0 && (
            <p className="mt-2 text-xs font-medium text-gray-600">{form.beforeImages.length} image{form.beforeImages.length > 1 ? 's' : ''} selected</p>
          )}
        </div>
        <div>
          <label htmlFor="after-images" className={labelClass}>After Images</label>
          <input
            id="after-images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload('afterImages')}
            className={fileInputClass}
          />
          <p className="mt-1 text-xs text-gray-500">Add photos after repair is completed.</p>
          {form.afterImages.length > 0 && (
            <p className="mt-2 text-xs font-medium text-gray-600">{form.afterImages.length} image{form.afterImages.length > 1 ? 's' : ''} selected</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:opacity-60">
          {loading ? 'Saving...' : mode === 'edit' ? 'Update Repair' : 'Add Repair'}
        </button>
      </div>
    </form>
  );
}
