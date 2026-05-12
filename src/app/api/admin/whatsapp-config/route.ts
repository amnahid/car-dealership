import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import WhatsAppConfig from '@/models/WhatsAppConfig';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user || !user.normalizedRoles.includes('Admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await WhatsAppConfig.findOne({ isActive: true }).lean();
    return NextResponse.json({ config });
  } catch (error) {
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user || !user.normalizedRoles.includes('Admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accessToken, phoneNumberId, adminPhone } = body;

    if (!accessToken || !phoneNumberId || !adminPhone) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    // Deactivate existing configs
    await WhatsAppConfig.updateMany({}, { $set: { isActive: false } });

    const config = await WhatsAppConfig.create({
      accessToken: accessToken.trim(),
      phoneNumberId: phoneNumberId.trim(),
      adminPhone: adminPhone.trim(),
      isActive: true,
      updatedBy: user.userId,
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
