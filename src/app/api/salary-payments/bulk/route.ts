import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SalaryPayment from '@/models/SalaryPayment';
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
      const payments = await SalaryPayment.find({ _id: { $in: ids }, status: 'Active' });
      const activeIds = payments.map(p => p._id);
      const paymentIds = payments.map(p => p.paymentId);

      if (activeIds.length > 0) {
        // Update status to Cancelled
        await SalaryPayment.updateMany(
          { _id: { $in: activeIds } },
          { $set: { status: 'Cancelled' } }
        );

        // Delete associated transactions
        await Transaction.deleteMany({
          referenceId: { $in: paymentIds },
          referenceType: 'SalaryPayment'
        });

        await logActivity({
          userId: auth.userId,
          userName: auth.name,
          action: `Bulk cancelled ${activeIds.length} salary payments`,
          module: 'HRM',
          details: `IDs: ${activeIds.join(', ')}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        });
      }

      return NextResponse.json({ 
        message: `Successfully cancelled ${activeIds.length} payments.`,
        cancelledCount: activeIds.length
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk salary payment action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
