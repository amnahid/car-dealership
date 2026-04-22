import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Supplier from '@/models/Supplier';
import CarPurchase from '@/models/CarPurchase';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const list = searchParams.get('list');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    if (list === 'true') {
      const query: Record<string, unknown> = { status: 'active' };
      if (search) {
        query.$or = [
          { companyName: { $regex: search, $options: 'i' } },
        ];
      }
      const suppliers = await Supplier.find(query).select('supplierId companyName companyLogo phone email').sort({ companyName: 1 }).limit(20).lean();
      return NextResponse.json({ suppliers });
    }

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { companyNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const [suppliers, total] = await Promise.all([
      Supplier.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Supplier.countDocuments(query),
    ]);

    const supplierIds = suppliers.map(s => s._id);
    const purchases = await CarPurchase.aggregate([
      { $match: { supplier: { $in: supplierIds } } },
      { $group: { _id: '$supplier', totalPurchases: { $sum: 1 }, totalAmount: { $sum: '$purchasePrice' } } }
    ]);

    const purchaseMap = new Map(purchases.map(p => [p._id.toString(), p]));

    const suppliersWithStats = suppliers.map(supplier => {
      const stats = purchaseMap.get(supplier._id.toString()) || { totalPurchases: 0, totalAmount: 0 };
      return {
        ...supplier,
        totalPurchases: stats.totalPurchases,
        totalAmount: stats.totalAmount,
      };
    });

    return NextResponse.json({
      suppliers: suppliersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Suppliers GET error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      companyName,
      companyLogo,
      companyNumber,
      email,
      phone,
      address,
      salesAgent,
      status,
      notes,
    } = body;

    if (!companyName || !companyNumber || !phone) {
      return NextResponse.json(
        { error: 'Company name, company number, and phone are required' },
        { status: 400 }
      );
    }

    const existingSupplier = await Supplier.findOne({ companyNumber });
    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier with this company number already exists' },
        { status: 400 }
      );
    }

    const cookieStore = await import('next/headers').then(m => m.cookies());
    const token = cookieStore.get('auth-token')?.value;

    let userId;
    if (token) {
      try {
        const { verifyToken } = await import('@/lib/auth');
        const decoded = verifyToken(token);
        userId = decoded.userId;
      } catch {
        userId = new mongoose.Types.ObjectId();
      }
    } else {
      userId = new mongoose.Types.ObjectId();
    }

    const supplier = await Supplier.create({
      companyName,
      companyLogo,
      companyNumber,
      email,
      phone,
      address,
      salesAgent,
      status: status || 'active',
      notes,
      createdBy: userId,
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error('Supplier POST error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map(e => e.message);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}