import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Car from '@/models/Car';
import VehicleDocument from '@/models/Document';
import ActivityLog from '@/models/ActivityLog';
import CashSale from '@/models/CashSale';
import InstallmentSale from '@/models/InstallmentSale';
import Rental from '@/models/Rental';
import Transaction from '@/models/Transaction';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const quick = request.nextUrl.searchParams.get('quick') === 'true';

    if (quick) {
      // Fast path: only countDocuments + simple aggregates, no $unwind, no $lookup
      const [
        totalCars, carsInStock, carsUnderRepair, carsSold, carsRented, carsReserved,
        totalCashSales, totalInstallments, activeRentals, expiringDocuments,
        monthlyCashRevenueAgg, monthlyRentalRevenueAgg, monthlySalariesAgg,
        installmentStatsAgg,
      ] = await Promise.all([
        Car.countDocuments(),
        Car.countDocuments({ status: 'In Stock' }),
        Car.countDocuments({ status: 'Under Repair' }),
        Car.countDocuments({ status: 'Sold' }),
        Car.countDocuments({ status: 'Rented' }),
        Car.countDocuments({ status: 'Reserved' }),
        CashSale.countDocuments(),
        InstallmentSale.countDocuments({ status: 'Active' }),
        Rental.countDocuments({ status: 'Active' }),
        VehicleDocument.countDocuments({ expiryDate: { $gte: now, $lte: thirtyDaysFromNow } }),
        CashSale.aggregate([
          { $match: { saleDate: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$finalPrice' } } },
        ]),
        Rental.aggregate([
          { $match: { startDate: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
        Transaction.aggregate([
          { $match: { type: 'Expense', category: 'Salary Payment', date: { $gte: startOfMonth }, isDeleted: { $ne: true } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        InstallmentSale.aggregate([
          { $match: { status: 'Active' } },
          { $facet: {
            overdue: [
              { $unwind: '$paymentSchedule' },
              { $match: { 'paymentSchedule.status': { $ne: 'Paid' }, 'paymentSchedule.dueDate': { $lt: now } } },
              { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$paymentSchedule.amount' } } },
            ],
            upcoming: [
              { $unwind: '$paymentSchedule' },
              { $match: { 'paymentSchedule.status': { $ne: 'Paid' }, 'paymentSchedule.dueDate': { $gte: now, $lte: sevenDaysFromNow } } },
              { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$paymentSchedule.amount' } } },
            ],
            pending: [
              { $group: { _id: null, total: { $sum: '$remainingAmount' } } },
            ],
          }},
        ]),
      ]);

      const installmentStats = installmentStatsAgg[0] || {};
      const overdueAgg = installmentStats.overdue?.[0];
      const upcomingAgg = installmentStats.upcoming?.[0];
      const pendingInstallmentsAgg = installmentStats.pending?.[0];

      return NextResponse.json({
        totalCars, carsInStock, carsUnderRepair, carsSold, carsRented, carsReserved,
        totalCashSales, totalInstallments, activeRentals, expiringDocuments,
        monthlyRevenue: (monthlyCashRevenueAgg[0]?.total || 0) + (monthlyRentalRevenueAgg[0]?.total || 0),
        monthlyExpenses: monthlySalariesAgg[0]?.total || 0,
        pendingInstallments: pendingInstallmentsAgg?.total || 0,
        overdueInstallments: overdueAgg?.count || 0,
        overdueInstallmentsAmount: overdueAgg?.total || 0,
        upcomingInstallments: upcomingAgg?.count || 0,
        upcomingInstallmentsAmount: upcomingAgg?.total || 0,
      });
    }

    const [
      totalCars,
      carsInStock,
      carsUnderRepair,
      carsSold,
      carsRented,
      carsReserved,
      totalCashSales,
      totalInstallments,
      activeRentals,
      cashRevenueAgg,
      installmentPaidAgg,
      rentalRevenueAgg,
      monthlyCashRevenueAgg,
      monthlyInstallmentPaidAgg,
      monthlyRentalRevenueAgg,
      totalRepairCostAgg,
      totalSalariesAgg,
      salesByMonth,
      installmentStatsAgg,
      expiringDocuments,
      monthlySalariesAgg,
      recentActivity,
      expenseByCategoryAgg,
      monthlyTrendsAgg,
    ] = await Promise.all([
      Car.countDocuments(),
      Car.countDocuments({ status: 'In Stock' }),
      Car.countDocuments({ status: 'Under Repair' }),
      Car.countDocuments({ status: 'Sold' }),
      Car.countDocuments({ status: 'Rented' }),
      Car.countDocuments({ status: 'Reserved' }),
      CashSale.countDocuments(),
      InstallmentSale.countDocuments({ status: 'Active' }),
      Rental.countDocuments({ status: 'Active' }),
      CashSale.aggregate([{ $group: { _id: null, total: { $sum: '$finalPrice' } } }]),
      InstallmentSale.aggregate([{ $group: { _id: null, total: { $sum: '$totalPaid' } } }]),
      Rental.aggregate([{ $match: { status: 'Completed' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      CashSale.aggregate([
        { $match: { saleDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$finalPrice' } } }
      ]),
      InstallmentSale.aggregate([
        { $match: { status: 'Active' } },
        { $unwind: '$paymentSchedule' },
        { $match: { 'paymentSchedule.status': 'Paid', 'paymentSchedule.paidDate': { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$paymentSchedule.amount' } } }
      ]),
      Rental.aggregate([
        { $match: { startDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Car.aggregate([{ $group: { _id: null, total: { $sum: '$totalRepairCost' } } }]),
      Transaction.aggregate([
        { $match: { type: 'Expense', category: 'Salary Payment', isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      CashSale.aggregate([
        { $match: { saleDate: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$saleDate' } },
            total: { $sum: '$finalPrice' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // formerly second batch
      InstallmentSale.aggregate([
        { $match: { status: 'Active' } },
        { $facet: {
          overdue: [
            { $unwind: '$paymentSchedule' },
            { $match: { 'paymentSchedule.status': { $ne: 'Paid' }, 'paymentSchedule.dueDate': { $lt: now } } },
            { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$paymentSchedule.amount' } } },
          ],
          upcoming: [
            { $unwind: '$paymentSchedule' },
            { $match: { 'paymentSchedule.status': { $ne: 'Paid' }, 'paymentSchedule.dueDate': { $gte: now, $lte: sevenDaysFromNow } } },
            { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$paymentSchedule.amount' } } },
          ],
          pending: [
            { $group: { _id: null, total: { $sum: '$remainingAmount' } } },
          ],
        }},
      ]),
      VehicleDocument.countDocuments({ expiryDate: { $gte: now, $lte: thirtyDaysFromNow } }),
      Transaction.aggregate([
        { $match: { type: 'Expense', category: 'Salary Payment', date: { $gte: startOfMonth }, isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name').lean(),
      Transaction.aggregate([
        { $match: { type: 'Expense', isDeleted: { $ne: true } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { date: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, income: { $sum: { $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0] } }, expenses: { $sum: { $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0] } } } },
        { $sort: { _id: 1 } }
      ]),
    ]);

    const cashRevenue = cashRevenueAgg[0]?.total || 0;
    const installmentPaid = installmentPaidAgg[0]?.total || 0;
    const rentalRevenue = rentalRevenueAgg[0]?.total || 0;
    const totalRevenue = cashRevenue + installmentPaid + rentalRevenue;

    const totalRepairCost = totalRepairCostAgg[0]?.total || 0;
    const totalSalaries = totalSalariesAgg[0]?.total || 0;
    const totalExpenses = totalRepairCost + totalSalaries;
    const totalProfit = totalRevenue - totalExpenses;

    const monthlyCashRevenue = monthlyCashRevenueAgg[0]?.total || 0;
    const monthlyInstallmentPaid = monthlyInstallmentPaidAgg[0]?.total || 0;
    const monthlyRentalRevenue = monthlyRentalRevenueAgg[0]?.total || 0;
    const monthlyRevenue = monthlyCashRevenue + monthlyInstallmentPaid + monthlyRentalRevenue;

    const monthlyExpenses = monthlySalariesAgg[0]?.total || 0;
    const monthlyProfit = monthlyRevenue - monthlyExpenses;

    const installmentStats = installmentStatsAgg[0] || {};
    const overdueAgg = installmentStats.overdue?.[0];
    const upcomingAgg = installmentStats.upcoming?.[0];
    const pendingInstallmentsAgg = installmentStats.pending?.[0];

    return NextResponse.json({
      totalCars,
      carsInStock,
      carsUnderRepair,
      carsSold,
      carsRented,
      carsReserved,
      totalRepairCost,
      expiringDocuments,
      recentActivity,
      totalCashSales,
      totalInstallments,
      activeRentals,
      totalRevenue,
      totalProfit,
      totalExpenses,
      monthlyRevenue,
      monthlyProfit,
      monthlyExpenses,
      cashRevenue,
      installmentPaid,
      rentalRevenue,
      pendingInstallments: pendingInstallmentsAgg?.total || 0,
      overdueInstallments: overdueAgg?.count || 0,
      overdueInstallmentsAmount: overdueAgg?.total || 0,
      upcomingInstallments: upcomingAgg?.count || 0,
      upcomingInstallmentsAmount: upcomingAgg?.total || 0,
      salesByMonth: salesByMonth.map((s: { _id: string; total: number; count: number }) => ({ month: s._id, total: s.total, count: s.count })),
      incomeByType: [
        { name: 'Cash Sale', value: cashRevenue },
        { name: 'Installment', value: installmentPaid },
        { name: 'Rental', value: rentalRevenue },
      ],
      expenseByCategory: expenseByCategoryAgg.map((e: { _id: string; total: number }) => ({ name: e._id, value: e.total })),
      monthlyTrends: monthlyTrendsAgg.map((t: { _id: string; income: number; expenses: number }) => ({
        month: t._id,
        income: t.income,
        expenses: t.expenses,
        profit: t.income - t.expenses,
      })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}