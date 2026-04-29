import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CashSale from '@/models/CashSale';
import Car from '@/models/Car';
import Transaction from '@/models/Transaction';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (auth.normalizedRole !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { action, ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    if (action === 'cancel') {
      const sales = await CashSale.find({ _id: { $in: ids }, isDeleted: { $ne: true } });
      const activeIds = sales.map(s => s._id);
      const carIds = sales.map(s => s.car);
      const saleObjectIds = sales.map(s => s._id.toString());

      if (activeIds.length > 0) {
        // Soft delete
        await CashSale.updateMany(
          { _id: { $in: activeIds } },
          { $set: { isDeleted: true } }
        );

        // Revert cars status to In Stock
        await Car.updateMany(
          { _id: { $in: carIds } },
          { $set: { status: 'In Stock' } }
        );

        // Soft delete associated transactions
        await Transaction.updateMany(
          {
            referenceId: { $in: saleObjectIds },
            referenceType: 'CashSale'
          },
          { $set: { isDeleted: true } }
        );

        await logActivity({
          userId: auth.userId,
          userName: auth.name,
          action: `Bulk deleted ${activeIds.length} cash sales`,
          module: 'Sales',
          details: `IDs: ${activeIds.join(', ')}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });
      }

      return NextResponse.json({ message: `Successfully deleted ${activeIds.length} sales` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk cash sale action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
