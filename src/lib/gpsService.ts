import crypto from 'crypto';

export type GpsProvider = 'WhatsGPS' | 'iTrack' | 'Mock';

function md5(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

export interface GpsPosition {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: Date;
  ignitionStatus: 'ON' | 'OFF' | 'UNKNOWN';
  positionType: 'GPS' | 'LBS' | 'WIFI';
  isStale: boolean;
  errorMessage?: string;
}

export interface GpsTestResult {
  success: boolean;
  message: string;
  imei?: string;
  deviceName?: string;
}

function generateMockPosition(): GpsPosition {
  const riyadhLat = 24.7 + (Math.random() - 0.5) * 0.1;
  const riyadhLng = 46.7 + (Math.random() - 0.5) * 0.1;
  const isMoving = Math.random() > 0.5;
  return {
    latitude: parseFloat(riyadhLat.toFixed(6)),
    longitude: parseFloat(riyadhLng.toFixed(6)),
    speed: isMoving ? Math.floor(Math.random() * 120) : 0,
    heading: Math.floor(Math.random() * 360),
    timestamp: new Date(),
    ignitionStatus: isMoving ? 'ON' : 'OFF',
    positionType: 'GPS',
    isStale: false,
  };
}

async function testWhatsGps(apiKey: string, apiSecret: string): Promise<GpsTestResult> {
  try {
    const url = `https://www.whatsgps.com/api/login?username=${encodeURIComponent(apiKey)}&password=${encodeURIComponent(apiSecret)}`;
    console.log(`[WhatsGPS] Testing connection for user: ${apiKey}`);
    
    const loginRes = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });

    if (!loginRes.ok) {
      console.error(`[WhatsGPS] Login failed with status: ${loginRes.status}`);
      return { success: false, message: `Invalid credentials (HTTP ${loginRes.status})` };
    }

    const data = await loginRes.json() as {
      result?: { userId?: string; token?: string; deviceList?: Array<{ deviceId?: string; name?: string }> };
      error?: string;
      code?: number;
    };

    if (data.error || (data.code !== undefined && data.code !== 0)) {
      console.error(`[WhatsGPS] Error from API:`, data);
      return { success: false, message: data.error || `Error code: ${data.code}` };
    }

    return {
      success: true,
      message: 'Connection successful',
      deviceName: data.result?.deviceList?.[0]?.name || 'Device found',
    };
  } catch (err) {
    console.error(`[WhatsGPS] Network error:`, err);
    return { success: false, message: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

async function fetchWhatsGpsPosition(apiKey: string, apiSecret: string, imei: string): Promise<GpsPosition> {
  try {
    const loginRes = await fetch(
      `https://www.whatsgps.com/api/login?username=${encodeURIComponent(apiKey)}&password=${encodeURIComponent(apiSecret)}`,
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    );

    if (!loginRes.ok) return { ...generateMockPosition(), isStale: true, errorMessage: 'Auth failed' };

    const loginData = await loginRes.json() as {
      result?: { token?: string; deviceList?: Array<{ deviceId?: string }> };
    };

    const token = loginData.result?.token;
    if (!token) return { ...generateMockPosition(), isStale: true, errorMessage: 'No auth token' };

    const posRes = await fetch(
      `https://www.whatsgps.com/api/location?imei=${imei}&token=${token}`,
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    );

    if (!posRes.ok) return { ...generateMockPosition(), isStale: true, errorMessage: `HTTP ${posRes.status}` };

    const posData = await posRes.json() as {
      lat?: string | number;
      lng?: string | number;
      lngt?: string | number;
      speed?: string | number;
      direction?: string | number;
      time?: string;
      gpsTime?: string;
      posType?: string;
      online?: string;
    };

    return {
      latitude: parseFloat(String(posData.lat || posData.lngt || 0)),
      longitude: parseFloat(String(posData.lng || 0)),
      speed: parseFloat(String(posData.speed || 0)),
      heading: parseFloat(String(posData.direction || 0)),
      timestamp: new Date(posData.time || posData.gpsTime || Date.now()),
      ignitionStatus: posData.online === '1' ? 'ON' : 'OFF',
      positionType: (posData.posType as 'GPS' | 'LBS' | 'WIFI') || 'GPS',
      isStale: false,
    };
  } catch (err) {
    console.error(`[WhatsGPS] Position fetch error:`, err);
    return { ...generateMockPosition(), isStale: true, errorMessage: 'Fetch error' };
  }
}

async function testITrack(apiKey: string, apiSecret: string): Promise<GpsTestResult> {
  try {
    const time = Math.floor(Date.now() / 1000);
    const pwMd5 = md5(apiSecret);
    const signature = md5(pwMd5 + time);
    
    // Switching back to HTTP as HTTPS is not responding on api.itrack.top
    const url = `http://api.itrack.top/api/authorization?time=${time}&account=${encodeURIComponent(apiKey)}&signature=${signature}`;
    
    console.log(`[iTrack] Testing connection for account: ${apiKey} (Time: ${time})`);

    const loginRes = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });

    if (!loginRes.ok) {
      console.error(`[iTrack] Login failed with status: ${loginRes.status}`);
      return { success: false, message: `Server error (HTTP ${loginRes.status})` };
    }

    const data = await loginRes.json() as {
      record?: { access_token?: string };
      code: number;
      message?: string;
    };

    if (data.code !== 0) {
      console.warn(`[iTrack] Auth failed with code ${data.code}: ${data.message}`);
      const errorMsg = data.code === 10007 
        ? 'Permission denied: Please ensure "Open API" access is enabled in the iTrack platform.' 
        : (data.message || `Error code: ${data.code}`);
      return { success: false, message: errorMsg };
    }

    return {
      success: true,
      message: 'Connection successful',
    };
  } catch (err) {
    console.error(`[iTrack] Network error:`, err);
    return { success: false, message: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

async function fetchITrackPosition(apiKey: string, apiSecret: string, imei: string): Promise<GpsPosition> {
  try {
    const time = Math.floor(Date.now() / 1000);
    const signature = md5(md5(apiSecret) + time);
    const authUrl = `http://api.itrack.top/api/authorization?time=${time}&account=${encodeURIComponent(apiKey)}&signature=${signature}`;

    const loginRes = await fetch(authUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });

    if (!loginRes.ok) return { ...generateMockPosition(), isStale: true, errorMessage: `Auth HTTP ${loginRes.status}` };

    const loginData = await loginRes.json() as { record?: { access_token?: string }; code: number; message?: string };
    const accessToken = loginData.record?.access_token;
    if (!accessToken || loginData.code !== 0) {
      return { ...generateMockPosition(), isStale: true, errorMessage: loginData.message || `Auth Code ${loginData.code}` };
    }

    const trackUrl = `http://api.itrack.top/api/track?access_token=${accessToken}&imeis=${imei}`;
    const posRes = await fetch(trackUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });

    if (!posRes.ok) return { ...generateMockPosition(), isStale: true, errorMessage: `Track HTTP ${posRes.status}` };

    const posData = await posRes.json() as {
      record?: Array<{
        latitude?: number;
        longitude?: number;
        speed?: number;
        course?: number;
        gpstime?: number;
        accstatus?: number;
      }>;
      code: number;
      message?: string;
    };

    const entry = posData.record?.[0];
    if (posData.code !== 0) return { ...generateMockPosition(), isStale: true, errorMessage: posData.message || `Track Code ${posData.code}` };
    if (!entry) return { ...generateMockPosition(), isStale: true, errorMessage: 'No data for IMEI' };

    return {
      latitude: entry.latitude || 0,
      longitude: entry.longitude || 0,
      speed: entry.speed || 0,
      heading: entry.course || 0,
      timestamp: new Date((entry.gpstime || 0) * 1000),
      ignitionStatus: entry.accstatus === 1 ? 'ON' : entry.accstatus === 0 ? 'OFF' : 'UNKNOWN',
      positionType: 'GPS',
      isStale: false,
    };
  } catch (err) {
    console.error(`[iTrack] Position fetch error:`, err);
    return { ...generateMockPosition(), isStale: true, errorMessage: 'Fetch error' };
  }
}

export async function testGpsConnection(
  provider: GpsProvider,
  apiKey: string,
  apiSecret: string
): Promise<GpsTestResult> {
  switch (provider) {
    case 'Mock':
      return { success: true, message: 'Mock provider — no real connection' };
    case 'WhatsGPS':
      return testWhatsGps(apiKey, apiSecret);
    case 'iTrack':
      return testITrack(apiKey, apiSecret);
  }
}

export async function fetchGpsPosition(
  provider: GpsProvider,
  apiKey: string,
  apiSecret: string,
  imei: string
): Promise<GpsPosition> {
  switch (provider) {
    case 'Mock':
      return generateMockPosition();
    case 'WhatsGPS':
      return fetchWhatsGpsPosition(apiKey, apiSecret, imei);
    case 'iTrack':
      return fetchITrackPosition(apiKey, apiSecret, imei);
  }
}

export function validateImei(imei: string): boolean {
  return /^\d{15}$/.test(imei);
}

export function headingToDirection(heading: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}
