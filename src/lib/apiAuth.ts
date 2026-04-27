import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
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
    const role = payload.role as string;

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role,
      normalizedRole: normalizeRole(role),
      name: payload.name as string,
      passwordVersion: payload.passwordVersion as number,
    };
  } catch {
    return null;
  }
}

export function requireRole(userRole: string, allowedRoles: string[]): boolean {
  return isRoleAllowed(userRole, allowedRoles);
}
