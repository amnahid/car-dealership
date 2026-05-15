import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { getLocale } from 'next-intl/server';
import { normalizeRole, normalizeRoles } from '@/lib/rbac';

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

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.userId as string;
    const tokenPasswordVersion = payload.passwordVersion as number | undefined;
    if (!userId) return null;
    if (typeof tokenPasswordVersion !== 'number') return null;

    await connectDB();
    const user = await User.findById(userId).select('-password');
    if (!user) return null;
    if (user.isActive === false) return null;
    if (user.passwordVersion !== tokenPasswordVersion) return null;

    const normalizedRole = normalizeRole(user.role);
    if (!normalizedRole) return null;

    if (user.role !== normalizedRole) {
      await User.updateOne({ _id: user._id }, { $set: { role: normalizedRole } });
    }

    const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    const normalizedRoles = normalizeRoles(userRoles);

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: normalizedRole,
      roles: normalizedRoles,
      avatar: user.avatar,
    };
  } catch {
    return null;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/auth/login');

  const locale = await getLocale();
  const isRtl = locale === 'ar';

  return (
    <div style={{ minHeight: '100vh', background: '#f9fbfd', display: 'flex', flexDirection: 'column' }}>
      <Sidebar userRoles={user.roles} />
      <Header userName={user.name} userRole={user.roles.join(', ')} userEmail={user.email} userAvatar={user.avatar} />
      <main style={{ 
        padding: '24px', 
        marginTop: '70px', 
        marginLeft: isRtl ? 0 : '260px',
        marginRight: isRtl ? '260px' : 0,
        flex: 1
      }}>
        {children}
      </main>
      <footer className="no-print" style={{ 
        textAlign: 'center', 
        padding: '20px', 
        marginLeft: isRtl ? 0 : '260px',
        marginRight: isRtl ? '260px' : 0,
        background: '#ffffff',
        borderTop: '1px solid #e1e5ef',
        color: '#9ca8b3',
        fontSize: '14px'
      }}>
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} AMYAL CAR. All rights reserved.</p>
      </footer>
    </div>
  );
}
