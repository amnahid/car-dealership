import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { getLocale } from 'next-intl/server';
import { normalizeRole } from '@/lib/rbac';

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
    if (!userId) return null;

    await connectDB();
    const user = await User.findById(userId).select('-password');
    if (!user) return null;

    const normalizedRole = normalizeRole(user.role);
    if (!normalizedRole) return null;

    if (user.role !== normalizedRole) {
      user.role = normalizedRole;
      await user.save();
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: normalizedRole,
      avatar: user.avatar,
    };
  } catch {
    return null;
  }
}

async function getExpiringDocsCount() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return 0;

  try {
    await connectDB();
    const Document = (await import('@/models/Document')).default as typeof import('@/models/Document').default;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const count = await Document.countDocuments({
      expiryDate: { $gte: now, $lte: thirtyDaysFromNow },
    });
    return count;
  } catch {
    return 0;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/auth/login');

  const expiringDocsCount = await getExpiringDocsCount();
  const locale = await getLocale();
  const isRtl = locale === 'ar';

  return (
    <div style={{ minHeight: '100vh', background: '#f9fbfd' }}>
      <Sidebar userRole={user.role} />
      <Header userName={user.name} userRole={user.role} expiringDocsCount={expiringDocsCount} userEmail={user.email} userAvatar={user.avatar} />
      <main style={{ 
        padding: '24px', 
        marginTop: '70px', 
        marginBottom: '60px', 
        marginLeft: isRtl ? 0 : '260px',
        marginRight: isRtl ? '260px' : 0
      }}>
        {children}
      </main>
      <footer style={{ 
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
