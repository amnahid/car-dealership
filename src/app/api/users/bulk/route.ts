import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import { normalizeRole, normalizeRoles } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!auth.normalizedRoles.includes('Admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { action, ids, isActive } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    if (action !== 'delete' && action !== 'update-status') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const normalizedIds = [...new Set(ids)]
      .filter((id): id is string => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));
    if (normalizedIds.length === 0) {
      return NextResponse.json({ error: 'No valid user IDs provided' }, { status: 400 });
    }

    if (normalizedIds.includes(auth.userId)) {
      return NextResponse.json({ error: 'Cannot perform bulk actions on your own account' }, { status: 400 });
    }

    const targetUsers = await User.find({ _id: { $in: normalizedIds } }).select('_id role roles isActive');
    if (targetUsers.length === 0) {
      return NextResponse.json({ error: 'No matching users found' }, { status: 404 });
    }

    const activeAdminIds = targetUsers
      .filter((user) => {
          if (!user.isActive) return false;
          const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
          return normalizeRoles(userRoles).includes('Admin');
      })
      .map((user) => user._id.toString());

    if (action === 'delete') {
      if (activeAdminIds.length > 0) {
        const remainingActiveAdminsCount = await User.countDocuments({
          roles: 'Admin',
          isActive: true,
          _id: { $nin: activeAdminIds },
          isDeleted: { $ne: true }
        });
        
        const remainingLegacyAdminsCount = await User.countDocuments({
            role: 'Admin',
            roles: { $size: 0 },
            isActive: true,
            _id: { $nin: activeAdminIds },
            isDeleted: { $ne: true }
        });

        if (remainingActiveAdminsCount + remainingLegacyAdminsCount === 0) {
          return NextResponse.json({ error: 'Cannot deactivate all active admin accounts' }, { status: 400 });
        }
      }

      const result = await User.updateMany({ _id: { $in: normalizedIds } }, { $set: { isActive: false, isDeleted: true } });

      await logActivity({
        userId: auth.userId,
        userName: auth.name,
        action: `Bulk deactivated ${result.modifiedCount} users`,
        module: 'Users',
        details: `IDs: ${normalizedIds.join(', ')}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ message: `Successfully deactivated ${result.modifiedCount} users` });
    }

    if (action === 'update-status') {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
      }

      if (!isActive && activeAdminIds.length > 0) {
        const remainingActiveAdminsCount = await User.countDocuments({
            roles: 'Admin',
            isActive: true,
            _id: { $nin: activeAdminIds },
            isDeleted: { $ne: true }
        });
        
        const remainingLegacyAdminsCount = await User.countDocuments({
            role: 'Admin',
            roles: { $size: 0 },
            isActive: true,
            _id: { $nin: activeAdminIds },
            isDeleted: { $ne: true }
        });

        if (remainingActiveAdminsCount + remainingLegacyAdminsCount === 0) {
          return NextResponse.json({ error: 'Cannot deactivate all active admin accounts' }, { status: 400 });
        }
      }

      const result = await User.updateMany(
        { _id: { $in: normalizedIds } },
        { $set: { isActive } }
      );

      await logActivity({
        userId: auth.userId,
        userName: auth.name,
        action: `Bulk updated status (isActive: ${isActive}) for ${result.modifiedCount} users`,
        module: 'Users',
        details: `IDs: ${normalizedIds.join(', ')}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      });

      return NextResponse.json({ message: `Successfully updated ${result.modifiedCount} users` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk user action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
