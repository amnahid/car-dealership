import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getAuthPayload } from '@/lib/apiAuth';
import { hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (auth.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (auth.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const user = await User.create({ name, email, password: hashed, role });

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Created user ${name}`,
      module: 'Users',
      targetId: user._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    const { password: _, ...userWithoutPassword } = user.toObject();
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
