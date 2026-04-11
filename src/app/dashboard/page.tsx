import { cookies } from 'next/headers';
import Link from 'next/link';

interface StatsData {
  totalCars: number;
  carsInStock: number;
  carsUnderRepair: number;
  carsSold: number;
  carsRented: number;
  carsReserved: number;
  totalRepairCost: number;
  expiringDocuments: number;
  recentActivity: Array<{
    _id: string;
    action: string;
    module: string;
    userName: string;
    createdAt: string;
  }>;
}

async function getStats(): Promise<StatsData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/stats`,
      { headers: { Cookie: `auth-token=${token}` }, cache: 'no-store' }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const statColors: Record<string, { background: string; border: string; color: string }> = {
  primary: { background: '#28aaa9', border: '#28aaa9', color: '#ffffff' },
  secondary: { background: '#2b2d5d', border: '#2b2d5d', color: '#ffffff' },
  success: { background: '#42ca7f', border: '#42ca7f', color: '#ffffff' },
  warning: { background: '#f8b425', border: '#f8b425', color: '#ffffff' },
  danger: { background: '#ec4561', border: '#ec4561', color: '#ffffff' },
  info: { background: '#38a4f8', border: '#38a4f8', color: '#ffffff' },
};

function StatCard({
  label,
  value,
  colorKey,
  href,
}: {
  label: string;
  value: number | string;
  colorKey: string;
  href?: string;
}) {
  const colors = statColors[colorKey] || statColors.primary;

  const cardStyle: React.CSSProperties = {
    padding: '30px',
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    textAlign: 'center',
    boxShadow: '0px 0px 13px 0px rgba(236,236,241,0.44)',
    marginBottom: '24px',
    color: colors.color,
    textDecoration: 'none',
    display: 'block',
    transition: 'all 0.3s ease',
  };

  const card = (
    <div style={cardStyle}>
      <p style={{ fontSize: '14px', fontWeight: 500, opacity: 0.9, margin: 0 }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px' }}>{value}</p>
    </div>
  );

  return href ? (
    <Link href={href} style={{ textDecoration: 'none' }}>
      {card}
    </Link>
  ) : card;
}

export default async function DashboardPage() {
  const stats = await getStats();

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9ca8b3' }}>
        Failed to load dashboard data. Make sure the database is connected.
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 className="page-title" style={{ marginBottom: '24px' }}>Dashboard Overview</h2>

      {stats.expiringDocuments > 0 && (
        <div
          style={{
            background: '#fff3cd',
            border: '1px solid #f8b425',
            borderRadius: '3px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#856404', margin: 0 }}>
            <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', background: '#ffc107', marginRight: '6px' }}></span>
            {stats.expiringDocuments} document{stats.expiringDocuments !== 1 ? 's' : ''} expiring
            within 30 days.{' '}
            <Link
              href="/dashboard/documents"
              style={{ color: '#28aaa9', fontWeight: 600, textDecoration: 'underline' }}
            >
              View Documents
            </Link>
          </p>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          label="Total Cars"
          value={stats.totalCars}
          colorKey="primary"
          href="/dashboard/cars"
        />
        <StatCard
          label="In Stock"
          value={stats.carsInStock}
          colorKey="success"
          href="/dashboard/cars?status=In+Stock"
        />
        <StatCard
          label="Under Repair"
          value={stats.carsUnderRepair}
          colorKey="warning"
          href="/dashboard/cars?status=Under+Repair"
        />
        <StatCard label="Sold" value={stats.carsSold} colorKey="secondary" href="/dashboard/cars?status=Sold" />
        <StatCard label="Rented" value={stats.carsRented} colorKey="info" href="/dashboard/cars?status=Rented" />
        <StatCard
          label="Reserved"
          value={stats.carsReserved}
          colorKey="info"
          href="/dashboard/cars?status=Reserved"
        />
        <StatCard
          label="Total Repair Cost"
          value={`$${stats.totalRepairCost.toLocaleString()}`}
          colorKey="danger"
        />
        <StatCard
          label="Expiring Docs (30d)"
          value={stats.expiringDocuments}
          colorKey={stats.expiringDocuments > 0 ? 'danger' : 'success'}
          href="/dashboard/documents"
        />
      </div>

      <div
        className="card"
        style={{
          padding: '24px',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#2a3142',
            marginBottom: '16px',
            fontFamily: '"Sarabun", sans-serif',
          }}
        >
          Recent Activity
        </h3>
        {stats.recentActivity.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#9ca8b3' }}>No activity yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {stats.recentActivity.map((log) => (
              <li
                key={log._id}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#28aaa9',
                    marginTop: '6px',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', color: '#2a3142', margin: 0 }}>{log.action}</p>
                  <p style={{ fontSize: '12px', color: '#9ca8b3', marginTop: '4px' }}>
                    {log.userName} · {log.module} · {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}