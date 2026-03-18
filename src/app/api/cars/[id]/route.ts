import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Car from '@/models/Car';
import Repair from '@/models/Repair';
import VehicleDocument from '@/models/Document';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const car = await Car.findById(id).populate('createdBy', 'name email');
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

    const repairs = await Repair.find({ car: id }).sort({ repairDate: -1 });
    const documents = await VehicleDocument.find({ car: id }).sort({ expiryDate: 1 });

    return NextResponse.json({ car, repairs, documents });
  } catch (error) {
    console.error('Get car error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const car = await Car.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Updated car ${car.carId}`,
      module: 'Cars',
      targetId: car._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ car });
  } catch (error) {
    console.error('Update car error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const car = await Car.findByIdAndUpdate(id, { status: 'Sold' }, { new: true });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Archived car ${car.carId}`,
      module: 'Cars',
      targetId: car._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ message: 'Car archived successfully' });
  } catch (error) {
    console.error('Delete car error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
