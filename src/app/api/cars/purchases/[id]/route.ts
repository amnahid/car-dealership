import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CarPurchase from '@/models/CarPurchase';
import Car from '@/models/Car';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const purchase = await CarPurchase.findById(id)
      .populate('car', 'carId brand model year color engineNumber chassisNumber')
      .populate('supplier', 'companyName supplierId phone email address')
      .populate('createdBy', 'name email')
      .lean();

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    return NextResponse.json({ purchase });
  } catch (error) {
    console.error('Get purchase error:', error);
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

    const purchase = await CarPurchase.findByIdAndUpdate(id, body, { new: true })
      .populate('car', 'carId brand model year')
      .populate('supplier', 'companyName supplierId');

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Updated purchase for car`,
      module: 'Cars',
      targetId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ purchase });
  } catch (error) {
    console.error('Update purchase error:', error);
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

    const purchase = await CarPurchase.findById(id);
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    await Car.findByIdAndUpdate(purchase.car, { purchase: null });

    await CarPurchase.findByIdAndDelete(id);

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Deleted purchase record`,
      module: 'Cars',
      targetId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error('Delete purchase error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}