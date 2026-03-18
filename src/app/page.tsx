import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'fallback-secret-change-in-production'
      );
      await jwtVerify(token, secret);
      redirect('/dashboard');
    } catch {
      redirect('/auth/login');
    }
  } else {
    redirect('/auth/login');
  }
}
