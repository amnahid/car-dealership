import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Supplier from '@/models/Supplier';
import CarPurchase from '@/models/CarPurchase';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const supplier = await Supplier.findById(id).lean();
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const purchases = await CarPurchase.find({ supplier: id })
      .populate('car', 'carId brand model year')
      .sort({ purchaseDate: -1 })
      .lean();

    const purchaseStats = purchases.reduce(
      (acc, p) => ({
        totalPurchases: acc.totalPurchases + 1,
        totalAmount: acc.totalAmount + (p.purchasePrice || 0),
      }),
      { totalPurchases: 0, totalAmount: 0 }
    );

    return NextResponse.json({
      supplier,
      purchases,
      stats: purchaseStats,
    });
  } catch (error) {
    console.error('Supplier GET error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

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

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    if (companyNumber && companyNumber !== supplier.companyNumber) {
      const existing = await Supplier.findOne({ companyNumber, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json(
          { error: 'Company number already exists' },
          { status: 400 }
        );
      }
    }

    await Supplier.findByIdAndUpdate(id, {
      ...(companyName && { companyName }),
      ...(companyLogo !== undefined && { companyLogo }),
      ...(companyNumber && { companyNumber }),
      ...(email !== undefined && { email }),
      phone,
      ...(address !== undefined && { address }),
      ...(salesAgent !== undefined && { salesAgent }),
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
    });

    const updatedSupplier = await Supplier.findById(id);

    return NextResponse.json({ supplier: updatedSupplier });
  } catch (error) {
    console.error('Supplier PUT error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    await Supplier.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Supplier DELETE error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}