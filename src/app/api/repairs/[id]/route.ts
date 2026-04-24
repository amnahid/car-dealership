import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Repair from '@/models/Repair';
import Car from '@/models/Car';
import User from '@/models/User';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

import mongoose from 'mongoose';

async function updateCarRepairCost(carObjectId: string) {
  const result = await Repair.aggregate([
    { $match: { car: new mongoose.Types.ObjectId(carObjectId) } },
    { $group: { _id: null, total: { $sum: '$totalCost' } } },
  ]);
  await Car.findByIdAndUpdate(carObjectId, { totalRepairCost: result[0]?.total || 0 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const repair = await Repair.findById(id)
      .populate('car', 'carId brand model')
      .populate('createdBy', 'name')
      .lean();
    if (!repair) return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    return NextResponse.json({ repair });
  } catch (error) {
    console.error('Get repair error:', error);
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
    const repair = await Repair.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!repair) return NextResponse.json({ error: 'Repair not found' }, { status: 404 });

    await updateCarRepairCost(repair.car.toString());

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Updated repair for car ${repair.carId}`,
      module: 'Repairs',
      targetId: repair._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ repair });
  } catch (error) {
    console.error('Update repair error:', error);
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
    const repair = await Repair.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!repair) return NextResponse.json({ error: 'Repair not found' }, { status: 404 });

    await updateCarRepairCost(repair.car.toString());

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Deleted repair for car ${repair.carId}`,
      module: 'Repairs',
      targetId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ message: 'Repair deleted successfully' });
  } catch (error) {
    console.error('Delete repair error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
