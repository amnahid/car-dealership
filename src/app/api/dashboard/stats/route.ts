import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Car from '@/models/Car';
import VehicleDocument from '@/models/Document';
import ActivityLog from '@/models/ActivityLog';
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
    ] = await Promise.all([
      Car.countDocuments(),
      Car.countDocuments({ status: 'In Stock' }),
      Car.countDocuments({ status: 'Under Repair' }),
      Car.countDocuments({ status: 'Sold' }),
      Car.countDocuments({ status: 'Rented' }),
      Car.countDocuments({ status: 'Reserved' }),
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
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
