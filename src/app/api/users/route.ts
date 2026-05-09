import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getAuthPayload } from '@/lib/apiAuth';
import { hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';
import { sendUserCredentialsEmail, generateStrongPassword } from '@/lib/userCredentialsEmail';
import { ROLE_OPTIONS, isAssignableRole, normalizeRoles } from '@/lib/rbac';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!auth.normalizedRoles.includes('Admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const users = await User.find({ isDeleted: { $ne: true } }).select('-password').sort({ createdAt: -1 });
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
    if (!auth.normalizedRoles.includes('Admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : undefined;
    
    // Support both single role (legacy) and multiple roles
    let rolesInput: string[] = [];
    if (Array.isArray(body.roles)) {
      rolesInput = body.roles;
    } else if (typeof body.role === 'string' && body.role) {
      rolesInput = [body.role];
    }

    if (!name || !email || rolesInput.length === 0) {
      return NextResponse.json({ error: 'Name, email, and at least one role are required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate all roles
    for (const r of rolesInput) {
      if (!isAssignableRole(r)) {
        return NextResponse.json({ error: `Invalid role: ${r}` }, { status: 400 });
      }
    }

    const normalizedRoles = normalizeRoles(rolesInput);

    if (password !== undefined && password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const finalPassword = password || generateStrongPassword(12);
    const hashed = await hashPassword(finalPassword);
    const user = await User.create({ 
      name, 
      email, 
      password: hashed, 
      role: normalizedRoles[0], // primary role for legacy support
      roles: normalizedRoles 
    });

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Created user ${name} with roles: ${normalizedRoles.join(', ')}`,
      module: 'Users',
      targetId: user._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    sendUserCredentialsEmail({ name, email, role: normalizedRoles.join(', ') }, finalPassword).catch((err) => {
      console.error('Failed to send credentials email:', err);
    });

    const userWithoutPassword = user.toObject() as any;
    delete userWithoutPassword.password;
    return NextResponse.json({
      user: userWithoutPassword,
      generatedPassword: password ? undefined : finalPassword,
      emailSent: true,
      message: password
        ? 'User created successfully'
        : 'User created and credentials sent via email',
      allowedRoles: ROLE_OPTIONS,
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
