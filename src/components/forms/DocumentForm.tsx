'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentType } from '@/types';
import { uploadPdf, deleteFile, isPdfFile } from '@/lib/uploadClient';

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
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus('Uploading...');

    let result;
    if (isPdfFile(file.name)) {
      result = await uploadPdf(file, 'documents');
    } else {
      result = await uploadPdf(file, 'documents');
    }

    if (result.url) {
      setForm((prev) => ({
        ...prev,
        fileUrl: result.url!,
        fileName: file.name,
      }));
      setUploadStatus('Uploaded successfully');
    } else {
      setUploadStatus(`Upload failed: ${result.error}`);
    }
    setUploading(false);
  };

  const removeFile = async () => {
    if (form.fileUrl.startsWith('/uploads/')) {
      await deleteFile(form.fileUrl);
    }
    setForm((prev) => ({ ...prev, fileUrl: '', fileName: '' }));
    setUploadStatus('');
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
          <label style={labelStyle}>Document Type *</label>
          <select
            name="documentType"
            required
            value={form.documentType}
            onChange={handleChange}
            style={inputStyle}
          >
            {['Insurance', 'Road Permit', 'Registration Card'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Issue Date *</label>
          <input
            name="issueDate"
            type="date"
            required
            value={form.issueDate}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Expiry Date *</label>
          <input
            name="expiryDate"
            type="date"
            required
            value={form.expiryDate}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Upload Document File</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
          disabled={uploading}
          style={{ ...inputStyle, height: 'auto', padding: '8px', border: '1px dashed #ced4da', background: '#f8f9fa' }}
        />
        <p style={{ fontSize: '12px', color: '#9ca8b3', marginTop: '4px' }}>
          {uploading ? uploadStatus : 'Accepted formats: PDF, JPG, JPEG, PNG.'}
        </p>
        {form.fileName && (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <p
              style={{
                background: 'rgba(66, 202, 127, 0.1)',
                border: '1px solid #42ca7f',
                borderRadius: '3px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#42ca7f',
                margin: 0,
              }}
            >
              Selected file: {form.fileName}
            </p>
            <button
              type="button"
              onClick={removeFile}
              style={{
                background: '#ec4561',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          style={{ ...inputStyle, height: 'auto', padding: '8px 1rem' }}
        />
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
          {loading ? 'Saving...' : mode === 'edit' ? 'Update Document' : 'Add Document'}
        </button>
      </div>
    </form>
  );
}