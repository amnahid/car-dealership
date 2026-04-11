import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import InstallmentSale from '@/models/InstallmentSale';
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
        { saleId: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const [sales, total] = await Promise.all([
      InstallmentSale.find(query)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InstallmentSale.countDocuments(query),
    ]);

    // Calculate totals
    const totalStats = await InstallmentSale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$totalPrice' },
          totalPaid: { $sum: '$totalPaid' },
          totalRemaining: { $sum: '$remainingAmount' },
        },
      },
    ]);

    return NextResponse.json({
      sales,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      totalValue: totalStats[0]?.totalValue || 0,
      totalPaid: totalStats[0]?.totalPaid || 0,
      totalRemaining: totalStats[0]?.totalRemaining || 0,
    });
  } catch (error) {
    console.error('Get installment sales error:', error);
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
      totalPrice, downPayment, interestRate, tenureMonths, startDate, notes
    } = body;

    if (!carId || !car || !customer || !customerName || !customerPhone || !totalPrice || !downPayment || !tenureMonths || !startDate) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const loanAmount = totalPrice - downPayment;
    const monthlyPayment = loanAmount / tenureMonths;
    const remainingAmount = loanAmount;

    // Generate payment schedule
    const start = new Date(startDate);
    const paymentSchedule = [];
    for (let i = 1; i <= tenureMonths; i++) {
      const dueDate = new Date(start);
      dueDate.setMonth(dueDate.getMonth() + i);
      paymentSchedule.push({
        installmentNumber: i,
        dueDate,
        amount: Math.round(monthlyPayment * 100) / 100,
        status: 'Pending' as const,
      });
    }

    const nextPaymentDate = new Date(start);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    const sale = await InstallmentSale.create({
      car: car,
      carId,
      customer,
      customerName,
      customerPhone,
      totalPrice,
      downPayment,
      loanAmount,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      interestRate: interestRate || 0,
      tenureMonths,
      startDate,
      paymentSchedule,
      nextPaymentDate,
      nextPaymentAmount: Math.round(monthlyPayment * 100) / 100,
      totalPaid: 0,
      remainingAmount,
      status: 'Active',
      notes,
      createdBy: user.userId,
    });

    // Update car status to Reserved
    await Car.findByIdAndUpdate(car, { status: 'Reserved' });

    // Create income transaction for down payment
    await Transaction.create({
      date: new Date(startDate),
      type: 'Income',
      category: 'Installment Payment',
      amount: downPayment,
      description: `Down payment for installment sale ${sale.saleId} - Car ${carId}`,
      referenceId: sale._id.toString(),
      referenceType: 'InstallmentSale',
      createdBy: user.userId,
    });

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Created installment sale: ${sale.saleId} for car ${carId}`,
      module: 'Sales',
      targetId: sale._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    console.error('Create installment sale error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}