import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface VehicleDoc {
  _id: string;
  carId: string;
  documentType: string;
  issueDate: string;
  expiryDate: string;
  fileName: string;
  notes: string;
  alertSent30: boolean;
  alertSent15: boolean;
  alertSent7: boolean;
}

async function getDocument(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/documents/${id}`,
    { headers: { Cookie: `auth-token=${token}` }, cache: 'no-store' }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.document;
}

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc: VehicleDoc = await getDocument(id);
  if (!doc) notFound();

  const daysLeft = Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / 86400000);

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link href="/dashboard/documents" className="text-sm text-indigo-600 hover:underline">← Documents</Link>
        <h2 className="text-2xl font-bold text-gray-800 mt-1">{doc.documentType}</h2>
        <p className="text-gray-500 font-mono text-sm">{doc.carId}</p>
      </div>

      {daysLeft <= 30 && daysLeft >= 0 && (
        <div className={`rounded-md border p-3 ${daysLeft <= 7 ? 'bg-red-50 border-red-200 text-red-800' : daysLeft <= 15 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
          <span style={{ display: 'inline-block', width: '14px', height: '14px', marginRight: '4px', borderRadius: '50%', background: '#f8b425', verticalAlign: 'middle' }}></span>This document expires in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>.
        </div>
      )}
      {daysLeft < 0 && (
        <div className="rounded-md border bg-red-50 border-red-200 text-red-800 p-3">
          <span style={{ display: 'inline-block', width: '14px', height: '14px', marginRight: '4px', borderRadius: '50%', background: '#ec4561', verticalAlign: 'middle' }}></span>This document has <strong>expired</strong>.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <dl className="space-y-3 text-sm">
          {[
            ['Issue Date', new Date(doc.issueDate).toLocaleDateString()],
            ['Expiry Date', new Date(doc.expiryDate).toLocaleDateString()],
            ['File', doc.fileName || '-'],
            ['Notes', doc.notes || '-'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-gray-500">{label}</dt>
              <dd className="font-medium text-gray-800">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
