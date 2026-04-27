import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { canAccessApiPath, canAccessDashboardPath, normalizeRole } from '@/lib/rbac';

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;
  const isDashboardPath = pathname.startsWith('/dashboard');
  const isProtectedApiPath = pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/');

  if (!isDashboardPath && !isProtectedApiPath) {
    return NextResponse.next();
  }

  if (!token) {
    if (isDashboardPath) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const normalizedRole = normalizeRole(payload.role as string | undefined);

    if (!normalizedRole) {
      if (isDashboardPath) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isDashboardPath && !canAccessDashboardPath(normalizedRole, pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (isProtectedApiPath && !canAccessApiPath(normalizedRole, pathname, request.method)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.next();
  } catch {
    if (isDashboardPath) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
