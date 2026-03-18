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

function StatCard({
  label,
  value,
  color,
  href,
}: {
  label: string;
  value: number | string;
  color: string;
  href?: string;
}) {
  const card = (
    <div className={`rounded-xl p-5 ${color} text-white shadow-sm`}>
      <p className="text-sm font-medium opacity-90">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default async function DashboardPage() {
  const stats = await getStats();

  if (!stats) {
    return (
      <div className="text-center py-20 text-gray-500">
        Failed to load dashboard data. Make sure the database is connected.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>

      {stats.expiringDocuments > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-orange-800 font-medium">
            ⚠️ {stats.expiringDocuments} document{stats.expiringDocuments !== 1 ? 's' : ''} expiring
            within 30 days.{' '}
            <Link href="/dashboard/documents" className="underline font-semibold">
              View Documents
            </Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Total Cars" value={stats.totalCars} color="bg-indigo-600" href="/dashboard/cars" />
        <StatCard label="In Stock" value={stats.carsInStock} color="bg-green-600" href="/dashboard/cars?status=In+Stock" />
        <StatCard label="Under Repair" value={stats.carsUnderRepair} color="bg-yellow-500" href="/dashboard/cars?status=Under+Repair" />
        <StatCard label="Sold" value={stats.carsSold} color="bg-gray-500" href="/dashboard/cars?status=Sold" />
        <StatCard label="Rented" value={stats.carsRented} color="bg-purple-600" href="/dashboard/cars?status=Rented" />
        <StatCard label="Reserved" value={stats.carsReserved} color="bg-blue-600" href="/dashboard/cars?status=Reserved" />
        <StatCard
          label="Total Repair Cost"
          value={`$${stats.totalRepairCost.toLocaleString()}`}
          color="bg-red-500"
        />
        <StatCard
          label="Expiring Docs (30d)"
          value={stats.expiringDocuments}
          color={stats.expiringDocuments > 0 ? 'bg-orange-500' : 'bg-teal-600'}
          href="/dashboard/documents"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        {stats.recentActivity.length === 0 ? (
          <p className="text-gray-400 text-sm">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {stats.recentActivity.map((log) => (
              <li key={log._id} className="py-3 flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-indigo-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{log.action}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {log.userName} · {log.module} ·{' '}
                    {new Date(log.createdAt).toLocaleString()}
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
