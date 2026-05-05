'use client';

import GpsDashboard from '@/components/GpsDashboard';
import { useTranslations } from 'next-intl';

export default function GpsTrackingPage() {
  const t = useTranslations('Sidebar');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{t('gps_tracking')}</h2>
        <p className="text-gray-500 text-sm mt-1">Monitor all vehicles via iTrack and WhatsGPS platforms.</p>
      </div>

      <GpsDashboard />
    </div>
  );
}
