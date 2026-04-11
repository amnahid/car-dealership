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
          <label style={labelStyle}>Supplier Name *</label>
          <input
            name="supplierName"
            required
            value={form.supplierName}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Supplier Co."
          />
        </div>
        <div>
          <label style={labelStyle}>Supplier Contact</label>
          <input
            name="supplierContact"
            value={form.supplierContact}
            onChange={handleChange}
            style={inputStyle}
            placeholder="+1 234 567 8900"
          />
        </div>
        <div>
          <label style={labelStyle}>Purchase Price *</label>
          <input
            name="purchasePrice"
            type="number"
            required
            min="0"
            step="0.01"
            value={form.purchasePrice}
            onChange={handleChange}
            style={inputStyle}
            placeholder="25000"
          />
        </div>
        <div>
          <label style={labelStyle}>Purchase Date *</label>
          <input
            name="purchaseDate"
            type="date"
            required
            value={form.purchaseDate}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Brand *</label>
          <input
            name="brand"
            required
            value={form.brand}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Toyota"
          />
        </div>
        <div>
          <label style={labelStyle}>Model *</label>
          <input
            name="model"
            required
            value={form.model}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Camry"
          />
        </div>
        <div>
          <label style={labelStyle}>Year *</label>
          <input
            name="year"
            type="number"
            required
            min="1900"
            max={new Date().getFullYear() + 1}
            value={form.year}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Color</label>
          <input
            name="color"
            value={form.color}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Silver"
          />
        </div>
        <div>
          <label style={labelStyle}>Engine Number</label>
          <input
            name="engineNumber"
            value={form.engineNumber}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Chassis Number *</label>
          <input
            name="chassisNumber"
            required
            value={form.chassisNumber}
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
            {['In Stock', 'Under Repair', 'Reserved', 'Sold', 'Rented'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          style={{ ...inputStyle, height: 'auto', padding: '8px 1rem' }}
          placeholder="Additional notes..."
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Images</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          style={fileInputStyle}
        />
        <p style={{ fontSize: '12px', color: '#9ca8b3', marginTop: '4px' }}>
          Upload one or more images (JPG, PNG, WEBP).
        </p>
        {form.images.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#525f80', marginBottom: '8px' }}>
              {form.images.length} image{form.images.length > 1 ? 's' : ''} selected
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {form.images.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img
                    src={img}
                    alt={`Car image ${i + 1}`}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '3px' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#ec4561',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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
          {loading ? 'Saving...' : mode === 'edit' ? 'Update Car' : 'Add Car'}
        </button>
      </div>
    </form>
  );
}