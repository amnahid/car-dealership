import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { canAccessApiPath, canAccessDashboardPath, isPublicApiPath, normalizeRoles } from '@/lib/rbac';

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
  const isProtectedApiPath = pathname.startsWith('/api/') && !isPublicApiPath(pathname);

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
    
    // Extract roles from JWT (could be string or array)
    const rawRoles = payload.roles || payload.role;
    const normalizedRoles = normalizeRoles(rawRoles as string[] | string);

    if (normalizedRoles.length === 0) {
      if (isDashboardPath) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isDashboardPath && !canAccessDashboardPath(normalizedRoles, pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (isProtectedApiPath && !canAccessApiPath(normalizedRoles, pathname, request.method)) {
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
