import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import InstallmentSale from '@/models/InstallmentSale';
import Customer from '@/models/Customer';
import Car from '@/models/Car';
import { sendPaymentReminderNotifications, sendOverdueNoticeNotifications } from '@/lib/saleNotifications';

export const dynamic = 'force-dynamic';

const DEFAULT_LATE_FEE_PERCENT = parseInt(process.env.LATE_FEE_PERCENT || '5');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'both';
    const lateFeePercent = parseInt(searchParams.get('lateFee') || DEFAULT_LATE_FEE_PERCENT.toString());
    const apiKey = searchParams.get('key');

    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && apiKey !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000 - 1);

    const sales = await InstallmentSale.find({ status: 'Active' }).lean();

    let remindersSent = 0;
    let overdueSent = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Batch-load all customers and cars upfront to avoid N+1 queries
    const customerIds = [...new Set(sales.map((s) => s.customer.toString()))];
    const carIds = [...new Set(sales.filter((s) => s.car).map((s) => s.car!.toString()))];
    const [customers, cars] = await Promise.all([
      Customer.find({ _id: { $in: customerIds } }).lean(),
      carIds.length > 0 ? Car.find({ _id: { $in: carIds } }).lean() : [],
    ]);
    const customerMap = new Map(customers.map((c) => [c._id.toString(), c]));
    const carMap = new Map(cars.map((c) => [c._id.toString(), c]));

    for (const sale of sales) {
      try {
        const customerData = customerMap.get(sale.customer.toString());
        const carData = sale.car ? carMap.get(sale.car.toString()) ?? null : null;

        if (!customerData) {
          skipped++;
          continue;
        }

        let hasOverdueUpdate = false;
        const currentPaymentSchedule = sale.paymentSchedule || [];

        for (let i = 0; i < currentPaymentSchedule.length; i++) {
          const payment = currentPaymentSchedule[i];
          const dueDate = new Date(payment.dueDate);
          const isPaid = payment.status === 'Paid';

          if (isPaid) {
            continue;
          }

          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

          // Auto-update status to Overdue in DB if past due date
          if (daysOverdue > 0 && payment.status !== 'Overdue') {
            await InstallmentSale.updateOne(
              { _id: sale._id, 'paymentSchedule.installmentNumber': payment.installmentNumber },
              { $set: { 'paymentSchedule.$.status': 'Overdue' } }
            );
            hasOverdueUpdate = true;
          }

          const customerInfo = {
            name: sale.customerName,
            phone: sale.customerPhone,
            email: customerData.email,
          };

          const paymentInfo = {
            saleId: sale.saleId,
            carId: sale.carId,
            carBrand: carData?.brand,
            carModel: carData?.model,
            installmentNumber: payment.installmentNumber,
            amount: payment.amount,
            dueDate: payment.dueDate.toString(),
            lateFeePercent,
          };

          if ((action === 'reminders' || action === 'both') && daysUntilDue > 0 && daysUntilDue <= 7) {
            await sendPaymentReminderNotifications(customerInfo, {
              ...paymentInfo,
              daysUntilDue,
            });
            remindersSent++;
          }

          if ((action === 'overdue' || action === 'both') && daysOverdue > 0) {
            await sendOverdueNoticeNotifications(customerInfo, {
              ...paymentInfo,
              daysOverdue,
            });
            overdueSent++;
          }
        }

        // If there are overdue installments, we might want to update the sale status to Defaulted
        // Check for ANY overdue installment in the schedule
        const hasAnyOverdue = currentPaymentSchedule.some(p => {
          const dueDate = new Date(p.dueDate);
          return p.status !== 'Paid' && dueDate < now;
        });

        if (hasAnyOverdue && sale.status === 'Active') {
          await Promise.all([
            InstallmentSale.updateOne({ _id: sale._id }, { $set: { status: 'Defaulted' } }),
            Car.updateOne({ _id: sale.car }, { $set: { status: 'Defaulted' } }),
          ]);
        } else if (!hasAnyOverdue && sale.status === 'Defaulted') {
          await Promise.all([
            InstallmentSale.updateOne({ _id: sale._id }, { $set: { status: 'Active' } }),
            Car.updateOne({ _id: sale.car }, { $set: { status: 'On Installment' } }),
          ]);
        }
      } catch (err) {
        errors.push(`Error processing sale ${sale.saleId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    console.log(`Cron job completed: ${remindersSent} reminders, ${overdueSent} overdue notices, ${skipped} skipped, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        remindersSent,
        overdueSent,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Installment reminders cron error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
