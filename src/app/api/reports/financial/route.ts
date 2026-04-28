import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Transaction from '@/models/Transaction';
import Car from '@/models/Car';
import CashSale from '@/models/CashSale';
import InstallmentSale from '@/models/InstallmentSale';
import Rental from '@/models/Rental';
import SalaryPayment from '@/models/SalaryPayment';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Admin', 'Finance Manager'].includes(user.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, year
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Set date range based on period or custom dates
    let dateFilter: Record<string, Date> = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
      switch (period) {
        case 'day':
          dateFilter = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
          break;
        case 'week':
          dateFilter = { $gte: new Date(now.setDate(now.getDate() - 7)) };
          break;
        case 'month':
          dateFilter = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
          break;
        case 'year':
          dateFilter = { $gte: new Date(now.getFullYear(), 0, 1) };
          break;
        default:
          dateFilter = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
      }
    }

    const [
      cashSalesIncome,
      installmentIncome,
      rentalIncome,
      salaryExpenses,
      carPurchaseCosts,
      repairCosts,
      transactionExpenses,
      miscIncome,
      profitPerCar,
      salesByMonth,
    ] = await Promise.all([
      CashSale.aggregate([
        { $match: { saleDate: dateFilter, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$finalPrice' } } },
      ]),
      InstallmentSale.aggregate([
        { $match: { startDate: dateFilter, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalPaid' } } },
      ]),
      Rental.aggregate([
        { $match: { startDate: dateFilter, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      SalaryPayment.aggregate([
        { $match: { paymentDate: dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Car.aggregate([
        { $match: { createdAt: dateFilter, isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$purchasePrice' } } },
      ]),
      Car.aggregate([
        { $match: { createdAt: dateFilter, isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$totalRepairCost' } } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'Expense', date: dateFilter, category: { $nin: ['Salary Payment', 'Car Purchase', 'Car Repair'] }, isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'Income', date: dateFilter, category: { $nin: ['Cash Sale', 'Installment Payment', 'Rental Income'] }, isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      CashSale.aggregate([
        { $match: { saleDate: dateFilter, status: { $ne: 'Cancelled' } } },
        {
          $lookup: {
            from: 'cars',
            localField: 'car',
            foreignField: '_id',
            as: 'carData',
          },
        },
        { $unwind: '$carData' },
        {
          $project: {
            carId: 1,
            salePrice: '$finalPrice',
            purchasePrice: '$carData.purchasePrice',
            repairCost: '$carData.totalRepairCost',
          },
        },
        {
          $project: {
            carId: 1,
            profit: { $subtract: ['$salePrice', { $add: ['$purchasePrice', { $ifNull: ['$repairCost', 0] }] }] },
          },
        },
        { $group: { _id: null, avgProfit: { $avg: '$profit' }, totalProfit: { $sum: '$profit' } } },
      ]),
      CashSale.aggregate([
        { $match: { saleDate: dateFilter, status: { $ne: 'Cancelled' } } },
        {
          $group: {
            _id: { $month: '$saleDate' },
            count: { $sum: 1 },
            total: { $sum: '$finalPrice' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const totalIncome =
      (cashSalesIncome[0]?.total || 0) +
      (installmentIncome[0]?.total || 0) +
      (rentalIncome[0]?.total || 0) +
      (miscIncome[0]?.total || 0);

    const totalExpense =
      (salaryExpenses[0]?.total || 0) +
      (carPurchaseCosts[0]?.total || 0) +
      (repairCosts[0]?.total || 0) +
      (transactionExpenses[0]?.total || 0);

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        profitMargin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(2) : 0,
      },
      breakdown: {
        cashSales: cashSalesIncome[0]?.total || 0,
        installmentPayments: installmentIncome[0]?.total || 0,
        rentalIncome: rentalIncome[0]?.total || 0,
        miscIncome: miscIncome[0]?.total || 0,
        salaryExpenses: salaryExpenses[0]?.total || 0,
        carPurchaseCosts: carPurchaseCosts[0]?.total || 0,
        repairCosts: repairCosts[0]?.total || 0,
        otherExpenses: transactionExpenses[0]?.total || 0,
      },
      carProfit: {
        average: profitPerCar[0]?.avgProfit || 0,
        total: profitPerCar[0]?.totalProfit || 0,
      },
      salesByMonth,
      period: { start: dateFilter.$gte, end: dateFilter.$lte || new Date() },
    });
  } catch (error) {
    console.error('Get financial report error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
