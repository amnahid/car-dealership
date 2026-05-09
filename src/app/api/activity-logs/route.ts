import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!auth.normalizedRoles.some(r => ['Admin', 'Finance Manager'].includes(r))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email');

    return NextResponse.json({
      logs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
