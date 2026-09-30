'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

interface DocumentFormProps {
  mode: 'create' | 'edit';
}

export default function DocumentForm({ mode }: DocumentFormProps) {
  const t = useTranslations('DocumentForm');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const router = useRouter();
  const searchParams = useSearchParams();
  const carIdParam = searchParams?.get('carId');

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [cars, setCars] = useState<CarOption[]>([]);
  const [selectedCar, setSelectedCar] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Insurance': true,
  });

  const [docs, setDocs] = useState<Record<string, DocSection>>({
    'Insurance': { documentType: 'Insurance', issueDate: '', expiryDate: '', fileUrl: '', fileName: '', enabled: true },
    'Road Permit': { documentType: 'Road Permit', issueDate: '', expiryDate: '', fileUrl: '', fileName: '', enabled: true },
    'Registration Card': { documentType: 'Registration Card', issueDate: '', expiryDate: '', fileUrl: '', fileName: '', enabled: true },
  });

  useEffect(() => {
    fetch('/api/cars?limit=100')
      .then(r => r.json())
      .then(data => {
        const carList: CarOption[] = data.cars || [];
        setCars(carList);
        if (carIdParam && carList.length > 0) {
          const found = carList.find(c => c._id === carIdParam || c.carId === carIdParam);
          if (found) {
            setSelectedCar(found._id);
          }
        }
      })
      .catch(console.error);
  }, [carIdParam]);

  const updateDoc = (type: string, field: keyof DocSection, value: string | boolean) => {
    setDocs(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
    if (error) setError('');
  };

  const handleFileUpload = async (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    if (error) setError('');
    
    const result = await uploadPdf(file, 'documents');
    
    if (result.url) {
      setDocs(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          fileUrl: result.url!,
          fileName: file.name,
        },
      }));
      setExpandedSections(prev => ({ ...prev, [type]: true }));
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // A document is active if it has a file uploaded or if any dates were provided
    const docsWithData = Object.values(docs).filter(d => 
      d.enabled && (d.fileUrl || d.issueDate || d.expiryDate)
    );

    if (docsWithData.length === 0) {
      setError(t('errors.addAtLeastOne'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate that each document being submitted has both valid issueDate and expiryDate
    for (const doc of docsWithData) {
      if (!doc.issueDate || !doc.expiryDate) {
        setError(t('errors.datesRequired', { type: t(`types.${doc.documentType}`) }));
        setExpandedSections(prev => ({ ...prev, [doc.documentType]: true }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (new Date(doc.expiryDate) < new Date(doc.issueDate)) {
        setError(t('errors.invalidDateRange', { type: t(`types.${doc.documentType}`) }));
        setExpandedSections(prev => ({ ...prev, [doc.documentType]: true }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setLoading(true);

    try {
      const car = cars.find(c => c._id === selectedCar);
      
      const documents = docsWithData.map(doc => ({
        car: selectedCar,
        carId: car?.carId || '',
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
        <div style={{
          background: '#fef2f2',
          border: '1px solid #f87171',
          borderRadius: '6px',
          padding: '14px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          direction: isRtl ? 'rtl' : 'ltr',
          textAlign: isRtl ? 'right' : 'left',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, color: '#dc2626' }}>
            <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" fill="currentColor" />
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#b91c1c', fontSize: '14px', fontWeight: 600, margin: 0 }}>
              {error}
            </p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px', direction: isRtl ? 'rtl' : 'ltr' }}>
        <SearchableSelect
          label={commonT('brand')}
          value={selectedCar}
          onChange={(val) => {
            setSelectedCar(val);
            if (error) setError('');
          }}
          options={cars.map(c => ({ 
            value: c._id, 
            label: `${c.brand} ${c.model} (${c.year})${c.plateNumber ? ` - ${c.plateNumber}` : ` - ${c.carId}`}${c.color ? ` - ${c.color}` : ''}`
          }))}
          placeholder={t('selectCar')}
        />
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
                  <label style={labelStyle}>
                    {t('issueDate')} <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={docs[type].issueDate}
                    onChange={(e) => updateDoc(type, 'issueDate', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    {t('expiryDate')} <span style={{ color: '#dc2626' }}>*</span>
                  </label>
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
