'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { uploadPdf, deleteFile } from '@/lib/uploadClient';
import SearchableSelect from '@/components/SearchableSelect';
import { useTranslations, useLocale } from 'next-intl';

interface CarOption {
  _id: string;
  carId: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  plateNumber?: string;
}

interface DocSection {
  documentType: string;
  issueDate: string;
  expiryDate: string;
  fileUrl: string;
  fileName: string;
  enabled: boolean;
}

const DOCUMENT_TYPES = ['Insurance', 'Road Permit', 'Registration Card'];

const DEFAULT_EXPIRY_MONTHS: Record<string, number> = {
  'Insurance': 12,
  'Road Permit': 12,
  'Registration Card': 0,
};

interface DocumentFormProps {
  mode: 'create' | 'edit';
}

export default function DocumentForm({ mode }: DocumentFormProps) {
  const t = useTranslations('DocumentForm');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [cars, setCars] = useState<CarOption[]>([]);
  const [selectedCar, setSelectedCar] = useState('');
  const [autoFill, setAutoFill] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const [docs, setDocs] = useState<Record<string, DocSection>>({
    'Insurance': { documentType: 'Insurance', issueDate: '', expiryDate: '', fileUrl: '', fileName: '', enabled: true },
    'Road Permit': { documentType: 'Road Permit', issueDate: '', expiryDate: '', fileUrl: '', fileName: '', enabled: true },
    'Registration Card': { documentType: 'Registration Card', issueDate: '', expiryDate: '', fileUrl: '', fileName: '', enabled: true },
  });

  useEffect(() => {
    fetch('/api/cars?limit=100')
      .then(r => r.json())
      .then(data => setCars(data.cars || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (autoFill && selectedCar) {
      const today = new Date();
      const updated = { ...docs };
      
      Object.keys(updated).forEach(type => {
        const months = DEFAULT_EXPIRY_MONTHS[type];
        if (months > 0) {
          const issueDate = today.toISOString().split('T')[0];
          const expDate = new Date(today.setMonth(today.getMonth() + months));
          updated[type] = {
            ...updated[type],
            issueDate,
            expiryDate: expDate.toISOString().split('T')[0],
          };
        }
      });
      
      setDocs(updated);
    }
  }, [autoFill, selectedCar]);

  const updateDoc = (type: string, field: keyof DocSection, value: string | boolean) => {
    setDocs(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const handleFileUpload = async (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    
    const result = await uploadPdf(file, 'documents');
    
    if (result.url) {
      setDocs(prev => ({
        ...prev,
        [type]: { ...prev[type], fileUrl: result.url!, fileName: file.name },
      }));
    }
    
    setUploading(null);
  };

  const removeFile = async (type: string) => {
    const url = docs[type].fileUrl;
    if (url.startsWith('/uploads/')) {
      await deleteFile(url);
    }
    setDocs(prev => ({
      ...prev,
      [type]: { ...prev[type], fileUrl: '', fileName: '' },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCar) {
      setError(t('errors.selectCar'));
      return;
    }

    const docsWithData = Object.values(docs).filter(d => 
      d.enabled && (d.fileUrl || (d.issueDate && d.expiryDate))
    );
    if (docsWithData.length === 0) {
      setError(t('errors.addAtLeastOne'));
      return;
    }

    setLoading(true);

    try {
      const car = cars.find(c => c._id === selectedCar);
      
      const documents = docsWithData.map(doc => ({
        car: selectedCar,
        carId: car?.carId,
        documentType: doc.documentType,
        issueDate: doc.issueDate,
        expiryDate: doc.expiryDate,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        notes: '',
      }));

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to save (${res.status})`);
        return;
      }

      router.push('/dashboard/documents');
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
    padding: '0 12px',
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
        <SearchableSelect
          label={commonT('brand')}
          value={selectedCar}
          onChange={setSelectedCar}
          options={cars.map(c => ({ 
            value: c._id, 
            label: `${c.brand} ${c.model} (${c.year})${c.plateNumber ? ` - ${c.plateNumber}` : ` - ${c.carId}`}${c.color ? ` - ${c.color}` : ''}`
          }))}
          placeholder={t('selectCar')}
        />
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <input
              type="checkbox"
              checked={autoFill}
              onChange={(e) => setAutoFill(e.target.checked)}
            />
            <span style={{ fontSize: '14px', color: '#525f80' }}>{t('autoFill')}</span>
          </label>
        </div>
      </div>

      {selectedCar && (
        <div style={{ marginBottom: '20px' }}>

        {DOCUMENT_TYPES.map(type => (
        <div key={type} className="card" style={{ marginBottom: '12px', padding: 0, overflow: 'hidden' }}>
          <div
            onClick={() => {
              const newExpanded = !expandedSections[type];
              setExpandedSections(prev => ({ ...prev, [type]: newExpanded }));
              if (newExpanded) {
                updateDoc(type, 'enabled', true);
              }
            }}
            style={{
              padding: '12px 16px',
              background: expandedSections[type] ? '#f0f8f8' : '#f8f9fa',
              borderBottom: expandedSections[type] ? '1px solid #e5e5e5' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              flexDirection: isRtl ? 'row-reverse' : 'row'
            }}
          >
            <span style={{ fontWeight: 600, color: '#2a3142' }}>{t(`types.${type}`)}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ transform: expandedSections[type] ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s', color: '#9ca8b3' }}>
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </div>

          {expandedSections[type] && (
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px', direction: isRtl ? 'rtl' : 'ltr' }}>
                <div>
                  <label style={labelStyle}>{t('issueDate')}</label>
                  <input
                    type="date"
                    value={docs[type].issueDate}
                    onChange={(e) => updateDoc(type, 'issueDate', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{t('expiryDate')}</label>
                  <input
                    type="date"
                    value={docs[type].expiryDate}
                    onChange={(e) => updateDoc(type, 'expiryDate', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <label style={labelStyle}>{t('uploadFile')}</label>
                {docs[type].fileUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f0fdf4', border: '1px solid #42ca7f', borderRadius: '4px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#42ca7f" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <span style={{ flex: 1, fontSize: '14px', color: '#2a3142', textAlign: isRtl ? 'right' : 'left' }}>{docs[type].fileName}</span>
                    <button type="button" onClick={() => removeFile(type)} style={{ background: '#ec4561', color: '#fff', border: 'none', borderRadius: '3px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                      {commonT('delete')}
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => document.getElementById(`file-${type}`)?.click()}
                    style={{
                      ...inputStyle,
                      height: '80px',
                      border: '2px dashed #ced4da',
                      background: '#f8f9fa',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      gap: '8px',
                    }}
                  >
                    {uploading === type ? (
                      <span style={{ fontSize: '12px', color: '#28aaa9' }}>{commonT('loading')}</span>
                    ) : (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca8b3" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span style={{ fontSize: '12px', color: '#9ca8b3' }}>{t('clickToUpload')}</span>
                      </>
                    )}
                  </div>
                )}
                <input
                  id={`file-${type}`}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(type, e)}
                  disabled={!!uploading}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}
        </div>
        ))}

        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
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
          {loading ? commonT('loading') : t('saveDocuments')}
        </button>
      </div>
    </form>
  );
}
