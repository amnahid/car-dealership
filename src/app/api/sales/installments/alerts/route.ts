import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import InstallmentSale from '@/models/InstallmentSale';
import Customer from '@/models/Customer';
import { getAuthPayload } from '@/lib/apiAuth';
import { sendPaymentReminderNotifications, sendOverdueNoticeNotifications } from '@/lib/saleNotifications';
import { calculateAccruedLateFee } from '@/lib/installmentUtils';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.normalizedRoles.some(r => ['Admin', 'Sales Person', 'Accountant', 'Finance Manager'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.normalizedRoles.some(r => ['Admin', 'Sales Person', 'Accountant', 'Finance Manager'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { action } = body;

    if (action === 'send-reminders' || action === 'send-overdue') {
      const now = new Date();

      const sales = await InstallmentSale.find({ status: 'Active' });

      let remindersSent = 0;
      let overdueSent = 0;
      const failed = 0;

      // Batch-load all customers and cars upfront to avoid N+1 queries
      const Car = (await import('@/models/Car')).default;
      const customerIds = [...new Set(sales.map((s) => s.customer.toString()))];
      const carIds = [...new Set(sales.filter((s) => s.car).map((s) => s.car!.toString()))];
      const [customers, cars] = await Promise.all([
        Customer.find({ _id: { $in: customerIds } }).lean(),
        carIds.length > 0 ? Car.find({ _id: { $in: carIds } }).lean() : [],
      ]);
      const customerMap = new Map(customers.map((c) => [c._id.toString(), c]));
      const carMap = new Map(cars.map((c) => [c._id.toString(), c]));

      for (const sale of sales) {
        const customerData = customerMap.get(sale.customer.toString());
        const carData = sale.car ? carMap.get(sale.car.toString()) ?? null : null;

        if (!customerData) continue;

        for (const payment of (sale.paymentSchedule || [])) {
          const dueDate = new Date(payment.dueDate);
          const isPaid = payment.status === 'Paid';

          if (!isPaid) {
            const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            // Calculate accrued late fee: 10 day grace period, then monthlyLateFee per month
            const accruedLateFee = calculateAccruedLateFee(daysOverdue, sale.monthlyLateFee);

            if (action === 'send-reminders' && daysUntilDue > 0 && daysUntilDue <= 7) {
              await sendPaymentReminderNotifications(
                { name: sale.customerName, phone: sale.customerPhone, email: customerData.email },
                {
                  saleId: sale.saleId,
                  carId: sale.carId,
                  carBrand: carData?.brand,
                  carModel: carData?.model,
                  installmentNumber: payment.installmentNumber,
                  amount: payment.amount,
                  dueDate: payment.dueDate.toString(),
                  daysUntilDue,
                  monthlyLateFee: sale.monthlyLateFee || 200,
                  accruedLateFee,
                }
              );
              remindersSent++;
            }

            if (action === 'send-overdue' && daysOverdue > 0) {
              await sendOverdueNoticeNotifications(
                { name: sale.customerName, phone: sale.customerPhone, email: customerData.email },
                {
                  saleId: sale.saleId,
                  carId: sale.carId,
                  carBrand: carData?.brand,
                  carModel: carData?.model,
                  installmentNumber: payment.installmentNumber,
                  amount: payment.amount,
                  dueDate: payment.dueDate.toString(),
                  daysOverdue,
                  monthlyLateFee: sale.monthlyLateFee || 200,
                  accruedLateFee,
                }
              );
              overdueSent++;
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        action,
        remindersSent,
        overdueSent,
        failed,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Send installment notifications error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
