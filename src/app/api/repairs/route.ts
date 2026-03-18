import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Repair from '@/models/Repair';
import Car from '@/models/Car';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

async function updateCarRepairCost(carId: string) {
  const repairs = await Repair.find({ car: carId });
  const total = repairs.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  await Car.findByIdAndUpdate(carId, { totalRepairCost: total });
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const carId = searchParams.get('carId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = {};
    if (carId) query.car = carId;

    const total = await Repair.countDocuments(query);
    const repairs = await Repair.find(query)
      .sort({ repairDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('car', 'carId brand model')
      .populate('createdBy', 'name');

    return NextResponse.json({
      repairs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get repairs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await request.json();
    const repair = await Repair.create({ ...body, createdBy: auth.userId });

    await updateCarRepairCost(body.car);

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Created repair for car ${body.carId}`,
      module: 'Repairs',
      targetId: repair._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ repair }, { status: 201 });
  } catch (error) {
    console.error('Create repair error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
