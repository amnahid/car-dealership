import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Customer from '@/models/Customer';
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
        { email: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(query),
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get customers error:', error);
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
      fullName, phone, email, nationalId,
      buildingNumber, streetName, district, city, postalCode, countryCode,
      nationalIdDocument, drivingLicenseDocument, iqamaDocument, 
      emergencyContactName, emergencyContactPhone, 
      licenseExpiryDate, notes, profilePhoto, customerType, vatRegistrationNumber,
      otherId, otherIdType
    } = body;

    if (!fullName || !phone || !buildingNumber || !streetName || !district || !city || !postalCode) {
      return NextResponse.json({ error: 'Full name, phone, and full address are required' }, { status: 400 });
    }

    const customer = await Customer.create({
      fullName,
      phone,
      email,
      nationalId,
      buildingNumber,
      streetName,
      district,
      city,
      postalCode,
      countryCode: countryCode || 'SA',
      nationalIdDocument,
      drivingLicenseDocument,
      iqamaDocument,
      emergencyContactName,
      emergencyContactPhone,
      licenseExpiryDate,
      notes,
      profilePhoto,
      customerType: customerType || 'Individual',
      vatRegistrationNumber,
      otherId,
      otherIdType,
      createdBy: user.userId,
    });

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Created customer: ${fullName}`,
      module: 'Customer',
      targetId: customer._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Create customer error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
