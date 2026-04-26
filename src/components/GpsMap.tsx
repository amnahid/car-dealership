'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface GpsData {
  configured: boolean;
  provider: string | null;
  imei: string | null;
  isLive: boolean;
  position: {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    timestamp: string;
    ignitionStatus: string;
    positionType: string;
    isStale: boolean;
  } | null;
  lastUpdate: string | null;
  errorMessage?: string;
}

interface GpsMapProps {
  carId: string;
  carName: string;
  refreshInterval?: number;
}

function headingToDirection(heading: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function GpsMap({ carId, carName, refreshInterval = 15000 }: GpsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const zoomRef = useRef<number>(14);
  const [gpsData, setGpsData] = useState<GpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ gpsProvider: 'Mock', gpsImei: '', gpsApiKey: '', gpsApiSecret: '' });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchGps = useCallback(async () => {
    try {
      const res = await fetch(`/api/cars/gps/${carId}`);
      const data = await res.json();
      setGpsData(data);
      if (!data.configured) setEditing(true);
    } catch {
      setGpsData({ configured: false, provider: null, imei: null, isLive: false, position: null, lastUpdate: null });
    } finally {
      setLoading(false);
    }
  }, [carId]);

  useEffect(() => {
    fetchGps();
  }, [fetchGps]);

  useEffect(() => {
    if (!gpsData?.configured || !gpsData?.position) return;

    const initMap = async () => {
      if (!mapRef.current) return;

      const L = (await import('leaflet')).default;

      if (!mapInstanceRef.current) {
        const defaultCenter: [number, number] = [gpsData.position!.latitude, gpsData.position!.longitude];
        mapInstanceRef.current = L.map(mapRef.current).setView(defaultCenter, zoomRef.current);

        mapInstanceRef.current.on('zoomend', () => {
          zoomRef.current = mapInstanceRef.current!.getZoom();
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);

        const carIcon = L.divIcon({
          html: `<div style="
            width:36px;height:36px;
            background:#1d4ed8;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            font-size:16px;color:white;
            transform:rotate(${gpsData.position!.heading}deg);
          ">🛰️</div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        markerRef.current = L.marker(defaultCenter, { icon: carIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`<strong>${carName}</strong><br>Speed: ${gpsData.position!.speed} km/h<br>Last update: ${new Date(gpsData.position!.timestamp).toLocaleTimeString()}`);
      } else {
        const newCenter: [number, number] = [gpsData.position!.latitude, gpsData.position!.longitude];
        mapInstanceRef.current.setView(newCenter, zoomRef.current, { animate: true });

        const newIcon = L.divIcon({
          html: `<div style="
            width:36px;height:36px;
            background:${gpsData.isLive ? '#16a34a' : '#dc2626'};border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            font-size:16px;color:white;
          ">🛰️</div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        markerRef.current?.setLatLng(newCenter).setIcon(newIcon);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [gpsData, carName]);

  useEffect(() => {
    if (!gpsData?.configured) return;
    const interval = setInterval(fetchGps, refreshInterval);
    return () => clearInterval(interval);
  }, [gpsData?.configured, fetchGps, refreshInterval]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/cars/gps/${carId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, testOnly: true }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, message: 'Request failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (form.gpsProvider !== 'Mock' && !form.gpsImei) {
      setTestResult({ success: false, message: 'IMEI is required for real providers' });
      return;
    }
    if (form.gpsImei && !/^\d{15}$/.test(form.gpsImei)) {
      setTestResult({ success: false, message: 'IMEI must be exactly 15 digits' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/cars/gps/${carId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResult({ success: false, message: data.error || 'Save failed' });
      } else {
        setEditing(false);
        setTestResult(null);
        fetchGps();
      }
    } catch {
      setTestResult({ success: false, message: 'Request failed' });
    } finally {
      setSaving(false);
    }
  };

  const pos = gpsData?.position;
  const isOnline = pos && !pos.isStale;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">GPS Tracking</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-48 bg-gray-100 rounded-lg" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (!gpsData?.configured || editing) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">GPS Tracking</h2>
          {gpsData?.configured && (
            <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">Configure GPS tracking for this vehicle.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Provider</label>
            <select
              value={form.gpsProvider}
              onChange={e => setForm({ ...form, gpsProvider: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none"
            >
              <option value="Mock">Mock (Sandbox)</option>
              <option value="WhatsGPS">WhatsGPS</option>
              <option value="iTrack">iTrack</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">IMEI (15 digits)</label>
            <input
              type="text"
              value={form.gpsImei}
              onChange={e => setForm({ ...form, gpsImei: e.target.value.replace(/\D/g, '').slice(0, 15) })}
              placeholder="357689090123456"
              maxLength={15}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-teal-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">API Key / Username</label>
            <input
              type="text"
              value={form.gpsApiKey}
              onChange={e => setForm({ ...form, gpsApiKey: e.target.value })}
              placeholder="username or key"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">API Secret / Password</label>
            <input
              type="password"
              value={form.gpsApiSecret}
              onChange={e => setForm({ ...form, gpsApiSecret: e.target.value })}
              placeholder="password or secret"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none"
            />
          </div>
        </div>

        {testResult && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {testResult.message}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save & Connect'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-700">GPS Tracking</h2>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-medium ${isOnline ? 'text-green-600' : 'text-red-500'}`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {isOnline ? 'Live' : 'Offline'}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2 py-1 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={fetchGps}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2 py-1 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex" style={{ minHeight: '208px' }}>
        <div ref={mapRef} className="flex-1 h-72 w-full" style={{ minHeight: '288px' }} />

        <div className="w-40 p-4 border-l border-gray-100 space-y-3" style={{ minHeight: '288px' }}>
          <div>
            <p className="text-xs text-gray-500">Speed</p>
            <p className="text-lg font-semibold text-gray-800">{pos?.speed ?? 0} <span className="text-xs font-normal text-gray-500">km/h</span></p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Heading</p>
            <p className="text-lg font-semibold text-gray-800">{pos ? headingToDirection(pos.heading) : '—'} <span className="text-xs font-normal text-gray-500">{pos?.heading ?? 0}°</span></p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Type</p>
            <p className="text-sm font-medium text-gray-700">{pos?.positionType ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Updated</p>
            <p className="text-sm font-medium text-gray-700">{pos?.timestamp ? timeAgo(pos.timestamp) : '—'}</p>
          </div>
          {gpsData.provider && (
            <div>
              <p className="text-xs text-gray-500">Provider</p>
              <p className="text-sm font-medium text-gray-700">{gpsData.provider}</p>
            </div>
          )}
          {gpsData.imei && (
            <div>
              <p className="text-xs text-gray-500">IMEI</p>
              <p className="text-sm font-mono text-gray-700 text-xs">{gpsData.imei}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}