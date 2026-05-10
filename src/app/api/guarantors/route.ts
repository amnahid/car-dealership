import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Guarantor from '@/models/Guarantor';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.normalizedRoles.some(r => ['Admin', 'Sales Person'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';

    const query: Record<string, unknown> = {
      isDeleted: { $ne: true },
    };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { nationalId: { $regex: search, $options: 'i' } },
        { guarantorId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [guarantors, total] = await Promise.all([
      Guarantor.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Guarantor.countDocuments(query),
    ]);

    return NextResponse.json({
      guarantors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get guarantors error:', error);
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.normalizedRoles.some(r => ['Admin', 'Sales Person'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      fullName, phone, email, nationalId, employer, salary,
      buildingNumber, streetName, district, city, postalCode, countryCode,
      documents, nationalIdDocument, drivingLicenseDocument, iqamaDocument,
      profilePhoto, notes
    } = body;

    if (!fullName || !phone || !nationalId || !buildingNumber || !streetName || !district || !city || !postalCode) {
      return NextResponse.json({ error: 'Full name, phone, national ID, and address are required' }, { status: 400 });
    }

    const guarantor = await Guarantor.create({
      fullName,
      phone,
      email,
      nationalId,
      employer,
      salary,
      buildingNumber,
      streetName,
      district,
      city,
      postalCode,
      countryCode: countryCode || 'SA',
      documents: documents || [],
      nationalIdDocument,
      drivingLicenseDocument,
      iqamaDocument,
      profilePhoto,
      notes,
      createdBy: user.userId,
    });

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Created guarantor: ${fullName}`,
      module: 'Guarantor',
      targetId: guarantor._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ guarantor }, { status: 201 });
  } catch (error) {
    console.error('Create guarantor error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
