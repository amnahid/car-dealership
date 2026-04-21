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

    for (const sale of sales) {
      try {
        const customerData = await Customer.findById(sale.customer).lean();
        const carData = sale.car ? await Car.findById(sale.car).lean() : null;

        if (!customerData) {
          skipped++;
          continue;
        }

        for (const payment of (sale.paymentSchedule || [])) {
          const dueDate = new Date(payment.dueDate);
          const isPaid = payment.status === 'Paid';

          if (isPaid) {
            skipped++;
            continue;
          }

          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

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