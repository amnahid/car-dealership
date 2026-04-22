import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CarPurchase from '@/models/CarPurchase';
import Car from '@/models/Car';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const carId = searchParams.get('carId');
    const supplierId = searchParams.get('supplierId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = {};
    if (carId) query.car = carId;
    if (supplierId) query.supplier = supplierId;

    const total = await CarPurchase.countDocuments(query);
    const purchases = await CarPurchase.find(query)
      .populate('car', 'carId brand model year color images')
      .populate('supplier', 'companyName supplierId phone')
      .populate('createdBy', 'name email')
      .sort({ purchaseDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      purchases,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}