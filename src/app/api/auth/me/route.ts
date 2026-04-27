import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import User from '@/models/User';
import { getAuthPayload } from '@/lib/apiAuth';
import { normalizeRole } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuthPayload(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const normalizedRole = normalizeRole(user.role);
    if (!normalizedRole) {
      return NextResponse.json({ error: 'Invalid role configuration' }, { status: 403 });
    }

    if (user.role !== normalizedRole) {
      user.role = normalizedRole;
      await user.save();
    }

    return NextResponse.json({
      user: {
        ...user.toObject(),
        role: normalizedRole,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
