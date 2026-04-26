export type GpsProvider = 'WhatsGPS' | 'iTrack' | 'Mock';

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
    const loginRes = await fetch(
      `https://www.whatsgps.com/api/login?username=${encodeURIComponent(apiKey)}&password=${encodeURIComponent(apiSecret)}`,
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    );

    if (!loginRes.ok) {
      return { success: false, message: 'Invalid credentials' };
    }

    const data = await loginRes.json() as {
      result?: { userId?: string; token?: string; deviceList?: Array<{ deviceId?: string; name?: string }> };
      error?: string;
    };

    if (data.error) {
      return { success: false, message: data.error };
    }

    return {
      success: true,
      message: 'Connection successful',
      deviceName: data.result?.deviceList?.[0]?.name || 'Device found',
    };
  } catch (err) {
    return { success: false, message: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

async function fetchWhatsGpsPosition(apiKey: string, apiSecret: string, imei: string): Promise<GpsPosition> {
  const loginRes = await fetch(
    `https://www.whatsgps.com/api/login?username=${encodeURIComponent(apiKey)}&password=${encodeURIComponent(apiSecret)}`,
    { method: 'GET', headers: { 'Accept': 'application/json' } }
  );

  if (!loginRes.ok) {
    return { ...generateMockPosition(), isStale: true, errorMessage: 'Auth failed' };
  }

  const loginData = await loginRes.json() as {
    result?: { token?: string; deviceList?: Array<{ deviceId?: string }> };
  };

  const token = loginData.result?.token;
  if (!token) {
    return { ...generateMockPosition(), isStale: true, errorMessage: 'No auth token' };
  }

  try {
    const posRes = await fetch(
      `https://www.whatsgps.com/api/location?imei=${imei}&token=${token}`,
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    );

    if (!posRes.ok) {
      return { ...generateMockPosition(), isStale: true, errorMessage: `HTTP ${posRes.status}` };
    }

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
  } catch {
    return { ...generateMockPosition(), isStale: true, errorMessage: 'Fetch error' };
  }
}

async function testITrack(apiKey: string, apiSecret: string): Promise<GpsTestResult> {
  try {
    const loginRes = await fetch(
      `https://api.itrack.live/v2/user/auth?login=${encodeURIComponent(apiKey)}&password=${encodeURIComponent(apiSecret)}`,
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    );

    if (!loginRes.ok) {
      return { success: false, message: 'Invalid credentials' };
    }

    const data = await loginRes.json() as {
      hash?: string;
      devices?: Array<{ id?: string; IMEI?: string; name?: string }>;
      error?: string;
      message?: string;
    };

    if (data.error || data.message === 'fail') {
      return { success: false, message: data.error || 'Authentication failed' };
    }

    return {
      success: true,
      message: 'Connection successful',
      imei: data.devices?.[0]?.IMEI,
      deviceName: data.devices?.[0]?.name,
    };
  } catch (err) {
    return { success: false, message: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

async function fetchITrackPosition(apiKey: string, apiSecret: string, imei: string): Promise<GpsPosition> {
  const loginRes = await fetch(
    `https://api.itrack.live/v2/user/auth?login=${encodeURIComponent(apiKey)}&password=${encodeURIComponent(apiSecret)}`,
    { method: 'GET', headers: { 'Accept': 'application/json' } }
  );

  if (!loginRes.ok) {
    return { ...generateMockPosition(), isStale: true, errorMessage: 'Auth failed' };
  }

  const loginData = await loginRes.json() as { hash?: string };

  const hash = loginData.hash;
  if (!hash) {
    return { ...generateMockPosition(), isStale: true, errorMessage: 'No session hash' };
  }

  try {
    const posRes = await fetch(
      `https://api.itrack.live/v2/track/list?hash=${hash}&imeis=${imei}`,
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    );

    if (!posRes.ok) {
      return { ...generateMockPosition(), isStale: true, errorMessage: `HTTP ${posRes.status}` };
    }

    const posData = await posRes.json() as {
      result?: Array<{
        lat?: string | number;
        lng?: string | number;
        speed?: string | number;
        direction?: string | number;
        gpsTime?: string;
        posType?: string;
      }>;
    };

    const entry = posData.result?.[0];
    if (!entry) {
      return { ...generateMockPosition(), isStale: true, errorMessage: 'No position data' };
    }

    return {
      latitude: parseFloat(String(entry.lat || 0)),
      longitude: parseFloat(String(entry.lng || 0)),
      speed: parseFloat(String(entry.speed || 0)),
      heading: parseFloat(String(entry.direction || 0)),
      timestamp: new Date(entry.gpsTime || Date.now()),
      ignitionStatus: 'UNKNOWN',
      positionType: (entry.posType as 'GPS' | 'LBS' | 'WIFI') || 'GPS',
      isStale: false,
    };
  } catch {
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