'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';

export type DateRangePreset = '7d' | '30d' | '90d' | '1y' | 'all';

interface DateRangeFilterProps {
  onChange: (startDate: string, endDate: string) => void;
  initialPreset?: DateRangePreset;
}

export function DateRangeFilter({ onChange, initialPreset = '1y' }: DateRangeFilterProps) {
  const t = useTranslations('Charts.DateRange');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  const [preset, setPreset] = useState<DateRangePreset>(initialPreset);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const presetRanges: Record<DateRangePreset, { label: string; days: number }> = {
    '7d': { label: t('last7Days'), days: 7 },
    '30d': { label: t('last30Days'), days: 30 },
    '90d': { label: t('last90Days'), days: 90 },
    '1y': { label: t('lastYear'), days: 365 },
    'all': { label: t('allTime'), days: 0 },
  };

  useEffect(() => {
    if (preset === 'all') {
      onChange('', '');
      return;
    }

    const now = new Date();
    const start = new Date(now.getTime() - presetRanges[preset].days * 24 * 60 * 60 * 1000);
    onChange(start.toISOString().split('T')[0], now.toISOString().split('T')[0]);
  }, [preset]);

  const handleCustomChange = () => {
    if (customStart && customEnd) {
      onChange(customStart, customEnd);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
      <select
        value={preset}
        onChange={(e) => setPreset(e.target.value as DateRangePreset)}
        style={{
          height: '36px',
          padding: '0 12px',
          fontSize: '14px',
          borderRadius: '4px',
          border: '1px solid #ced4da',
          background: '#fff',
        }}
      >
        {Object.entries(presetRanges).map(([value, { label }]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      {preset === 'all' && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            style={{ height: '36px', fontSize: '14px', borderRadius: '4px', padding: '0 8px', border: '1px solid #ced4da' }}
          />
          <span style={{ color: '#9ca8b3' }}>{t('to')}</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            onBlur={handleCustomChange}
            style={{ height: '36px', fontSize: '14px', borderRadius: '4px', padding: '0 8px', border: '1px solid #ced4da' }}
          />
        </div>
      )}
    </div>
  );
}
