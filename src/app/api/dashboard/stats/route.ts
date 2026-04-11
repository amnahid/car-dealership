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
        { $match: { type: 'expense', category: 'Salary' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'expense' } },
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
    ]);

    // Run overdue/ upcoming queries separately AFTER Promise.all to avoid Promise.all caching issues
    const overdueAgg = await InstallmentSale.aggregate([
      { $match: { status: 'Active' } },
      { $unwind: '$paymentSchedule' },
      { $match: { 'paymentSchedule.status': { $ne: 'Paid' }, 'paymentSchedule.dueDate': { $lt: now } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$paymentSchedule.amount' } } }
    ]);

    const upcomingAgg = await InstallmentSale.aggregate([
      { $match: { status: 'Active' } },
      { $unwind: '$paymentSchedule' },
      { $match: { 'paymentSchedule.status': { $ne: 'Paid' }, 'paymentSchedule.dueDate': { $gte: now, $lte: sevenDaysFromNow } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$paymentSchedule.amount' } } }
    ]);

    const expiringDocuments = await VehicleDocument.countDocuments({
      expiryDate: { $gte: now, $lte: thirtyDaysFromNow },
    });

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

    const monthlyRepairCost = await Car.aggregate([
      { $match: { 'repairs.date': { $gte: startOfMonth } } },
      { $unwind: '$repairs' },
      { $match: { 'repairs.date': { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$repairs.cost' } } }
    ]);
    const monthlySalaries = await Transaction.aggregate([
      { $match: { type: 'expense', category: 'Salary', date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyExpenses = (monthlyRepairCost[0]?.total || 0) + (monthlySalaries[0]?.total || 0);
    const monthlyProfit = monthlyRevenue - monthlyExpenses;

    const pendingInstallmentsAgg = await InstallmentSale.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: null, total: { $sum: '$remainingAmount' } } },
    ]);

    const recentActivity = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name');

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
      pendingInstallments: pendingInstallmentsAgg[0]?.total || 0,
      overdueInstallments: (overdueAgg[0]?.count || 0),
      overdueInstallmentsAmount: (overdueAgg[0]?.total || 0),
      upcomingInstallments: (upcomingAgg[0]?.count || 0),
      upcomingInstallmentsAmount: (upcomingAgg[0]?.total || 0),
      salesByMonth: salesByMonth.map((s: { _id: string; total: number; count: number }) => ({ month: s._id, total: s.total, count: s.count })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}