import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export async function getAuthPayload(request: NextRequest): Promise<AuthPayload | null> {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export function requireRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}
