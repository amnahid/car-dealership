import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CarPurchase from '@/models/CarPurchase';
import Car from '@/models/Car';
import User from '@/models/User';
import Supplier from '@/models/Supplier';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['Admin', 'Car Manager', 'Accountant', 'Finance Manager'].includes(auth.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const carId = searchParams.get('carId');
    const supplierId = searchParams.get('supplierId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = {};
    if (carId) query.car = carId;
    if (supplierId) query.supplier = supplierId;

    const [total, purchases] = await Promise.all([
      CarPurchase.countDocuments(query),
      CarPurchase.find(query)
        .populate('car', 'carId brand model year color images')
        .populate('supplier', 'companyName supplierId phone')
        .populate('createdBy', 'name email')
        .sort({ purchaseDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      purchases,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
