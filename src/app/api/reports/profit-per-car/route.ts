import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Car from '@/models/Car';
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

    const cars = await Car.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      // Join with CarPurchase to get purchasePrice
      {
        $lookup: {
          from: 'carpurchases',
          localField: 'purchase',
          foreignField: '_id',
          as: 'purchaseData',
        },
      },
      {
        $addFields: {
          purchasePrice: { $ifNull: [{ $arrayElemAt: ['$purchaseData.purchasePrice', 0] }, 0] },
        },
      },
      // Join with CashSale to get sale revenue
      {
        $lookup: {
          from: 'cashsales',
          let: { carId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$car', '$$carId'] }, { $eq: ['$status', 'Active'] }] } } },
            { $project: { finalPrice: 1 } },
          ],
          as: 'cashSaleData',
        },
      },
      // Join with InstallmentSale to get installment revenue
      {
        $lookup: {
          from: 'installmentsales',
          let: { carId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$car', '$$carId'] }, { $in: ['$status', ['Active', 'Completed']] }] } } },
            { $project: { totalPrice: 1 } },
          ],
          as: 'installmentSaleData',
        },
      },
      // Join with Rental to get rental revenue
      {
        $lookup: {
          from: 'rentals',
          let: { carId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$car', '$$carId'] }, { $ne: ['$status', 'Cancelled'] }] } } },
            { $group: { _id: null, totalRental: { $sum: '$totalAmount' } } },
          ],
          as: 'rentalData',
        },
      },
      // Calculate revenue: sum of (cash or installment) + all rentals
      {
        $addFields: {
          saleRevenue: {
            $cond: {
              if: { $gt: [{ $size: '$cashSaleData' }, 0] },
              then: { $arrayElemAt: ['$cashSaleData.finalPrice', 0] },
              else: {
                $cond: {
                  if: { $gt: [{ $size: '$installmentSaleData' }, 0] },
                  then: { $arrayElemAt: ['$installmentSaleData.totalPrice', 0] },
                  else: 0,
                },
              },
            },
          },
          rentalRevenue: { $ifNull: [{ $arrayElemAt: ['$rentalData.totalRental', 0] }, 0] },
        },
      },
      {
        $addFields: {
          revenue: { $add: ['$saleRevenue', '$rentalRevenue'] },
        },
      },
      // Compute totalCost and profit
      {
        $addFields: {
          totalCost: { $add: ['$purchasePrice', { $ifNull: ['$totalRepairCost', 0] }] },
        },
      },
      {
        $addFields: {
          profit: { $subtract: ['$revenue', '$totalCost'] },
        },
      },
      // Final projection
      {
        $project: {
          _id: 1,
          carId: 1,
          brand: 1,
          model: 1,
          year: 1,
          status: 1,
          purchasePrice: 1,
          repairCost: { $ifNull: ['$totalRepairCost', 0] },
          totalCost: 1,
          revenue: 1,
          profit: 1,
        },
      },
      { $sort: { carId: 1 } },
    ]);

    // Compute summary stats
    const soldCars = cars.filter((c) => c.revenue > 0);
    const totalProfit = soldCars.reduce((sum: number, c: { profit: number }) => sum + c.profit, 0);
    const avgProfit = soldCars.length > 0 ? totalProfit / soldCars.length : 0;
    const totalRevenue = cars.reduce((sum: number, c: { revenue: number }) => sum + c.revenue, 0);
    const totalCost = cars.reduce((sum: number, c: { totalCost: number }) => sum + c.totalCost, 0);

    return NextResponse.json({
      cars,
      summary: {
        totalCars: cars.length,
        soldCars: soldCars.length,
        totalRevenue,
        totalCost,
        totalProfit,
        avgProfit: Math.round(avgProfit),
      },
    });
  } catch (error) {
    console.error('Profit per car report error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
