import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Rental from '@/models/Rental';
import Car from '@/models/Car';
import Transaction from '@/models/Transaction';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['Admin', 'Finance Manager'].includes(auth.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { action, ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    if (action === 'cancel') {
      const rentals = await Rental.find({ _id: { $in: ids }, isDeleted: { $ne: true } });
      const activeIds = rentals.map(r => r._id);
      const carIds = rentals.map(r => r.car);
      const rentalObjectIds = rentals.map(r => r._id.toString());

      if (activeIds.length > 0) {
        // Soft delete
        await Rental.updateMany(
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
            referenceId: { $in: rentalObjectIds },
            referenceType: 'Rental'
          },
          { $set: { isDeleted: true } }
        );

        await logActivity({
          userId: auth.userId,
          userName: auth.name,
          action: `Bulk deleted ${activeIds.length} rentals`,
          module: 'Rental',
          details: `IDs: ${activeIds.join(', ')}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });
      }

      return NextResponse.json({ message: `Successfully deleted ${activeIds.length} rentals` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk rental action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
