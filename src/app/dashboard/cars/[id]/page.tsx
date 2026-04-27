'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import GpsMap from '@/components/GpsMap';
import { CarStatus } from '@/types';
import { useTranslations, useLocale } from 'next-intl';

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

interface Purchase {
  supplier?: string;
  supplierName: string;
  supplierContact: string;
  purchasePrice: number;
  purchaseDate: string;
  isNewCar?: boolean;
  conditionImages?: string[];
  insuranceUrl?: string;
  insuranceExpiry?: string;
  registrationUrl?: string;
  registrationExpiry?: string;
  roadPermitUrl?: string;
  roadPermitExpiry?: string;
  documentUrl?: string;
  notes?: string;
}

interface Car {
  _id: string;
  carId: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  status: CarStatus;
  engineNumber: string;
  chassisNumber: string;
  notes: string;
  totalRepairCost: number;
  images: string[];
  purchase?: Purchase;
}

export default function CarDetailPage() {
  const t = useTranslations('CarDetail');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const params = useParams();
  const id = params.id as string;

  const router = useRouter();
  const [data, setData] = useState<{ car: Car; repairs: Repair[]; documents: Doc[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/cars/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(commonT('deleteConfirm'))) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/cars/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard/cars');
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete car');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>;
  if (!data) notFound();

  const { car, repairs, documents } = data;

  const formatCurrency = (val: number | undefined | null) => `SAR ${(val || 0).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}`;

  return (
    <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/cars" className="text-sm text-indigo-600 hover:underline">{isRtl ? '←' : '←'} {t('back')}</Link>
          <h2 className="text-2xl font-bold text-gray-800 mt-1">{car.brand} {car.model} ({car.year})</h2>
          <p className="text-gray-500 font-mono text-sm">{car.carId}</p>
        </div>
        <div className={`flex gap-3 items-center ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
          <StatusBadge status={car.status} />
          <Link href={`/dashboard/cars/${car._id}/edit`} className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-indigo-500">
            {commonT('edit')}
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-100 text-red-600 text-sm font-semibold px-4 py-2 rounded-md hover:bg-red-200 disabled:opacity-50"
          >
            {deleting ? commonT('loading') : commonT('delete')}
          </button>
        </div>
      </div>

      {car.purchase && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 className="font-semibold text-gray-800 mb-4">{t('purchaseInfo')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">{t('supplier')}</div>
              <div className="font-medium text-gray-800">
                {car.purchase.supplier ? (
                  <Link href={`/dashboard/cars/suppliers/${car.purchase.supplier}`} className="text-indigo-600 hover:underline">
                    {car.purchase.supplierName}
                  </Link>
                ) : car.purchase.supplierName || '-'}
              </div>
            </div>
            <div>
              <div className="text-gray-500">{t('supplierContact')}</div>
              <div className="font-medium text-gray-800">{car.purchase.supplierContact || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">{t('purchasePrice')}</div>
              <div className="font-medium text-gray-800">{formatCurrency(car.purchase.purchasePrice || 0)}</div>
            </div>
            <div>
              <div className="text-gray-500">{t('purchaseDate')}</div>
              <div className="font-medium text-gray-800">
                {car.purchase.purchaseDate ? new Date(car.purchase.purchaseDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US') : '-'}
              </div>
            </div>
            {car.purchase.isNewCar !== undefined && (
              <div>
                <div className="text-gray-500">{t('carCondition')}</div>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    car.purchase.isNewCar ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {car.purchase.isNewCar ? t('new') : t('used')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {car.purchase.conditionImages && car.purchase.conditionImages.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">{t('conditionImages')}</h4>
              <div className="grid grid-cols-4 gap-2">
                {car.purchase.conditionImages.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img} alt={`Condition ${i + 1}`} className="w-full h-20 object-cover rounded" />
                ))}
              </div>
            </div>
          )}

          <h4 className="font-semibold text-gray-800 mt-6 mb-4 pt-4 border-t border-gray-100">{t('vehicleDocs')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            {car.purchase.insuranceUrl && (
              <div>
                <div className="text-gray-500">{commonT('insurance')}</div>
                <div className="font-medium mt-1">
                  <a href={car.purchase.insuranceUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    {t('viewDoc')}
                  </a>
                  {car.purchase.insuranceExpiry && (
                    <span className={`text-gray-500 ${isRtl ? 'mr-2' : 'ml-2'}`}>
                      ({t('exp')}: {new Date(car.purchase.insuranceExpiry).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')})
                    </span>
                  )}
                </div>
              </div>
            )}
            {car.purchase.registrationUrl && (
              <div>
                <div className="text-gray-500">{commonT('registration')}</div>
                <div className="font-medium mt-1">
                  <a href={car.purchase.registrationUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    {t('viewDoc')}
                  </a>
                  {car.purchase.registrationExpiry && (
                    <span className={`text-gray-500 ${isRtl ? 'mr-2' : 'ml-2'}`}>
                      ({t('exp')}: {new Date(car.purchase.registrationExpiry).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')})
                    </span>
                  )}
                </div>
              </div>
            )}
            {car.purchase.roadPermitUrl && (
              <div>
                <div className="text-gray-500">{commonT('roadPermit')}</div>
                <div className="font-medium mt-1">
                  <a href={car.purchase.roadPermitUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    {t('viewDoc')}
                  </a>
                  {car.purchase.roadPermitExpiry && (
                    <span className={`text-gray-500 ${isRtl ? 'mr-2' : 'ml-2'}`}>
                      ({t('exp')}: {new Date(car.purchase.roadPermitExpiry).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {car.purchase.documentUrl && (
            <div className="mt-4">
              <div className="text-gray-500">{t('purchaseDoc')}</div>
              <div className="font-medium mt-1">
                <a href={car.purchase.documentUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  {t('viewDoc')}
                </a>
              </div>
            </div>
          )}
          {car.purchase.notes && (
            <div className="mt-4">
              <div className="text-gray-500">{t('notes')}</div>
              <div className="font-medium text-gray-800">{car.purchase.notes}</div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card" style={{ padding: '24px' }}>
          <h3 className="font-semibold text-gray-800 mb-4">{t('vehicleDetails')}</h3>
          <div className="space-y-4 text-sm">
            {[
              [t('chassisNumber'), car.chassisNumber],
              [t('engineNumber'), car.engineNumber],
              [t('color'), car.color],
              [t('totalRepairCost'), formatCurrency(car.totalRepairCost || 0)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center border-b border-gray-50 pb-2">
                <div className="text-gray-500">{label}</div>
                <div className="font-medium text-gray-800">{value || '-'}</div>
              </div>
            ))}
          </div>
        </div>

        {car.images?.length > 0 && (
          <div className="card" style={{ padding: '24px' }}>
            <h3 className="font-semibold text-gray-800 mb-4">{t('images')}</h3>
            <div className="grid grid-cols-3 gap-2">
              {car.images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img} alt={`Car ${i + 1}`} className="w-full h-24 object-cover rounded shadow-sm" />
              ))}
            </div>
          </div>
        )}
      </div>

      <GpsMap carId={car._id} carName={`${car.brand} ${car.model}`} />

      {car.notes && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 className="font-semibold text-gray-800 mb-2">{t('notes')}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{car.notes}</p>
        </div>
      )}

      <div className="card" style={{ padding: '24px' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800">{t('repairHistory')}</h3>
          <Link href={`/dashboard/repairs/new?carId=${car._id}`} className="text-sm text-indigo-600 hover:underline font-medium">{t('addRepair')}</Link>
        </div>
        {repairs.length === 0 ? (
          <p className="text-sm text-gray-500 italic">{t('noRepairs')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{commonT('description')}</th>
                  <th className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-left' : 'text-right'}`}>{commonT('amount')}</th>
                  <th className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{commonT('date')}</th>
                  <th className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{commonT('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {repairs.map((r) => (
                  <tr key={r._id}>
                    <td className="px-4 py-3">{r.repairDescription}</td>
                    <td className={`px-4 py-3 font-semibold text-orange-600 ${isRtl ? 'text-left' : 'text-right'}`}>{formatCurrency(r.totalCost || 0)}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(r.repairDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 rounded text-[11px] font-medium">{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800">{t('documents')}</h3>
          <Link href={`/dashboard/documents/new?carId=${car._id}`} className="text-sm text-indigo-600 hover:underline font-medium">{t('addDocument')}</Link>
        </div>
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500 italic">{t('noDocuments')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{commonT('type')}</th>
                  <th className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{t('exp')}</th>
                  <th className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{commonT('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((d) => (
                  <tr key={d._id}>
                    <td className="px-4 py-3 font-medium">{d.documentType}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(d.expiryDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/documents/${d._id}`} className="text-indigo-600 hover:text-indigo-800">{t('viewDoc')}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
