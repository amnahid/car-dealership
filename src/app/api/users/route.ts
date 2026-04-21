import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getAuthPayload } from '@/lib/apiAuth';
import { hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';
import { sendUserCredentialsEmail, generateStrongPassword } from '@/lib/userCredentialsEmail';

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

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
    }

    const validRoles = ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const finalPassword = password || generateStrongPassword(12);
    const hashed = await hashPassword(finalPassword);
    const user = await User.create({ name, email, password: hashed, role });

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Created user ${name}`,
      module: 'Users',
      targetId: user._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    sendUserCredentialsEmail({ name, email, role }, finalPassword).catch((err) => {
      console.error('Failed to send credentials email:', err);
    });

    const { password: _, ...userWithoutPassword } = user.toObject();
    return NextResponse.json({
      user: userWithoutPassword,
      generatedPassword: password ? undefined : finalPassword,
      emailSent: true,
      message: password
        ? 'User created successfully'
        : 'User created and credentials sent via email',
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
