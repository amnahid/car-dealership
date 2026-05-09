import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import { getNotificationLogs } from '@/lib/notificationLogger';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.normalizedRoles.some(r => ['Admin', 'Finance Manager', 'Sales Person'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const channel = searchParams.get('channel') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const referenceType = searchParams.get('referenceType') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let end: Date | undefined = undefined;
    if (endDate) {
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    const result = await getNotificationLogs({
      page,
      limit,
      channel: channel || undefined,
      type: type || undefined,
      status: status || undefined,
      referenceType: referenceType || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: end,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get notification logs error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
