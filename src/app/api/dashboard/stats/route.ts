import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Car from '@/models/Car';
import VehicleDocument from '@/models/Document';
import ActivityLog from '@/models/ActivityLog';
import CashSale from '@/models/CashSale';
import InstallmentSale from '@/models/InstallmentSale';
import Rental from '@/models/Rental';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const [
      totalCars,
      carsInStock,
      carsUnderRepair,
      carsSold,
      carsRented,
      carsReserved,
      // Sales stats
      totalCashSales,
      totalInstallments,
      activeRentals,
      // Financial stats
      cashRevenue,
      installmentPaid,
      rentalRevenue,
    ] = await Promise.all([
      Car.countDocuments(),
      Car.countDocuments({ status: 'In Stock' }),
      Car.countDocuments({ status: 'Under Repair' }),
      Car.countDocuments({ status: 'Sold' }),
      Car.countDocuments({ status: 'Rented' }),
      Car.countDocuments({ status: 'Reserved' }),
      // Sales
      CashSale.countDocuments(),
      InstallmentSale.countDocuments({ status: 'Active' }),
      Rental.countDocuments({ status: 'Active' }),
      // Financial
      CashSale.aggregate([{ $group: { _id: null, total: { $sum: '$finalPrice' } } }]),
      InstallmentSale.aggregate([{ $group: { _id: null, total: { $sum: '$totalPaid' } } }]),
      Rental.aggregate([{ $match: { status: 'Active' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    ]);

    const repairCostResult = await Car.aggregate([
      { $group: { _id: null, total: { $sum: '$totalRepairCost' } } },
    ]);
    const totalRepairCost = repairCostResult[0]?.total || 0;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringDocuments = await VehicleDocument.countDocuments({
      expiryDate: { $gte: now, $lte: thirtyDaysFromNow },
    });

    const recentActivity = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name');

    // Calculate total revenue
    const totalRevenue = (cashRevenue[0]?.total || 0) + (installmentPaid[0]?.total || 0) + (rentalRevenue[0]?.total || 0);

    // Calculate pending installments
    const pendingInstallments = await InstallmentSale.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: null, total: { $sum: '$remainingAmount' } } },
    ]);

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
      // Sales
      totalCashSales,
      totalInstallments,
      activeRentals,
      // Financial
      totalRevenue,
      pendingInstallments: pendingInstallments[0]?.total || 0,
      cashRevenue: cashRevenue[0]?.total || 0,
      installmentPaid: installmentPaid[0]?.total || 0,
      rentalRevenue: rentalRevenue[0]?.total || 0,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
