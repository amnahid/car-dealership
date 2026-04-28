import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getAuthPayload } from '@/lib/apiAuth';
import { hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';
import { sendUserCredentialsEmail, generateStrongPassword } from '@/lib/userCredentialsEmail';
import { isAssignableRole, normalizeRole } from '@/lib/rbac';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (auth.normalizedRole !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
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
    if (auth.normalizedRole !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    const body = await request.json();

    if (body.role !== undefined && !isAssignableRole(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (body.password !== undefined) {
      return NextResponse.json(
        { error: 'Password updates are not allowed in this endpoint. Use reset password action.' },
        { status: 400 }
      );
    }

    const existingUser = await User.findById(id).select('isActive role');
    if (!existingUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (id === auth.userId) {
      if (body.role !== undefined && body.role !== existingUser.role) {
        return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
      }
      if (body.isActive === false) {
        return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
      }
    }

    const updatePayload: Record<string, unknown> = {};
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 });
      }
      updatePayload.name = body.name.trim();
    }
    if (body.email !== undefined) {
      const normalizedEmail = String(body.email).trim().toLowerCase();
      if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      updatePayload.email = normalizedEmail;
    }
    if (body.role !== undefined) updatePayload.role = body.role;
    if (body.phone !== undefined) updatePayload.phone = body.phone;
    if (body.avatar !== undefined) updatePayload.avatar = body.avatar;
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
      }
      updatePayload.isActive = body.isActive;
    }

    const currentNormalizedRole = normalizeRole(existingUser.role);
    const nextRole = body.role ?? existingUser.role;
    const nextNormalizedRole = normalizeRole(nextRole);
    const nextIsActive = body.isActive ?? existingUser.isActive;
    const removingLastAdmin =
      currentNormalizedRole === 'Admin' &&
      existingUser.isActive &&
      (nextNormalizedRole !== 'Admin' || nextIsActive === false);

    if (removingLastAdmin) {
      const remainingActiveAdmins = await User.countDocuments({
        _id: { $ne: id },
        role: 'Admin',
        isActive: true,
      });
      if (remainingActiveAdmins === 0) {
        return NextResponse.json({ error: 'Cannot modify the last active admin account' }, { status: 400 });
      }
    }

    const user = await User.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true }).select('-password');
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
    if (auth.normalizedRole !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (id === auth.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const existingUser = await User.findById(id).select('role isActive');
    if (!existingUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (normalizeRole(existingUser.role) === 'Admin' && existingUser.isActive) {
      const remainingActiveAdmins = await User.countDocuments({
        _id: { $ne: id },
        role: 'Admin',
        isActive: true,
      });
      if (remainingActiveAdmins === 0) {
        return NextResponse.json({ error: 'Cannot deactivate the last active admin account' }, { status: 400 });
      }
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (auth.normalizedRole !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action !== 'reset-password') {
      return NextResponse.json({ error: 'Invalid action. Use ?action=reset-password' }, { status: 400 });
    }

    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const newPassword = generateStrongPassword(12);
    user.password = await hashPassword(newPassword);
    user.passwordVersion = (user.passwordVersion ?? 1) + 1;
    await user.save();

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Reset password for user ${user.name}`,
      module: 'Users',
      targetId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    sendUserCredentialsEmail({ name: user.name, email: user.email, role: user.role }, newPassword).catch((err) => {
      console.error('Failed to send reset password email:', err);
    });

    return NextResponse.json({
      message: 'Password reset and sent via email',
      emailSent: true,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
