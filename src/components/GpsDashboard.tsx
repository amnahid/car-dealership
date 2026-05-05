'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type GpsProvider = 'itrack' | 'whatsgps';

export default function GpsDashboard() {
  const t = useTranslations('GpsDashboard');
  const [provider, setProvider] = useState<GpsProvider>('itrack');

  const providers = {
    itrack: {
      name: 'iTrack',
      url: 'https://www.itrack.top/',
    },
    whatsgps: {
      name: 'WhatsGPS',
      url: 'https://www.whatsgps.com/',
    },
  };

  return (
    <div className="card no-print" style={{ padding: '24px', marginTop: '24px' }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-800">{t('title')}</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">{t('selectProvider')}:</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as GpsProvider)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="itrack">{providers.itrack.name}</option>
            <option value="whatsgps">{providers.whatsgps.name}</option>
          </select>
        </div>
      </div>

      <div className="w-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
        <iframe
          src={providers[provider].url}
          className="w-full h-full border-0"
          title={`${providers[provider].name} Dashboard`}
          allow="geolocation"
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        />
      </div>
    </div>
  );
}
