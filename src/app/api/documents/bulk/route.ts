import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Document from '@/models/Document';
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
    const { action, ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    if (action === 'delete') {
      const result = await Document.deleteMany({ _id: { $in: ids } });

      await logActivity({
        userId: auth.userId,
        userName: auth.name,
        action: `Bulk deleted ${result.deletedCount} documents`,
        module: 'Documents',
        details: `IDs: ${ids.join(', ')}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ message: `Successfully deleted ${result.deletedCount} documents` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk document action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
