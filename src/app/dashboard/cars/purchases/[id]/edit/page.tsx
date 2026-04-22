'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { uploadImage, deleteFile } from '@/lib/uploadClient';

interface Supplier {
  _id: string;
  supplierId: string;
  companyName: string;
  phone: string;
}

interface PurchaseFormData {
  supplier: string;
  supplierName: string;
  supplierContact: string;
  purchasePrice: string;
  purchaseDate: string;
  isNewCar: boolean;
  conditionImages: string[];
  insuranceUrl: string;
  insuranceExpiry: string;
  registrationUrl: string;
  registrationExpiry: string;
  roadPermitUrl: string;
  roadPermitExpiry: string;
  documentUrl: string;
  notes: string;
}

export default function PurchaseEditPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [form, setForm] = useState<PurchaseFormData>({
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
  });

  useEffect(() => {
    fetchSuppliers();
    if (params.id) {
      fetchPurchase();
    }
  }, [params.id]);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers?list=true');
      const data = await res.json();
      if (data.suppliers) {
        setSuppliers(data.suppliers);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  const fetchPurchase = async () => {
    try {
      const res = await fetch(`/api/cars/purchases/${params.id}`);
      const data = await res.json();
      if (res.ok && data.purchase) {
        const p = data.purchase;
        setForm({
          supplier: p.supplier?._id || '',
          supplierName: p.supplierName || '',
          supplierContact: p.supplierContact || '',
          purchasePrice: p.purchasePrice?.toString() || '',
          purchaseDate: p.purchaseDate ? p.purchaseDate.split('T')[0] : '',
          isNewCar: p.isNewCar ?? true,
          conditionImages: p.conditionImages || [],
          insuranceUrl: p.insuranceUrl || '',
          insuranceExpiry: p.insuranceExpiry ? p.insuranceExpiry.split('T')[0] : '',
          registrationUrl: p.registrationUrl || '',
          registrationExpiry: p.registrationExpiry ? p.registrationExpiry.split('T')[0] : '',
          roadPermitUrl: p.roadPermitUrl || '',
          roadPermitExpiry: p.roadPermitExpiry ? p.roadPermitExpiry.split('T')[0] : '',
          documentUrl: p.documentUrl || '',
          notes: p.notes || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch purchase:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name.startsWith('purchase.')) {
      const field = name.replace('purchase.', '');
      setForm((prev) => ({ ...prev, [field]: value }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const supplierId = e.target.value;
    const supplier = suppliers.find((s) => s._id === supplierId);
    setForm((prev) => ({
      ...prev,
      supplier: supplierId,
      supplierName: supplier?.companyName || '',
      supplierContact: supplier?.phone || '',
    }));
  };

  const handleConditionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const result = await uploadImage(files[i], 'cars/condition');
      if (result.url) {
        newImages.push(result.url);
      }
    }

    setForm((prev) => ({ ...prev, conditionImages: [...prev.conditionImages, ...newImages] }));
    setUploading(false);
  };

  const handleRemoveConditionImage = async (index: number) => {
    const url = form.conditionImages[index];
    if (url.startsWith('/uploads/')) {
      await deleteFile(url);
    }
    setForm((prev) => ({
      ...prev,
      conditionImages: prev.conditionImages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        purchasePrice: parseFloat(form.purchasePrice),
      };

      const res = await fetch(`/api/cars/purchases/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update purchase');
        return;
      }

      router.push(`/dashboard/cars/purchases/${params.id}`);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    background: '#fff',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#333',
    marginBottom: '6px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#2b2d5d',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e9ecef',
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href={`/dashboard/cars/purchases/${params.id}`} style={{ fontSize: '14px', color: '#28aaa9', textDecoration: 'none' }}>
          ← Back to Purchase
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#2b2d5d', marginTop: '8px' }}>Edit Purchase</h1>
      </div>

      {error && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div style={sectionTitleStyle}>Supplier Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Supplier</label>
            <select
              name="supplier"
              value={form.supplier}
              onChange={handleSupplierChange}
              style={inputStyle}
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.companyName} ({s.supplierId})
                </option>
              ))}
            </select>
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
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div style={sectionTitleStyle}>Purchase Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Purchase Price *</label>
            <input
              name="purchasePrice"
              type="number"
              value={form.purchasePrice}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Purchase Date *</label>
            <input
              name="purchaseDate"
              type="date"
              value={form.purchaseDate}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Car Type</label>
            <select
              name="isNewCar"
              value={form.isNewCar.toString()}
              onChange={(e) => setForm((prev) => ({ ...prev, isNewCar: e.target.value === 'true' }))}
              style={inputStyle}
            >
              <option value="true">New Car</option>
              <option value="false">Used Car</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div style={sectionTitleStyle}>Condition Images</div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleConditionImageUpload}
          disabled={uploading}
          style={{ ...inputStyle, border: '1px dashed #ddd', padding: '20px' }}
        />
        {form.conditionImages.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            {form.conditionImages.map((img, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={img} alt={`Condition ${i + 1}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />
                <button
                  type="button"
                  onClick={() => handleRemoveConditionImage(i)}
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div style={sectionTitleStyle}>Vehicle Documents</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Insurance Expiry</label>
            <input
              name="insuranceExpiry"
              type="date"
              value={form.insuranceExpiry}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Registration Expiry</label>
            <input
              name="registrationExpiry"
              type="date"
              value={form.registrationExpiry}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Road Permit Expiry</label>
            <input
              name="roadPermitExpiry"
              type="date"
              value={form.roadPermitExpiry}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div style={sectionTitleStyle}>Notes</div>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={4}
          style={{ ...inputStyle, height: 'auto', resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 500,
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 500,
            background: '#28aaa9',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}