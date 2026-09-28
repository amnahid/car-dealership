import { NextResponse, NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import InstallmentSale from '@/models/InstallmentSale';
import { getAuthPayload } from '@/lib/apiAuth';

import { calculateAccruedLateFee } from '@/lib/installmentUtils';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Format: YYYY-MM
    let startDate, endDate;
    
    if (month) {
      const [yearStr, monthStr] = month.split('-');
      const year = parseInt(yearStr);
      const monthIndex = parseInt(monthStr) - 1; // 0-based
      startDate = new Date(Date.UTC(year, monthIndex, 1));
      endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
    } else {
      // If no month, maybe fetch last 30 days or all. Let's just fetch everything if no month.
      startDate = new Date(0);
      endDate = new Date(3000, 0, 1);
    }

    const results: any[] = [];

    // 1. Fetch Installment Payments (excluding deleted and cancelled sales)
    const installments = await InstallmentSale.aggregate([
      { $match: { isDeleted: { $ne: true }, status: { $ne: 'Cancelled' } } },
      { $unwind: '$paymentSchedule' },
      { 
        $match: {
          $or: [
            { 'paymentSchedule.dueDate': { $gte: startDate, $lte: endDate } },
            { 'paymentSchedule.paidDate': { $gte: startDate, $lte: endDate } }
          ]
        }
      },
      { $lookup: { from: 'cars', localField: 'car', foreignField: '_id', as: 'carDetails' } },
      { $unwind: { path: '$carDetails', preserveNullAndEmptyArrays: true } }
    ]);

    installments.forEach(doc => {
      const p = doc.paymentSchedule;
      const method = p.method || '';
      const isPaid = p.status === 'Paid' || (p.paidAmount && p.paidAmount > 0);
      const isBank = /bank|online|transfer|card/i.test(method);
      const isCash = /cash/i.test(method) || (isPaid && !isBank);
      
      let lateFee = Number(p.lateFee) || 0;
      const otherFee = Number(p.otherFee) || 0;
      if (!isPaid && !lateFee && p.dueDate) {
        const dueDateObj = new Date(p.dueDate);
        const now = new Date();
        if (dueDateObj < now) {
          const daysOverdue = Math.floor((now.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24));
          lateFee = calculateAccruedLateFee(daysOverdue, doc.monthlyLateFee || 200);
        }
      }

      const paidAmt = p.paidAmount || (isPaid ? (p.amount + (p.lateFee || 0) + (p.otherFee || 0)) : 0);
      const cashAmt = isCash && isPaid ? paidAmt : 0;
      const bankAmt = isBank && isPaid ? paidAmt : 0;

      results.push({
        saleId: doc.saleId,
        customerName: doc.customerName,
        customerPhone: doc.customerPhone,
        carId: doc.carDetails?.plateNumber || doc.carId,
        amount: p.amount || 0,
        lateFee: lateFee,
        otherFee: otherFee,
        cashAmount: cashAmt,
        bankAmount: bankAmt,
        voucherNumber: p.voucherNumber || '',
        paidDate: p.paidDate || p.dueDate,
        dueDate: p.dueDate,
        status: p.status,
      });
    });

    // Sort combined results by paidDate descending
    results.sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching combined collections:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
