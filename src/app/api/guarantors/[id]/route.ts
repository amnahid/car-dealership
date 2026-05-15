import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Guarantor from '@/models/Guarantor';
import InstallmentSale from '@/models/InstallmentSale';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.normalizedRoles.some(r => ['Admin', 'Sales Person'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid guarantor ID' }, { status: 400 });
    }

    const guarantor = await Guarantor.findById(id).lean();

    if (!guarantor) {
      return NextResponse.json({ error: 'Guarantor not found' }, { status: 404 });
    }

    // Also fetch sales where this person is a guarantor
    const sales = await InstallmentSale.find({ guarantor: id, isDeleted: { $ne: true } })
      .populate('car', 'carId brand model')
      .sort({ startDate: -1 })
      .lean();

    return NextResponse.json({ guarantor, sales });
  } catch (error) {
    console.error('Get guarantor error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.normalizedRoles.some(r => ['Admin', 'Sales Person'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid guarantor ID' }, { status: 400 });
    }

    const body = await request.json();
    const { 
      fullName, phone, email, passportNumber, employer, salary,
      buildingNumber, streetName, district, city, postalCode, countryCode,
      documents, passportDocument, passportExpiryDate, drivingLicenseDocument, iqamaDocument,
      profilePhoto, notes
    } = body;

    if (!fullName || !phone || !buildingNumber || !streetName || !district || !city || !postalCode) {
      return NextResponse.json({ error: 'Full name, phone, and address are required' }, { status: 400 });
    }

    const guarantor = await Guarantor.findByIdAndUpdate(
      id,
      { 
        fullName, phone, email, passportNumber, employer, salary,
        buildingNumber, streetName, district, city, postalCode, countryCode: countryCode || 'SA',
        documents, passportDocument, passportExpiryDate, drivingLicenseDocument, iqamaDocument,
        profilePhoto, notes
      },
      { new: true }
    );

    if (!guarantor) {
      return NextResponse.json({ error: 'Guarantor not found' }, { status: 404 });
    }

    // Sync denormalized name/phone in InstallmentSales if they changed
    await InstallmentSale.updateMany(
      { guarantor: id },
      { $set: { guarantorName: fullName, guarantorPhone: phone } }
    );

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Updated guarantor: ${fullName}`,
      module: 'Guarantor',
      targetId: guarantor._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ guarantor });
  } catch (error) {
    console.error('Update guarantor error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.normalizedRoles.some(r => ['Admin', 'Sales Person'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid guarantor ID' }, { status: 400 });
    }

    // Check for active sales where this person is a guarantor
    const activeSale = await InstallmentSale.findOne({ 
      guarantor: id, 
      status: { $in: ['Active', 'Defaulted'] },
      isDeleted: { $ne: true }
    });

    if (activeSale) {
      return NextResponse.json({ 
        error: 'Cannot delete guarantor with active installment sales. Complete or cancel them first.' 
      }, { status: 400 });
    }

    const guarantor = await Guarantor.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!guarantor) {
      return NextResponse.json({ error: 'Guarantor not found' }, { status: 404 });
    }

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Deleted guarantor: ${guarantor.fullName}`,
      module: 'Guarantor',
      targetId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ message: 'Guarantor deleted successfully' });
  } catch (error) {
    console.error('Delete guarantor error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
