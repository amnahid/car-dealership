import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getAuthPayload } from '@/lib/apiAuth';
import { hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (auth.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    const user = await User.findById(id).select('-password');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (auth.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (body.password) {
      body.password = await hashPassword(body.password);
    } else {
      delete body.password;
    }

    const user = await User.findByIdAndUpdate(id, body, { new: true, runValidators: true }).select(
      '-password'
    );
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Updated user ${user.name}`,
      module: 'Users',
      targetId: user._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (auth.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;

    // Prevent deleting self
    if (id === auth.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Deactivated user ${user.name}`,
      module: 'Users',
      targetId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
