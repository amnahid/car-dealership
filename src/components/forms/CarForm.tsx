'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CarStatus } from '@/types';
import { uploadImage, deleteFile } from '@/lib/uploadClient';

interface PurchaseData {
  supplierName: string;
  supplierContact: string;
  purchasePrice: string;
  purchaseDate: string;
  documentUrl?: string;
  notes: string;
}

interface CarFormData {
  brand: string;
  model: string;
  year: string;
  engineNumber: string;
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
  supplierName: '',
  supplierContact: '',
  purchasePrice: '',
  purchaseDate: '',
  documentUrl: '',
  notes: '',
};

export default function CarForm({ initialData, mode }: CarFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState<CarFormData>({
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    engineNumber: '',
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
        purchase: initialData.purchase ? {
          ...emptyPurchase,
          supplierName: initialData.purchase.supplierName || '',
          supplierContact: initialData.purchase.supplierContact || '',
          purchasePrice: initialData.purchase.purchasePrice?.toString() || '',
          purchaseDate: initialData.purchase.purchaseDate?.toString() || '',
          documentUrl: initialData.purchase.documentUrl || '',
          notes: initialData.purchase.notes || '',
        } : { ...emptyPurchase },
      }));
    }
  // initialData is only used to populate the form on mount/edit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?._id]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    setUploadProgress(`Uploading 0/${files.length}...`);

    const newImages: string[] = [];
    let uploaded = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${i + 1}/${files.length}...`);
      
      const result = await uploadImage(file, 'cars');
      if (result.url) {
        newImages.push(result.url);
      } else {
        alert(`Failed to upload ${file.name}: ${result.error}`);
      }
      uploaded = i + 1;
      setUploadProgress(`Uploading ${uploaded}/${files.length}...`);
    }

    setForm((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
    setUploading(false);
    setUploadProgress('');
  };

  const handlePurchaseDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImage(file, 'cars/purchase');
      if (result.url) {
        setForm((prev) => ({
          ...prev,
          purchase: { ...prev.purchase, documentUrl: result.url },
        }));
      } else {
        alert(`Failed to upload: ${result.error}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = form.images[index];
    if (imageUrl.startsWith('/uploads/')) {
      await deleteFile(imageUrl);
    }
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
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
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#2a3142',
    marginBottom: '4px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2a3142',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e9ecef',
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

      <div style={sectionTitleStyle}>Purchase Information</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Supplier Name *</label>
          <input
            name="purchase.supplierName"
            required
            value={form.purchase.supplierName}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Supplier Co."
          />
        </div>
        <div>
          <label style={labelStyle}>Supplier Contact</label>
          <input
            name="purchase.supplierContact"
            value={form.purchase.supplierContact}
            onChange={handleChange}
            style={inputStyle}
            placeholder="+1 234 567 8900"
          />
        </div>
        <div>
          <label style={labelStyle}>Purchase Price *</label>
          <input
            name="purchase.purchasePrice"
            type="number"
            required
            min="0"
            step="0.01"
            value={form.purchase.purchasePrice}
            onChange={handleChange}
            style={inputStyle}
            placeholder="25000"
          />
        </div>
        <div>
          <label style={labelStyle}>Purchase Date *</label>
          <input
            name="purchase.purchaseDate"
            type="date"
            required
            value={form.purchase.purchaseDate}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Purchase Document</label>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handlePurchaseDocUpload}
            disabled={uploading}
            style={fileInputStyle}
          />
          {form.purchase.documentUrl && (
            <div style={{ marginTop: '8px' }}>
              <a
                href={form.purchase.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#28aaa9', fontSize: '14px' }}
              >
                View Uploaded Document
              </a>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, purchase: { ...prev.purchase, documentUrl: '' } }))}
                style={{ marginLeft: '12px', color: '#ec4561', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
        <div>
          <label style={labelStyle}>Purchase Notes</label>
          <textarea
            name="purchase.notes"
            value={form.purchase.notes}
            onChange={handleChange}
            rows={2}
            style={{ ...inputStyle, height: 'auto', padding: '8px 1rem' }}
            placeholder="Additional notes about the purchase..."
          />
        </div>
      </div>

      <div style={sectionTitleStyle}>Vehicle Information</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
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
          disabled={uploading}
          style={fileInputStyle}
        />
        <p style={{ fontSize: '12px', color: '#9ca8b3', marginTop: '4px' }}>
          {uploading ? uploadProgress : 'Upload one or more images (JPG, PNG, WEBP). Images will be compressed.'}
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