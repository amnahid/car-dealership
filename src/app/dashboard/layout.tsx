import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/me`, {
      headers: { Cookie: `auth-token=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

async function getExpiringDocsCount() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return 0;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/documents/expiring`,
      { headers: { Cookie: `auth-token=${token}` }, cache: 'no-store' }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return data.documents?.length || 0;
  } catch {
    return 0;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/auth/login');

  const expiringDocsCount = await getExpiringDocsCount();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole={user.role} />
      <div className="flex-1 flex flex-col">
        <Header userName={user.name} userRole={user.role} expiringDocsCount={expiringDocsCount} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
