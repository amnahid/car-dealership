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
    'On Installment': { label: t('onInstallment'), background: '#6f42c1', color: '#ffffff' },
    Sold: { label: t('sold'), background: '#adb5bd', color: '#ffffff' },
    Rented: { label: t('rented'), background: '#9c27b0', color: '#ffffff' },
    Defaulted: { label: t('defaulted'), background: '#ec4561', color: '#ffffff' },
    Handed: { label: t('handed'), background: '#20c997', color: '#ffffff' },
  };

  const config = statusConfig[status] || { label: t('unknown'), background: '#adb5bd', color: '#ffffff' };

  const isHanded = status === 'Handed';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isHanded ? '5px' : '0px',
        padding: '6px 10px',
        fontWeight: 600,
        fontSize: '12px',
        borderRadius: '3px',
        background: isHanded ? '#28aaa9' : config.background,
        color: '#ffffff',
      }}
    >
      {isHanded && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}
      {config.label}
    </span>
  );
}
