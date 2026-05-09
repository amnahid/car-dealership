import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Car from '@/models/Car';
import CarPurchase from '@/models/CarPurchase';
import Transaction from '@/models/Transaction';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!auth.normalizedRoles.some(r => ['Admin', 'Car Manager'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { action, ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    if (action === 'delete') {
      const carsToUpdate = await Car.find({ _id: { $in: ids } });
      const carIds = carsToUpdate.map(c => c.carId);

      // Soft delete related transactions
      if (carIds.length > 0) {
        await Transaction.updateMany(
          { referenceId: { $in: carIds }, referenceType: 'CarPurchase' },
          { $set: { isDeleted: true } }
        );
      }

      // Soft delete cars
      const result = await Car.updateMany(
        { _id: { $in: ids } },
        { $set: { isDeleted: true } }
      );

      await logActivity({
        userId: auth.userId,
        userName: auth.name,
        action: `Bulk deleted ${result.modifiedCount} cars`,
        module: 'Cars',
        details: `IDs: ${ids.join(', ')}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ message: `Successfully deleted ${result.modifiedCount} cars` });
    }

    if (action === 'update-status') {
      if (!status) {
        return NextResponse.json({ error: 'No status provided' }, { status: 400 });
      }

      const result = await Car.updateMany(
        { _id: { $in: ids } },
        { $set: { status } }
      );

      await logActivity({
        userId: auth.userId,
        userName: auth.name,
        action: `Bulk updated status to ${status} for ${result.modifiedCount} cars`,
        module: 'Cars',
        details: `IDs: ${ids.join(', ')}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ message: `Successfully updated ${result.modifiedCount} cars` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk car action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
