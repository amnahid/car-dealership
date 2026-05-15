import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Customer from '@/models/Customer';
import EditRequest from '@/models/EditRequest';
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
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    const customer = await Customer.findById(id).lean();

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Get customer error:', error);
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
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    const body = await request.json();
    const { 
      fullName, phone, email, passportNumber,
      buildingNumber, streetName, district, city, postalCode, countryCode,
      passportDocument, passportExpiryDate, drivingLicenseDocument, iqamaDocument, 
      emergencyContactName, emergencyContactPhone, licenseExpiryDate,
      notes, profilePhoto, customerType, vatRegistrationNumber,
      otherId, otherIdType
    } = body;

    if (!fullName || !phone || !buildingNumber || !streetName || !district || !city || !postalCode) {
      return NextResponse.json({ error: 'Full name, phone, and full address are required' }, { status: 400 });
    }

    if (!user.normalizedRoles.includes('Admin')) {
      await EditRequest.create({
        targetModel: 'Customer',
        targetId: id,
        requestedBy: user.userId,
        proposedChanges: body,
        status: 'Pending'
      });

      await logActivity({
        userId: user.userId,
        userName: user.name,
        action: `Requested update for customer: ${fullName}`,
        module: 'Customers',
        targetId: id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ 
        message: 'Edit request submitted for admin approval', 
        isPending: true 
      });
    }

    const customer = await Customer.findByIdAndUpdate(id, {
      fullName, phone, email, passportNumber,
      buildingNumber, streetName, district, city, postalCode, countryCode: countryCode || 'SA',
        passportDocument, passportExpiryDate, drivingLicenseDocument, iqamaDocument, 
        emergencyContactName, emergencyContactPhone, licenseExpiryDate,
        notes, profilePhoto, customerType, vatRegistrationNumber,
        otherId, otherIdType
      },
      { new: true }
    );

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Updated customer: ${fullName}`,
      module: 'Customer',
      targetId: customer._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Update customer error:', error);
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
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    // Check for active sales or rentals
    const [activeCash, activeInstallment, activeRental] = await Promise.all([
      (await import('@/models/CashSale')).default.findOne({ customer: id, status: 'Active' }),
      (await import('@/models/InstallmentSale')).default.findOne({ customer: id, status: { $in: ['Active', 'Defaulted'] } }),
      (await import('@/models/Rental')).default.findOne({ customer: id, status: 'Active' }),
    ]);

    if (activeCash || activeInstallment || activeRental) {
      return NextResponse.json({ 
        error: 'Cannot delete customer with active sales or rentals. Cancel or complete them first.' 
      }, { status: 400 });
    }

    const customer = await Customer.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Deleted customer: ${customer.fullName}`,
      module: 'Customer',
      targetId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
