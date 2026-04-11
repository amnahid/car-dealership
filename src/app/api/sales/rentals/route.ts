import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Rental from '@/models/Rental';
import Car from '@/models/Car';
import Transaction from '@/models/Transaction';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { carId: { $regex: search, $options: 'i' } },
        { rentalId: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const [rentals, total] = await Promise.all([
      Rental.find(query)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Rental.countDocuments(query),
    ]);

    // Calculate totals
    const totalStats = await Rental.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    return NextResponse.json({
      rentals,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      totalRevenue: totalStats[0]?.total || 0,
    });
  } catch (error) {
    console.error('Get rentals error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      carId, car, customer, customerName, customerPhone,
      startDate, endDate, dailyRate, securityDeposit, notes
    } = body;

    if (!carId || !car || !customer || !customerName || !customerPhone || !startDate || !endDate || !dailyRate) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = days * dailyRate;

    const rental = await Rental.create({
      car: car,
      carId,
      customer,
      customerName,
      customerPhone,
      startDate,
      endDate,
      dailyRate,
      totalAmount,
      securityDeposit: securityDeposit || 0,
      status: 'Active',
      notes,
      createdBy: user.userId,
    });

    // Update car status to Rented
    await Car.findByIdAndUpdate(car, { status: 'Rented' });

    // Create income transaction
    await Transaction.create({
      date: new Date(startDate),
      type: 'Income',
      category: 'Rental Income',
      amount: totalAmount,
      description: `Rental ${rental.rentalId} - Car ${carId}`,
      referenceId: rental._id.toString(),
      referenceType: 'Rental',
      createdBy: user.userId,
    });

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Created rental: ${rental.rentalId} for car ${carId}`,
      module: 'Rental',
      targetId: rental._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ rental }, { status: 201 });
  } catch (error) {
    console.error('Create rental error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}