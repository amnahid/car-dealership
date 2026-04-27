'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import CarForm from '@/components/forms/CarForm';
import { useTranslations, useLocale } from 'next-intl';

async function getCar(id: string) {
  const res = await fetch(`/api/cars/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.car;
}

export default function EditCarPage() {
  const t = useTranslations('Cars');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  const params = useParams();
  const id = params.id as string;
  
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCar(id).then(data => {
      setCar(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>;
  if (!car) notFound();

  return (
    <div className={`max-w-4xl ${isRtl ? 'text-right' : 'text-left'}`}>
      <h2 className="page-title" style={{ marginBottom: '24px' }}>{t('editCar', { id: car.carId })}</h2>
      <div className="card" style={{ padding: '24px' }}>
        <CarForm mode="edit" initialData={car} />
      </div>
    </div>
  );
}
