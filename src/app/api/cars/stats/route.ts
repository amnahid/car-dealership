import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import Car from '@/models/Car';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['Admin', 'Car Manager', 'Sales Person', 'Accountant', 'Finance Manager'].includes(auth.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const [result] = await Car.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: 'carpurchases',
          localField: 'purchase',
          foreignField: '_id',
          as: 'purchaseData',
        }
      },
      {
        $addFields: {
          purchasePrice: { $ifNull: [{ $arrayElemAt: ['$purchaseData.purchasePrice', 0] }, 0] }
        }
      },
      {
        $facet: {
          statusCounts: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          inStockStats: [
            { $match: { status: 'In Stock' } },
            {
              $group: {
                _id: null,
                totalPurchaseValue: { $sum: '$purchasePrice' },
                totalRepairCost: { $sum: '$totalRepairCost' },
                totalCost: { $sum: { $add: ['$purchasePrice', '$totalRepairCost'] } },
              }
            }
          ],
          stockReport: [
            { $match: { status: 'In Stock' } },
            {
              $group: {
                _id: { brand: '$brand', model: '$model' },
                count: { $sum: 1 },
                value: { $sum: '$purchasePrice' },
              }
            },
            { $sort: { '_id.brand': 1, '_id.model': 1 } }
          ]
        }
      }
    ]);

    const statusMap: Record<string, number> = {};
    (result.statusCounts || []).forEach((s: { _id: string; count: number }) => {
      if (s._id) statusMap[s._id] = s.count;
    });

    const inStockStats = result.inStockStats[0] || { totalPurchaseValue: 0, totalRepairCost: 0, totalCost: 0 };

    const byBrand: Record<string, { count: number; value: number; models: Record<string, number> }> = {};
    (result.stockReport || []).forEach((item: { _id: { brand: string; model: string }; count: number; value: number }) => {
      const brand = item._id.brand;
      const model = item._id.model;
      if (!byBrand[brand]) byBrand[brand] = { count: 0, value: 0, models: {} };
      byBrand[brand].count += item.count;
      byBrand[brand].value += item.value;
      byBrand[brand].models[model] = item.count;
    });

    const stockReport = Object.entries(byBrand)
      .map(([brand, data]) => ({ brand, ...data }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      statusCounts: {
        inStock: statusMap['In Stock'] || 0,
        sold: statusMap['Sold'] || 0,
        underRepair: statusMap['Under Repair'] || 0,
        rented: statusMap['Rented'] || 0,
        reserved: statusMap['Reserved'] || 0,
      },
      inStockStats: {
        totalPurchaseValue: inStockStats.totalPurchaseValue,
        totalRepairCost: inStockStats.totalRepairCost,
        totalCost: inStockStats.totalCost,
      },
      stockReport,
    });
  } catch (error) {
    console.error('Cars stats error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: (error as DatabaseConnectionError).message }, { status: (error as DatabaseConnectionError).statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
