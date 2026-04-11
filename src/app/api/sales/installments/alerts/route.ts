import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import InstallmentSale from '@/models/InstallmentSale';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const sales = await InstallmentSale.find({ status: 'Active' }).lean();

    const overduePayments: Array<{
      _id: string;
      saleId: string;
      customerName: string;
      customerPhone: string;
      carId: string;
      installmentNumber: number;
      amount: number;
      dueDate: string;
      daysOverdue: number;
    }> = [];

    const upcomingPayments: Array<{
      _id: string;
      saleId: string;
      customerName: string;
      customerPhone: string;
      carId: string;
      installmentNumber: number;
      amount: number;
      dueDate: string;
      daysUntilDue: number;
    }> = [];

    for (const sale of sales) {
      for (const payment of (sale.paymentSchedule || [])) {
        const dueDate = new Date(payment.dueDate);
        
        // Check if payment is not paid - use status field
        const isPaid = payment.status === 'Paid';
        
        if (!isPaid && dueDate < now) {
          const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          overduePayments.push({
            _id: sale._id.toString(),
            saleId: sale.saleId,
            customerName: sale.customerName,
            customerPhone: sale.customerPhone,
            carId: sale.carId,
            installmentNumber: payment.installmentNumber,
            amount: payment.amount,
            dueDate: payment.dueDate.toString(),
            daysOverdue,
          });
        } else if (!isPaid && dueDate <= sevenDaysFromNow && dueDate >= now) {
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          upcomingPayments.push({
            _id: sale._id.toString(),
            saleId: sale.saleId,
            customerName: sale.customerName,
            customerPhone: sale.customerPhone,
            carId: sale.carId,
            installmentNumber: payment.installmentNumber,
            amount: payment.amount,
            dueDate: payment.dueDate.toString(),
            daysUntilDue,
          });
        }
      }
    }

    const overdueTotal = overduePayments.reduce((sum, p) => sum + p.amount, 0);
    const upcomingTotal = upcomingPayments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      overdue: {
        count: overduePayments.length,
        total: overdueTotal,
        payments: overduePayments,
      },
      upcoming: {
        count: upcomingPayments.length,
        total: upcomingTotal,
        payments: upcomingPayments,
      },
    });
  } catch (error) {
    console.error('Get installment alerts error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}