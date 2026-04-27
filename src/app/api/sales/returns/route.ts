import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import PurchaseReturn from '@/models/PurchaseReturn';
import Customer from '@/models/Customer';
import User from '@/models/User';
import Car from '@/models/Car';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Admin', 'Sales Person'].includes(auth.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { returnId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { carId: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const [returns, total, statsResult] = await Promise.all([
      PurchaseReturn.find(query)
        .populate('car', 'carId brand model images')
        .populate('customer', 'fullName phone profilePhoto')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PurchaseReturn.countDocuments(query),
      PurchaseReturn.aggregate([
        { $match: status ? { status } : {} },
        {
          $group: {
            _id: null,
            totalRefunds: { $sum: '$refundAmount' },
            totalPenalty: { $sum: '$penaltyAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = statsResult[0] || { totalRefunds: 0, totalPenalty: 0, count: 0 };

    return NextResponse.json({
      returns,
      pagination: { page, limit, pages: Math.ceil(total / limit), total },
      stats: {
        totalRefunds: stats.totalRefunds || 0,
        totalPenalty: stats.totalPenalty || 0,
        count: stats.count || 0,
      },
    });
  } catch (error) {
    console.error('Purchase Returns GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Admin', 'Sales Person'].includes(auth.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      originalSaleId, 
      saleType, 
      carId, 
      customerName, 
      customerPhone, 
      originalPrice, 
      refundAmount, 
      penaltyAmount = 0, 
      returnDate, 
      notes 
    } = body;

    if (!originalSaleId || !carId || !customerName || !refundAmount || !returnDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const Customer = (await import('@/models/Customer')).default;
    const customerDoc = await Customer.findOne({ phone: customerPhone });
    if (!customerDoc) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const Car = (await import('@/models/Car')).default;
    const carDoc = await Car.findOne({ carId });
    if (!carDoc) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    let Sale: mongoose.Document | null = null;
    if (saleType === 'Installment') {
      const InstallmentSale = (await import('@/models/InstallmentSale')).default;
      Sale = await InstallmentSale.findOne({ saleId: originalSaleId });
    } else if (saleType === 'Cash') {
      const CashSale = (await import('@/models/CashSale')).default;
      Sale = await CashSale.findOne({ saleId: originalSaleId });
    } else if (saleType === 'Rental') {
      const Rental = (await import('@/models/Rental')).default;
      Sale = await Rental.findOne({ rentalId: originalSaleId });
    } else {
      return NextResponse.json({ error: 'Invalid sale type' }, { status: 400 });
    }

    if (!Sale) {
      return NextResponse.json({ error: 'Original sale not found' }, { status: 404 });
    }

    const newReturn = await PurchaseReturn.create({
      originalSale: Sale._id,
      originalSaleId,
      saleType,
      car: carDoc._id,
      carId,
      customer: customerDoc._id,
      customerName,
      customerPhone,
      originalPrice,
      refundAmount,
      penaltyAmount,
      returnDate: new Date(returnDate),
      notes,
      createdBy: new mongoose.Types.ObjectId(auth.userId),
    });

    return NextResponse.json({ return: newReturn }, { status: 201 });
  } catch (error) {
    console.error('Purchase Returns POST error:', error);
    return NextResponse.json({ error: 'Failed to create return' }, { status: 500 });
  }
}
