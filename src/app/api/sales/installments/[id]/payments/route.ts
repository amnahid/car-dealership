import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import InstallmentSale from '@/models/InstallmentSale';
import Transaction from '@/models/Transaction';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid sale ID' }, { status: 400 });
    }

    const body = await request.json();
    const { installmentNumber, amount, paymentDate, notes } = body;

    if (!installmentNumber || !amount || !paymentDate) {
      return NextResponse.json({ error: 'Installment number, amount and payment date are required' }, { status: 400 });
    }

    const sale = await InstallmentSale.findById(id);
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Update the specific installment in the schedule
    const installmentIndex = sale.paymentSchedule.findIndex(
      p => p.installmentNumber === installmentNumber
    );

    if (installmentIndex === -1) {
      return NextResponse.json({ error: 'Invalid installment number' }, { status: 400 });
    }

    sale.paymentSchedule[installmentIndex].status = 'Paid';
    sale.paymentSchedule[installmentIndex].paidDate = new Date(paymentDate);
    sale.paymentSchedule[installmentIndex].paidAmount = amount;
    sale.paymentSchedule[installmentIndex].notes = notes;

    // Update totals
    sale.totalPaid += amount;
    sale.remainingAmount = sale.loanAmount - sale.totalPaid;

    // Update next payment
    const nextPending = sale.paymentSchedule.find(p => p.status === 'Pending');
    if (nextPending) {
      sale.nextPaymentDate = nextPending.dueDate;
      sale.nextPaymentAmount = nextPending.amount;
    } else {
      // All payments completed
      sale.status = 'Completed';
      sale.nextPaymentDate = null as unknown as Date;
      sale.nextPaymentAmount = 0;
    }

    await sale.save();

    // Create income transaction for the payment
    await Transaction.create({
      date: new Date(paymentDate),
      type: 'Income',
      category: 'Installment Payment',
      amount,
      description: `Installment ${installmentNumber} for sale ${sale.saleId} - Car ${sale.carId}`,
      referenceId: sale._id.toString(),
      referenceType: 'InstallmentSale',
      createdBy: user.userId,
    });

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Recorded payment for installment ${installmentNumber} of sale ${sale.saleId}`,
      module: 'Sales',
      targetId: sale._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ sale });
  } catch (error) {
    console.error('Record payment error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}