import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { CarStatus } from '@/types';

interface Repair {
  _id: string;
  repairDescription: string;
  totalCost: number;
  repairDate: string;
  status: string;
}

interface Doc {
  _id: string;
  documentType: string;
  expiryDate: string;
  fileName: string;
}

interface Car {
  _id: string;
  carId: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  status: CarStatus;
  purchasePrice: number;
  purchaseDate: string;
  supplierName: string;
  supplierContact: string;
  engineNumber: string;
  chassisNumber: string;
  notes: string;
  totalRepairCost: number;
  images: string[];
}

async function getCarDetail(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cars/${id}`,
    { headers: { Cookie: `auth-token=${token}` }, cache: 'no-store' }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCarDetail(id);
  if (!data) notFound();

  const { car, repairs, documents }: { car: Car; repairs: Repair[]; documents: Doc[] } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/cars" className="text-sm text-indigo-600 hover:underline">← Cars</Link>
          <h2 className="text-2xl font-bold text-gray-800 mt-1">{car.brand} {car.model} ({car.year})</h2>
          <p className="text-gray-500 font-mono text-sm">{car.carId}</p>
        </div>
        <div className="flex gap-3 items-center">
          <StatusBadge status={car.status} />
          <Link href={`/dashboard/cars/${car._id}/edit`} className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-indigo-500">
            Edit Car
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Vehicle Details</h3>
          <dl className="space-y-3 text-sm">
            {[
              ['Chassis Number', car.chassisNumber],
              ['Engine Number', car.engineNumber],
              ['Color', car.color],
              ['Purchase Date', new Date(car.purchaseDate).toLocaleDateString()],
              ['Purchase Price', `$${car.purchasePrice?.toLocaleString()}`],
              ['Total Repair Cost', `$${car.totalRepairCost?.toLocaleString()}`],
              ['Supplier', car.supplierName],
              ['Supplier Contact', car.supplierContact],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-800">{value || '-'}</dd>
              </div>
            ))}
          </dl>
        </div>

        {car.images?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Images</h3>
            <div className="grid grid-cols-3 gap-2">
              {car.images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img} alt={`Car ${i + 1}`} className="w-full h-24 object-cover rounded" />
              ))}
            </div>
          </div>
        )}
      </div>

      {car.notes && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
          <p className="text-sm text-gray-600">{car.notes}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Repair History</h3>
          <Link href={`/dashboard/repairs/new?carId=${car._id}`} className="text-sm text-indigo-600 hover:underline">+ Add Repair</Link>
        </div>
        {repairs.length === 0 ? (
          <p className="text-sm text-gray-500">No repairs recorded.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr>
              {['Description', 'Cost', 'Date', 'Status'].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {repairs.map((r) => (
                <tr key={r._id}>
                  <td className="px-3 py-2">{r.repairDescription}</td>
                  <td className="px-3 py-2">${r.totalCost?.toLocaleString()}</td>
                  <td className="px-3 py-2">{new Date(r.repairDate).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Documents</h3>
          <Link href={`/dashboard/documents/new?carId=${car._id}`} className="text-sm text-indigo-600 hover:underline">+ Add Document</Link>
        </div>
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500">No documents recorded.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr>
              {['Type', 'Expiry Date', 'File'].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {documents.map((d) => (
                <tr key={d._id}>
                  <td className="px-3 py-2">{d.documentType}</td>
                  <td className="px-3 py-2">
                    {new Date(d.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{d.fileName || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
