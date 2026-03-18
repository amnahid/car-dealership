'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CarStatus } from '@/types';

interface CarFormData {
  supplierName: string;
  supplierContact: string;
  purchasePrice: string;
  purchaseDate: string;
  brand: string;
  model: string;
  year: string;
  engineNumber: string;
  chassisNumber: string;
  color: string;
  status: CarStatus;
  notes: string;
  images: string[];
}

interface CarFormProps {
  initialData?: Partial<CarFormData> & { _id?: string };
  mode: 'create' | 'edit';
}

export default function CarForm({ initialData, mode }: CarFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<CarFormData>({
    supplierName: '',
    supplierContact: '',
    purchasePrice: '',
    purchaseDate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    engineNumber: '',
    chassisNumber: '',
    color: '',
    status: 'In Stock',
    notes: '',
    images: [],
  });

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
        purchasePrice: initialData.purchasePrice?.toString() || '',
        year: initialData.year?.toString() || new Date().getFullYear().toString(),
      }));
    }
  // initialData is only used to populate the form on mount/edit; intentionally omitting to avoid infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?._id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setForm((prev) => ({ ...prev, images: [...prev.images, base64] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        purchasePrice: parseFloat(form.purchasePrice),
        year: parseInt(form.year),
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

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Supplier Name *</label>
          <input name="supplierName" required value={form.supplierName} onChange={handleChange} className={inputClass} placeholder="Supplier Co." />
        </div>
        <div>
          <label className={labelClass}>Supplier Contact</label>
          <input name="supplierContact" value={form.supplierContact} onChange={handleChange} className={inputClass} placeholder="+1 234 567 8900" />
        </div>
        <div>
          <label className={labelClass}>Purchase Price *</label>
          <input name="purchasePrice" type="number" required min="0" step="0.01" value={form.purchasePrice} onChange={handleChange} className={inputClass} placeholder="25000" />
        </div>
        <div>
          <label className={labelClass}>Purchase Date *</label>
          <input name="purchaseDate" type="date" required value={form.purchaseDate} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Brand *</label>
          <input name="brand" required value={form.brand} onChange={handleChange} className={inputClass} placeholder="Toyota" />
        </div>
        <div>
          <label className={labelClass}>Model *</label>
          <input name="model" required value={form.model} onChange={handleChange} className={inputClass} placeholder="Camry" />
        </div>
        <div>
          <label className={labelClass}>Year *</label>
          <input name="year" type="number" required min="1900" max={new Date().getFullYear() + 1} value={form.year} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Color</label>
          <input name="color" value={form.color} onChange={handleChange} className={inputClass} placeholder="Silver" />
        </div>
        <div>
          <label className={labelClass}>Engine Number</label>
          <input name="engineNumber" value={form.engineNumber} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Chassis Number *</label>
          <input name="chassisNumber" required value={form.chassisNumber} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            {['In Stock', 'Under Repair', 'Reserved', 'Sold', 'Rented'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className={inputClass} placeholder="Additional notes..." />
      </div>

      <div>
        <label className={labelClass}>Images</label>
        <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="text-sm text-gray-500" />
        {form.images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {form.images.map((img, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`Car image ${i + 1}`} className="w-20 h-20 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:opacity-60">
          {loading ? 'Saving...' : mode === 'edit' ? 'Update Car' : 'Add Car'}
        </button>
      </div>
    </form>
  );
}
