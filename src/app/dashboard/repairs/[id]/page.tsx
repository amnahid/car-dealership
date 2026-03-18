import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Repair {
  _id: string;
  carId: string;
  repairDescription: string;
  partsReplaced: string;
  laborCost: number;
  repairCost: number;
  totalCost: number;
  repairDate: string;
  status: string;
  beforeImages: string[];
  afterImages: string[];
  car?: { carId: string; brand: string; model: string };
}

async function getRepair(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/repairs/${id}`,
    { headers: { Cookie: `auth-token=${token}` }, cache: 'no-store' }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.repair;
}

export default async function RepairDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repair: Repair = await getRepair(id);
  if (!repair) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/repairs" className="text-sm text-indigo-600 hover:underline">← Repairs</Link>
          <h2 className="text-2xl font-bold text-gray-800 mt-1">Repair Details</h2>
          <p className="text-gray-500 font-mono text-sm">{repair.carId}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {[
            ['Status', repair.status],
            ['Repair Date', new Date(repair.repairDate).toLocaleDateString()],
            ['Labor Cost', `$${repair.laborCost?.toLocaleString()}`],
            ['Parts/Repair Cost', `$${repair.repairCost?.toLocaleString()}`],
            ['Total Cost', `$${repair.totalCost?.toLocaleString()}`],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-gray-500 text-xs uppercase tracking-wider">{label}</dt>
              <dd className="font-medium text-gray-800 mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
        <div>
          <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Description</h4>
          <p className="text-sm text-gray-800">{repair.repairDescription}</p>
        </div>
        {repair.partsReplaced && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Parts Replaced</h4>
            <p className="text-sm text-gray-800">{repair.partsReplaced}</p>
          </div>
        )}
        {repair.beforeImages?.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Before Images</h4>
            <div className="flex flex-wrap gap-2">
              {repair.beforeImages.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img} alt={`Before ${i + 1}`} className="w-24 h-24 object-cover rounded" />
              ))}
            </div>
          </div>
        )}
        {repair.afterImages?.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">After Images</h4>
            <div className="flex flex-wrap gap-2">
              {repair.afterImages.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img} alt={`After ${i + 1}`} className="w-24 h-24 object-cover rounded" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
