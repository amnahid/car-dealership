'use client';

import { useState, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { openPrintReportWindow, PrintColumn, ActiveFilterItem, SummaryStatItem } from '@/lib/printUtils';

interface DataTransferButtonsProps {
  entityType: string;
  onImportSuccess?: () => void;
  showImport?: boolean;
  showExport?: boolean;
  showPrint?: boolean;
  filters?: Record<string, any>;
  title?: string;
  subtitle?: string;
  columns?: PrintColumn[];
  data?: any[];
  summaryStats?: SummaryStatItem[];
  activeFiltersList?: ActiveFilterItem[];
  customPrintHandler?: () => void;
}

export default function DataTransferButtons({ 
  entityType, 
  onImportSuccess,
  showImport = true,
  showExport = true,
  showPrint = true,
  filters,
  title,
  subtitle,
  columns,
  data,
  summaryStats,
  activeFiltersList,
  customPrintHandler
}: DataTransferButtonsProps) {
  const t = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const params = new URLSearchParams();
    params.set('type', entityType);
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params.set(key, String(val));
        }
      });
    }
    window.location.href = `/api/export?${params.toString()}`;
  };

  const handlePrint = () => {
    if (customPrintHandler) {
      customPrintHandler();
      return;
    }

    if (columns && data) {
      openPrintReportWindow({
        title: title || `${entityType.toUpperCase()} Report`,
        subtitle,
        appName: isRtl ? 'أميال للسيارات' : 'AMYAL CAR',
        isRtl,
        activeFilters: activeFiltersList,
        summaryStats,
        columns,
        data,
      });
    } else {
      window.print();
    }
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

      const dataRes = await res.json();
      if (res.ok) {
        alert(dataRes.message || 'Import successful');
        if (onImportSuccess) onImportSuccess();
      } else {
        alert(dataRes.error || 'Import failed');
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
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
      {showPrint && (
        <button
          onClick={handlePrint}
          title={t('printReport')}
          style={{
            background: '#ffffff',
            color: '#334155',
            fontSize: '13px',
            fontWeight: 500,
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> {t('printReport')}
        </button>
      )}

      {showExport && (
        <button
          onClick={handleExport}
          title={t('exportLabel')}
          style={{
            background: '#ffffff',
            color: '#334155',
            fontSize: '13px',
            fontWeight: 500,
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> {t('exportLabel')}
        </button>
      )}
      
      {showImport && (
        <>
          <button
            onClick={handleImportClick}
            disabled={importing}
            title={t('import')}
            style={{
              background: '#ffffff',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 500,
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              cursor: importing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: importing ? 0.7 : 1,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> {importing ? t('loading') : t('import')}
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

