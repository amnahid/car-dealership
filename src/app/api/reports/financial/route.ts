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

    if (!user.normalizedRoles.some(r => ['Admin', 'Finance Manager'].includes(r))) {
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
      incomeStats,
      expenseStats,
      profitPerCar,
      salesByMonth,
    ] = await Promise.all([
      // Aggregate all incomes by category
      Transaction.aggregate([
        { $match: { type: 'Income', date: dateFilter, isDeleted: { $ne: true } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
      // Aggregate all expenses by category
      Transaction.aggregate([
        { $match: { type: 'Expense', date: dateFilter, isDeleted: { $ne: true } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
      // Profit per car (based on Active cash sales)
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
      // Sales counts and totals by month (from Transactions)
      Transaction.aggregate([
        { $match: { type: 'Income', category: 'Cash Sale', date: dateFilter, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: { $month: '$date' },
            count: { $sum: 1 },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Parse income stats
    const incomeBreakdown = {
      cashSales: incomeStats.find(s => s._id === 'Cash Sale')?.total || 0,
      installmentPayments: incomeStats.find(s => s._id === 'Installment Payment')?.total || 0,
      rentalIncome: incomeStats.find(s => s._id === 'Rental Income')?.total || 0,
      miscIncome: incomeStats.reduce((sum, s) => {
        if (!['Cash Sale', 'Installment Payment', 'Rental Income'].includes(s._id)) {
          return sum + s.total;
        }
        return sum;
      }, 0),
    };

    const totalIncome = incomeStats.reduce((sum, s) => sum + s.total, 0);

    // Parse expense stats
    const expenseBreakdown = {
      salaryExpenses: expenseStats.find(s => s._id === 'Salary Payment')?.total || 0,
      carPurchaseCosts: expenseStats.find(s => s._id === 'Car Purchase')?.total || 0,
      repairCosts: expenseStats.find(s => s._id === 'Car Repair')?.total || 0,
      otherExpenses: expenseStats.reduce((sum, s) => {
        if (!['Salary Payment', 'Car Purchase', 'Car Repair'].includes(s._id)) {
          return sum + s.total;
        }
        return sum;
      }, 0),
    };

    const totalExpense = expenseStats.reduce((sum, s) => sum + s.total, 0);

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        profitMargin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(2) : 0,
      },
      breakdown: {
        ...incomeBreakdown,
        ...expenseBreakdown,
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
