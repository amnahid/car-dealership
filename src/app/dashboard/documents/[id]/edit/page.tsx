'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { uploadPdf, deleteFile } from '@/lib/uploadClient';
import SearchableSelect from '@/components/SearchableSelect';

interface CarOption {
  _id: string;
  carId: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  plateNumber?: string;
}

interface DocData {
  _id: string;
  car: string;
  carId: string;
  documentType: string;
  issueDate: string;
  expiryDate: string;
  fileUrl: string;
  fileName: string;
  notes: string;
}

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cars, setCars] = useState<CarOption[]>([]);
  
  const [form, setForm] = useState<DocData>({
    _id: '',
    car: '',
    carId: '',
    documentType: 'Insurance',
    issueDate: '',
    expiryDate: '',
    fileUrl: '',
    fileName: '',
    notes: '',
  });

  useEffect(() => {
    fetch('/api/cars?limit=100')
      .then(r => r.json())
      .then(data => setCars(data.cars || []))
      .catch(console.error);
    
    if (id) {
      fetch(`/api/documents/${id}`)
        .then(r => r.json())
        .then(data => {
          if (data.document) {
            setForm({
              _id: data.document._id,
              car: data.document.car?._id || data.document.car,
              carId: data.document.carId,
              documentType: data.document.documentType,
              issueDate: data.document.issueDate?.split('T')[0] || '',
              expiryDate: data.document.expiryDate?.split('T')[0] || '',
              fileUrl: data.document.fileUrl || '',
              fileName: data.document.fileName || '',
              notes: data.document.notes || '',
            });
          }
        });
    }
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadPdf(file, 'documents');
    if (result.url) {
      setForm(prev => ({ ...prev, fileUrl: result.url!, fileName: file.name }));
    }
    setUploading(false);
  };

  const handleRemoveFile = async () => {
    if (form.fileUrl.startsWith('/uploads/')) {
      await deleteFile(form.fileUrl);
    }
    setForm(prev => ({ ...prev, fileUrl: '', fileName: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.car) { setError('Select a car'); return; }
    if (!form.issueDate || !form.expiryDate) { setError('Fill dates'); return; }
    
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const resData = await res.json();
      if (res.ok) {
        if (resData.isPending) {
          alert(resData.message || 'Edit request submitted for admin approval');
        }
        router.push('/dashboard/documents');
      } else {
        setError(resData.error || 'Failed to save');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    fontSize: '14px',
    borderRadius: '0',
    padding: '0 12px',
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
    <form onSubmit={handleSubmit} style={{ marginBottom: '24px', maxWidth: '600px' }}>
      {error && <div style={{ background: '#fff5f5', border: '1px solid #ec4561', borderRadius: '3px', padding: '12px', marginBottom: '20px', color: '#ec4561' }}>{error}</div>}
      
      <SearchableSelect
        label="Car *"
        value={form.car}
        onChange={(v) => setForm(p => ({ ...p, car: v }))}
        options={cars.map(c => ({ 
          value: c._id, 
          label: `${c.brand} ${c.model} (${c.year})${c.plateNumber ? ` - ${c.plateNumber}` : ` - ${c.carId}`}${c.color ? ` - ${c.color}` : ''}`
        }))}
        placeholder="Select car..."
      />

      <div style={{ marginTop: '16px' }}>
        <label style={labelStyle}>Document Type *</label>
        <select value={form.documentType} onChange={e => setForm(p => ({ ...p, documentType: e.target.value }))} style={inputStyle}>
          {['Insurance', 'Road Permit', 'Registration Card'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
        <div>
          <label style={labelStyle}>Issue Date *</label>
          <input type="date" value={form.issueDate} onChange={e => setForm(p => ({ ...p, issueDate: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Expiry Date *</label>
          <input type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} style={inputStyle} />
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <label style={labelStyle}>File</label>
        {form.fileUrl ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f0fdf4', border: '1px solid #42ca7f', borderRadius: '4px' }}>
            <span style={{ flex: 1 }}>{form.fileName}</span>
            <button type="button" onClick={handleRemoveFile} style={{ background: '#ec4561', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '3px', cursor: 'pointer' }}>Remove</button>
          </div>
        ) : (
          <label style={{ display: 'block', padding: '30px', border: '2px dashed #ced4da', background: '#f8f9fa', textAlign: 'center', cursor: 'pointer' }}>
            {uploading ? 'Uploading...' : 'Click to upload file'}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
          </label>
        )}
      </div>

      <div style={{ marginTop: '16px' }}>
        <label style={labelStyle}>Notes</label>
        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ ...inputStyle, height: 'auto', padding: '8px' }} />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button type="button" onClick={() => router.back()} style={{ padding: '10px 20px', border: '1px solid #ced4da', background: '#fff', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
        <button type="submit" disabled={saving} style={{ padding: '10px 20px', background: '#28aaa9', color: '#fff', border: '1px solid #28aaa9', borderRadius: '3px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}