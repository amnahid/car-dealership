'use client';

import { useTranslations, useLocale } from 'next-intl';

interface ExpiryAlertProps {
  daysUntilExpiry: number;
  documentType: string;
  carId: string;
}

export default function ExpiryAlert({ daysUntilExpiry, documentType, carId }: ExpiryAlertProps) {
  const t = useTranslations('ExpiryAlert');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  let background = '#fff3cd';
  let border = '#f8b425';
  let color = '#856404';

  if (daysUntilExpiry <= 7) {
    background = '#f8d7da';
    border = '#ec4561';
    color = '#721c24';
  }

  const alertStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    marginLeft: isRtl ? '8px' : '0',
    marginRight: isRtl ? '0' : '8px',
    verticalAlign: 'middle',
  };

  return (
    <div
      style={{
        background,
        border: `1px solid ${border}`,
        borderRadius: '3px',
        padding: '12px',
        textAlign: isRtl ? 'right' : 'left',
        direction: isRtl ? 'rtl' : 'ltr'
      }}
    >
      <p style={{ fontSize: '14px', fontWeight: 500, color, margin: 0 }}>
        {daysUntilExpiry <= 7 ? (
          <svg style={alertStyle} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        ) : (
          <svg style={alertStyle} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        )}
        {daysUntilExpiry < 0 
          ? t('expired', { type: documentType, carId })
          : t('message', { type: documentType, carId, days: daysUntilExpiry })
        }
      </p>
    </div>
  );
}
