import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Repair from '@/models/Repair';
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
      const result = await Repair.deleteMany({ _id: { $in: ids } });

      await logActivity({
        userId: auth.userId,
        userName: auth.name,
        action: `Bulk deleted ${result.deletedCount} repairs`,
        module: 'Repairs',
        details: `IDs: ${ids.join(', ')}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ message: `Successfully deleted ${result.deletedCount} repairs` });
    }

    if (action === 'update-status') {
      if (!status) {
        return NextResponse.json({ error: 'No status provided' }, { status: 400 });
      }

      const result = await Repair.updateMany(
        { _id: { $in: ids } },
        { $set: { status } }
      );

      await logActivity({
        userId: auth.userId,
        userName: auth.name,
        action: `Bulk updated status to ${status} for ${result.modifiedCount} repairs`,
        module: 'Repairs',
        details: `IDs: ${ids.join(', ')}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ message: `Successfully updated ${result.modifiedCount} repairs` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk repair action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
