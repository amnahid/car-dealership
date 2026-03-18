import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

function getSecret() {
  return new TextEncoder().encode(JWT_SECRET);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    try {
      await jwtVerify(token, getSecret());
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Protect API routes (except /api/auth/* and /api/seed)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') && pathname !== '/api/seed') {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      await jwtVerify(token, getSecret());
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
