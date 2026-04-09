'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentType } from '@/types';

interface DocumentFormData {
  car: string;
  carId: string;
  documentType: DocumentType;
  issueDate: string;
  expiryDate: string;
  fileUrl: string;
  fileName: string;
  notes: string;
}

interface CarOption {
  _id: string;
  carId: string;
  brand: string;
  model: string;
}

interface DocumentFormProps {
  initialData?: Partial<DocumentFormData> & { _id?: string };
  mode: 'create' | 'edit';
}

export default function DocumentForm({ initialData, mode }: DocumentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cars, setCars] = useState<CarOption[]>([]);

  const [form, setForm] = useState<DocumentFormData>({
    car: '',
    carId: '',
    documentType: 'Insurance',
    issueDate: '',
    expiryDate: '',
    fileUrl: '',
    fileName: '',
    notes: '',
    ...initialData,
  });

  useEffect(() => {
    fetch('/api/cars?limit=100')
      .then((r) => r.json())
      .then((data) => setCars(data.cars || []))
      .catch(console.error);
  }, []);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({
        ...prev,
        fileUrl: ev.target?.result as string,
        fileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = mode === 'edit' && initialData?._id ? `/api/documents/${initialData._id}` : '/api/documents';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save document');
        return;
      }

      router.push('/dashboard/documents');
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
          <label className={labelClass}>Document Type *</label>
          <select name="documentType" required value={form.documentType} onChange={handleChange} className={inputClass}>
            {['Insurance', 'Road Permit', 'Registration Card'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Issue Date *</label>
          <input name="issueDate" type="date" required value={form.issueDate} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Expiry Date *</label>
          <input name="expiryDate" type="date" required value={form.expiryDate} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="document-file" className={labelClass}>Upload Document File</label>
        <input
          id="document-file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
          className={fileInputClass}
        />
        <p className="mt-1 text-xs text-gray-500">Accepted formats: PDF, JPG, JPEG, PNG.</p>
        {form.fileName && (
          <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            Selected file: {form.fileName}
          </p>
        )}
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className={inputClass} />
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:opacity-60">
          {loading ? 'Saving...' : mode === 'edit' ? 'Update Document' : 'Add Document'}
        </button>
      </div>
    </form>
  );
}
