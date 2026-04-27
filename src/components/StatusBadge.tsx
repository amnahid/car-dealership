'use client';

import { useTranslations } from 'next-intl';
import { CarStatus } from '@/types';

interface StatusBadgeProps {
  status: CarStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('Status');

  const statusConfig: Record<string, { label: string; background: string; color: string }> = {
    'In Stock': { label: t('inStock'), background: '#42ca7f', color: '#ffffff' },
    'Under Repair': { label: t('underRepair'), background: '#f8b425', color: '#ffffff' },
    Reserved: { label: t('reserved'), background: '#38a4f8', color: '#ffffff' },
    Sold: { label: t('sold'), background: '#adb5bd', color: '#ffffff' },
    Rented: { label: t('rented'), background: '#9c27b0', color: '#ffffff' },
  };

  const config = statusConfig[status] || { label: t('unknown'), background: '#adb5bd', color: '#ffffff' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 10px',
        fontWeight: 500,
        fontSize: '12px',
        borderRadius: '3px',
        background: config.background,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
}
