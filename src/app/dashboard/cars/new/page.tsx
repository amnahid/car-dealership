'use client';

import CarForm from '@/components/forms/CarForm';
import { useTranslations, useLocale } from 'next-intl';

export default function NewCarPage() {
  const t = useTranslations('Cars');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <div className={`max-w-4xl ${isRtl ? 'text-right' : 'text-left'}`}>
      <h2 className="page-title" style={{ marginBottom: '24px' }}>{t('addNew')}</h2>
      <div className="card" style={{ padding: '24px' }}>
        <CarForm mode="create" />
      </div>
    </div>
  );
}
