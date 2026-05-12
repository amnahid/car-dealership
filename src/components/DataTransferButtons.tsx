'use client';

import { useState, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface DataTransferButtonsProps {
  entityType: string;
  onImportSuccess?: () => void;
  showImport?: boolean;
  showExport?: boolean;
}

export default function DataTransferButtons({ 
  entityType, 
  onImportSuccess,
  showImport = true,
  showExport = true
}: DataTransferButtonsProps) {
  const t = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    window.location.href = `/api/export?type=${entityType}`;
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', entityType);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Import successful');
        if (onImportSuccess) onImportSuccess();
      } else {
        alert(data.error || 'Import failed');
      }
    } catch (err) {
      console.error('Import error:', err);
      alert('Network error during import');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
      {showExport && (
        <button
          onClick={handleExport}
          style={{
            background: '#ffffff',
            color: '#525f80',
            fontSize: '13px',
            fontWeight: 500,
            padding: '8px 12px',
            borderRadius: '3px',
            border: '1px solid #ced4da',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '16px' }}>↓</span> {t('exportLabel') || 'Export'}
        </button>
      )}
      
      {showImport && (
        <>
          <button
            onClick={handleImportClick}
            disabled={importing}
            style={{
              background: '#ffffff',
              color: '#525f80',
              fontSize: '13px',
              fontWeight: 500,
              padding: '8px 12px',
              borderRadius: '3px',
              border: '1px solid #ced4da',
              cursor: importing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: importing ? 0.7 : 1
            }}
          >
            <span style={{ fontSize: '16px' }}>↑</span> {importing ? t('loading') : t('import')}
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            style={{ display: 'none' }}
          />
        </>
      )}
    </div>
  );
}
