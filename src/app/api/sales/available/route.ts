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

    if (type === 'all' || type === 'Cash' || type === 'cash') {
      const CashSale = (await import('@/models/CashSale')).default;
      const cashSales = await CashSale.find({})
        .populate('car', 'carId brand model images')
        .limit(limit);
      cashSales.forEach((s: any) => results.push({
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
    }

    if (type === 'all' || type === 'Installment' || type === 'installment') {
      const InstallmentSale = (await import('@/models/InstallmentSale')).default;
      const installmentSales = await InstallmentSale.find({ status: { $ne: 'Cancelled' } })
        .populate('car', 'carId brand model images')
        .limit(limit);
      installmentSales.forEach((s: any) => results.push({
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
    }

    if (type === 'all' || type === 'Rental' || type === 'rental') {
      const Rental = (await import('@/models/Rental')).default;
      const rentals = await Rental.find({ status: { $ne: 'Cancelled' } })
        .populate('car', 'carId brand model images')
        .limit(limit);
      rentals.forEach((s: any) => results.push({
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
    }

    return NextResponse.json({ sales: results });
  } catch (error) {
    console.error('Get sales for return error:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}