import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Car from '@/models/Car';
import { getAuthPayload } from '@/lib/apiAuth';
import { fetchGpsPosition, testGpsConnection, validateImei, type GpsProvider } from '@/lib/gpsService';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const car = await Car.findById(id).lean();
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    if (!car.gpsProvider || !car.gpsImei) {
      return NextResponse.json({ configured: false });
    }

    const position = await fetchGpsPosition(
      car.gpsProvider as GpsProvider,
      car.gpsApiKey || '',
      car.gpsApiSecret || '',
      car.gpsImei
    );

    if (!position.isStale) {
      await Car.updateOne(
        { _id: id },
        {
          $set: {
            gpsCachedPosition: {
              latitude: position.latitude,
              longitude: position.longitude,
              speed: position.speed,
              heading: position.heading,
              timestamp: position.timestamp,
              ignitionStatus: position.ignitionStatus,
              positionType: position.positionType,
              isStale: false,
            },
            gpsLastUpdate: new Date(),
          },
        }
      );
    }

    return NextResponse.json({
      configured: true,
      provider: car.gpsProvider,
      imei: car.gpsImei,
      isLive: !position.isStale,
      position: {
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed,
        heading: position.heading,
        timestamp: position.timestamp,
        ignitionStatus: position.ignitionStatus,
        positionType: position.positionType,
        isStale: position.isStale,
      },
      lastUpdate: car.gpsLastUpdate,
      errorMessage: position.errorMessage,
    });
  } catch (error) {
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user || !user.normalizedRoles.includes('Admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const car = await Car.findById(id);
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    const body = await request.json();
    const { gpsProvider, gpsImei, gpsApiKey, gpsApiSecret, testOnly } = body;

    if (gpsImei && !validateImei(gpsImei)) {
      return NextResponse.json(
        { error: 'IMEI must be exactly 15 digits', received: `${gpsImei.length} chars` },
        { status: 400 }
      );
    }

    if (testOnly) {
      const result = await testGpsConnection(
        gpsProvider,
        gpsApiKey || '',
        gpsApiSecret || ''
      );
      return NextResponse.json(result);
    }

    car.gpsProvider = gpsProvider || undefined;
    car.gpsImei = gpsImei || undefined;
    car.gpsApiKey = gpsApiKey || undefined;
    car.gpsApiSecret = gpsApiSecret || undefined;
    await car.save();

    if (gpsProvider && gpsApiKey && gpsApiSecret && gpsImei) {
      const testResult = await testGpsConnection(gpsProvider, gpsApiKey, gpsApiSecret);
      if (!testResult.success) {
        return NextResponse.json(
          { error: `Connection test failed: ${testResult.message}` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      gpsProvider: car.gpsProvider,
      gpsImei: car.gpsImei,
      configured: !!(car.gpsProvider && car.gpsImei),
    });
  } catch (error) {
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
