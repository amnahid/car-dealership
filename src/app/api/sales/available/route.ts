import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    const results: Array<{
      id: string;
      saleId: string;
      type: string;
      carId: string;
      car?: { brand: string; model: string; images: string[] };
      customerName: string;
      customerPhone: string;
      totalPrice: number;
      status: string;
    }> = [];

    const [cashSales, installmentSales, rentals] = await Promise.all([
      (type === 'all' || type === 'Cash' || type === 'cash')
        ? (await import('@/models/CashSale')).default.find({}).populate('car', 'carId brand model images').limit(limit).lean()
        : [],
      (type === 'all' || type === 'Installment' || type === 'installment')
        ? (await import('@/models/InstallmentSale')).default.find({ status: { $ne: 'Cancelled' } }).populate('car', 'carId brand model images').limit(limit).lean()
        : [],
      (type === 'all' || type === 'Rental' || type === 'rental')
        ? (await import('@/models/Rental')).default.find({ status: { $ne: 'Cancelled' } }).populate('car', 'carId brand model images').limit(limit).lean()
        : [],
    ]);

    (cashSales as any[]).forEach((s) => results.push({
      id: s._id,
      saleId: s.saleId,
      type: 'Cash',
      carId: s.carId,
      car: s.car,
      customerName: s.customerName,
      customerPhone: s.customerPhone,
      totalPrice: s.finalPrice || s.totalPrice,
      status: s.status,
    }));

    (installmentSales as any[]).forEach((s) => results.push({
      id: s._id,
      saleId: s.saleId,
      type: 'Installment',
      carId: s.carId,
      car: s.car,
      customerName: s.customerName,
      customerPhone: s.customerPhone,
      totalPrice: s.totalPrice,
      status: s.status,
    }));

    (rentals as any[]).forEach((s) => results.push({
      id: s._id,
      saleId: s.rentalId,
      type: 'Rental',
      carId: s.carId,
      car: s.car,
      customerName: s.customerName,
      customerPhone: s.customerPhone,
      totalPrice: s.totalAmount,
      status: s.status,
    }));

    return NextResponse.json({ sales: results });
  } catch (error) {
    console.error('Get sales for return error:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}