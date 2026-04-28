import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { isRoleAllowed, normalizeRole, type UserRole } from '@/lib/rbac';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return new TextEncoder().encode('fallback-secret-change-in-production');
  }
  return new TextEncoder().encode(secret);
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  normalizedRole: UserRole | null;
  name: string;
  passwordVersion: number;
}

export async function getAuthPayload(request: NextRequest): Promise<AuthPayload | null> {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.userId as string | undefined;
    const passwordVersion = payload.passwordVersion as number | undefined;
    if (!userId || typeof passwordVersion !== 'number') return null;

    await connectDB();
    const user = await User.findById(userId).select('name email role isActive passwordVersion');
    if (!user || user.isActive === false) return null;

    const normalizedRole = normalizeRole(user.role);
    if (!normalizedRole) return null;

    if (user.passwordVersion !== passwordVersion) return null;

    return {
      userId: user._id.toString(),
      email: user.email,
      role: normalizedRole,
      normalizedRole,
      name: user.name,
      passwordVersion: user.passwordVersion,
    };
  } catch {
    return null;
  }
}

export function requireRole(userRole: string, allowedRoles: string[]): boolean {
  return isRoleAllowed(userRole, allowedRoles);
}
