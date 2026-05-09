import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import EditRequest from '@/models/EditRequest';
import User from '@/models/User';
import { getAuthPayload } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user || !user.normalizedRoles.includes('Admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'Pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = { status };
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      EditRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('requestedBy', 'name email')
        .lean(),
      EditRequest.countDocuments(query),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get edit requests error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
