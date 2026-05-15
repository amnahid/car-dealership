import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getAuthPayload } from '@/lib/apiAuth';
import { hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';
import { sendUserCredentialsEmail, generateStrongPassword } from '@/lib/userCredentialsEmail';
import { isAssignableRole, normalizeRole, normalizeRoles } from '@/lib/rbac';

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
    if (!auth.normalizedRoles.includes('Admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
    if (!auth.normalizedRoles.includes('Admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    const body = await request.json();

    // Support both single role (legacy) and multiple roles in update
    let rolesInput: string[] | undefined = undefined;
    if (Array.isArray(body.roles)) {
      rolesInput = body.roles;
    } else if (typeof body.role === 'string' && body.role) {
      rolesInput = [body.role];
    }

    if (rolesInput !== undefined) {
      if (rolesInput.length === 0) {
        return NextResponse.json({ error: 'At least one role is required' }, { status: 400 });
      }
      for (const r of rolesInput) {
        if (!isAssignableRole(r)) {
          return NextResponse.json({ error: `Invalid role: ${r}` }, { status: 400 });
        }
      }
    }

    if (body.password !== undefined) {
      return NextResponse.json(
        { error: 'Password updates are not allowed in this endpoint. Use reset password action.' },
        { status: 400 }
      );
    }

    const existingUser = await User.findById(id).select('isActive role roles');
    if (!existingUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (id === auth.userId) {
      if (rolesInput !== undefined) {
        const nextNormalizedRoles = normalizeRoles(rolesInput);
        const currentNormalizedRoles = normalizeRoles(existingUser.roles && existingUser.roles.length > 0 ? existingUser.roles : [existingUser.role]);
        
        // Basic check: if they are still an Admin in the new list, it's fine. 
        // But for safety, we prevent users from changing their own roles entirely via this UI to avoid self-lockout.
        if (JSON.stringify(nextNormalizedRoles.sort()) !== JSON.stringify(currentNormalizedRoles.sort())) {
            return NextResponse.json({ error: 'Cannot change your own roles' }, { status: 400 });
        }
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
    
    if (rolesInput !== undefined) {
        const normalized = normalizeRoles(rolesInput);
        updatePayload.roles = normalized;
        updatePayload.role = normalized[0]; // sync legacy field
    }

    if (body.phone !== undefined) updatePayload.phone = body.phone;
    if (body.avatar !== undefined) updatePayload.avatar = body.avatar;
    if (body.passportNumber !== undefined) updatePayload.passportNumber = body.passportNumber;
    if (body.passportDocument !== undefined) updatePayload.passportDocument = body.passportDocument;
    if (body.passportExpiryDate !== undefined) updatePayload.passportExpiryDate = body.passportExpiryDate;
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
      }
      updatePayload.isActive = body.isActive;
    }

    // Safety check for last admin
    const currentRoles = existingUser.roles && existingUser.roles.length > 0 ? existingUser.roles : [existingUser.role];
    const currentNormalizedRoles = normalizeRoles(currentRoles);
    
    const nextRoles = rolesInput ?? currentRoles;
    const nextNormalizedRoles = normalizeRoles(nextRoles);
    
    const nextIsActive = body.isActive ?? existingUser.isActive;
    
    const wasAdmin = currentNormalizedRoles.includes('Admin');
    const willBeAdmin = nextNormalizedRoles.includes('Admin');

    if (wasAdmin && existingUser.isActive && (!willBeAdmin || nextIsActive === false)) {
      const remainingActiveAdmins = await User.countDocuments({
        _id: { $ne: id },
        roles: 'Admin', // In multi-role, we check if 'Admin' is in roles array
        isActive: true,
        isDeleted: { $ne: true }
      });
      
      // Fallback for legacy data not yet migrated
      const remainingLegacyAdmins = await User.countDocuments({
          _id: { $ne: id },
          role: 'Admin',
          roles: { $size: 0 },
          isActive: true,
          isDeleted: { $ne: true }
      });

      if (remainingActiveAdmins + remainingLegacyAdmins === 0) {
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
    if (!auth.normalizedRoles.includes('Admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (id === auth.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const existingUser = await User.findById(id).select('role roles isActive');
    if (!existingUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const currentRoles = existingUser.roles && existingUser.roles.length > 0 ? existingUser.roles : [existingUser.role];
    const currentNormalizedRoles = normalizeRoles(currentRoles);

    if (currentNormalizedRoles.includes('Admin') && existingUser.isActive) {
      const remainingActiveAdmins = await User.countDocuments({
        _id: { $ne: id },
        roles: 'Admin',
        isActive: true,
        isDeleted: { $ne: true },
      });
      
      const remainingLegacyAdmins = await User.countDocuments({
          _id: { $ne: id },
          role: 'Admin',
          roles: { $size: 0 },
          isActive: true,
          isDeleted: { $ne: true }
      });

      if (remainingActiveAdmins + remainingLegacyAdmins === 0) {
        return NextResponse.json({ error: 'Cannot deactivate the last active admin account' }, { status: 400 });
      }
    }

    const user = await User.findByIdAndUpdate(id, { isDeleted: true, isActive: false }, { new: true });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await logActivity({
      userId: auth.userId,
      userName: auth.name,
      action: `Deleted user ${user.name}`,
      module: 'Users',
      targetId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ message: 'User deleted successfully' });
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
    if (!auth.normalizedRoles.includes('Admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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

    const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    sendUserCredentialsEmail({ name: user.name, email: user.email, role: userRoles.join(', ') }, newPassword).catch((err) => {
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
