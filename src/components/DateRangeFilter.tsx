'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

export type DateRangePreset = 'all' | '7d' | '30d' | '90d' | '1y' | 'custom';

interface DateRangeFilterProps {
  onChange: (startDate: string, endDate: string) => void;
  initialPreset?: DateRangePreset;
  initialStartDate?: string;
  initialEndDate?: string;
}

export function DateRangeFilter({ 
  onChange, 
  initialPreset = 'all',
  initialStartDate = '',
  initialEndDate = ''
}: DateRangeFilterProps) {
  const t = useTranslations('Charts.DateRange');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  const [preset, setPreset] = useState<DateRangePreset>(initialPreset);
  const [customStart, setCustomStart] = useState(initialStartDate);
  const [customEnd, setCustomEnd] = useState(initialEndDate);

  const presetRanges: Record<string, { label: string; days?: number }> = {
    'all': { label: t('allTime') || 'All time' },
    '7d': { label: t('last7Days') || 'Last 7 days', days: 7 },
    '30d': { label: t('last30Days') || 'Last 30 days', days: 30 },
    '90d': { label: t('last90Days') || 'Last 90 days', days: 90 },
    '1y': { label: t('lastYear') || 'Last year', days: 365 },
  };

  const handlePresetChange = (newPreset: DateRangePreset) => {
    setPreset(newPreset);
    if (newPreset === 'all') {
      setCustomStart('');
      setCustomEnd('');
      onChange('', '');
      return;
    }

    const days = presetRanges[newPreset]?.days;
    if (days) {
      const now = new Date();
      const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const startStr = start.toISOString().split('T')[0];
      const endStr = now.toISOString().split('T')[0];
      setCustomStart(startStr);
      setCustomEnd(endStr);
      onChange(startStr, endStr);
    }
  };

  const handleStartChange = (val: string) => {
    setCustomStart(val);
    setPreset('custom');
    if (val && customEnd) {
      onChange(val, customEnd);
    } else if (!val && !customEnd) {
      setPreset('all');
      onChange('', '');
    }
  };

  const handleEndChange = (val: string) => {
    setCustomEnd(val);
    setPreset('custom');
    if (customStart && val) {
      onChange(customStart, val);
    } else if (!customStart && !val) {
      setPreset('all');
      onChange('', '');
    }
  };

  const handleClear = () => {
    setPreset('all');
    setCustomStart('');
    setCustomEnd('');
    onChange('', '');
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
      <select
        value={preset}
        onChange={(e) => handlePresetChange(e.target.value as DateRangePreset)}
        style={{
          height: '36px',
          padding: '0 12px',
          fontSize: '14px',
          borderRadius: '3px',
          border: '1px solid #ced4da',
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        {Object.entries(presetRanges).map(([value, { label }]) => (
          <option key={value} value={value}>{label}</option>
        ))}
        {preset === 'custom' && (
          <option value="custom">{t('custom') || 'Custom Range'}</option>
        )}
      </select>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <input
          type="date"
          value={customStart}
          onChange={(e) => handleStartChange(e.target.value)}
          style={{ height: '36px', fontSize: '14px', borderRadius: '3px', padding: '0 8px', border: '1px solid #ced4da', background: '#fff' }}
        />
        <span style={{ color: '#9ca8b3', fontSize: '13px' }}>{t('to') || 'to'}</span>
        <input
          type="date"
          value={customEnd}
          onChange={(e) => handleEndChange(e.target.value)}
          style={{ height: '36px', fontSize: '14px', borderRadius: '3px', padding: '0 8px', border: '1px solid #ced4da', background: '#fff' }}
        />
        {(customStart || customEnd || preset !== 'all') && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              height: '36px',
              padding: '0 10px',
              fontSize: '13px',
              background: '#f8f9fa',
              border: '1px solid #ced4da',
              borderRadius: '3px',
              cursor: 'pointer',
              color: '#495057',
            }}
            title="Reset Date Filter"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
