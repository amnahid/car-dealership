'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import { useTranslations, useLocale } from 'next-intl';

interface Guarantor {
  _id: string;
  guarantorId: string;
  fullName: string;
  phone: string;
  email?: string;
  nationalId: string;
  employer?: string;
  salary?: number;
  buildingNumber: string;
  streetName: string;
  district: string;
  city: string;
  postalCode: string;
  countryCode: string;
  documents: string[];
  profilePhoto?: string;
  notes?: string;
  createdAt: string;
}

export default function GuarantorDetailPage() {
  const t = useTranslations('Guarantors');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const params = useParams();
  const router = useRouter();

  const [guarantor, setGuarantor] = useState<Guarantor | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    fetch(`/api/guarantors/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Guarantor not found');
        return res.json();
      })
      .then((data) => {
        setGuarantor(data.guarantor);
        setSales(data.sales || []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load guarantor');
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm'))) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/guarantors/${guarantor?._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
        return;
      }
      router.push('/dashboard/crm/guarantors');
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>;
  if (error || !guarantor) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ec4561' }}>
        {error || 'Guarantor not found'}
        <div style={{ marginTop: '16px' }}>
          <Link href="/dashboard/crm/guarantors" style={{ color: '#28aaa9' }}>← {isRtl ? 'العودة للكفلاء' : 'Back to Guarantors'}</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/crm/guarantors" style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>
          ← {isRtl ? 'العودة للكفلاء' : 'Back to Guarantors'}
        </Link>
      </div>

      <h2 className="page-title" style={{ marginBottom: '24px' }}>{isRtl ? 'تفاصيل الكفيل' : 'Guarantor Details'}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <ImageUpload value={guarantor.profilePhoto} onChange={async (url) => {
              const res = await fetch(`/api/guarantors/${guarantor._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profilePhoto: url }),
              });
              if (res.ok) setGuarantor({ ...guarantor, profilePhoto: url });
            }} folder="guarantors" label={guarantor.fullName} size={80} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>{isRtl ? 'المعلومات الشخصية' : 'Personal Information'}</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>{t('guarantorId')}</span>
              <span style={{ color: '#28aaa9', fontWeight: 600, fontFamily: 'monospace' }}>{guarantor.guarantorId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>{t('fullName')}</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{guarantor.fullName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>{t('phone')}</span>
              <span style={{ color: '#2a3142' }}>{guarantor.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>{t('nationalId')}</span>
              <span style={{ color: '#2a3142' }}>{guarantor.nationalId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>{t('employer')}</span>
              <span style={{ color: '#2a3142' }}>{guarantor.employer || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>{t('salary')}</span>
              <span style={{ color: '#2a3142' }}>SAR {(guarantor.salary || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>{t('address')}</h3>
          <p style={{ color: '#2a3142', lineHeight: '1.6' }}>
            {guarantor.buildingNumber} {guarantor.streetName}<br />
            {guarantor.district}, {guarantor.city}<br />
            {guarantor.postalCode}
          </p>

          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginTop: '24px', marginBottom: '16px' }}>{t('documents')}</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {guarantor.documents && guarantor.documents.length > 0 ? guarantor.documents.map((doc, i) => (
              <a key={i} href={doc} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', fontSize: '14px', display: 'block', padding: '8px', border: '1px solid #eee', borderRadius: '4px' }}>
                {isRtl ? 'مستند' : 'Document'} {i + 1}
              </a>
            )) : <p style={{ color: '#9ca8b3', fontSize: '14px' }}>{isRtl ? 'لا يوجد مستندات' : 'No documents uploaded'}</p>}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>{t('guaranteeing')}</h3>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {sales.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{isRtl ? 'لا يوجد عمليات بيع حالية' : 'No active guaranteed sales found.'}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '14px' }}>
                  <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{isRtl ? 'معرف البيع' : 'Sale ID'}</th>
                      <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{isRtl ? 'السيارة' : 'Car'}</th>
                      <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{isRtl ? 'المبلغ الإجمالي' : 'Total Amount'}</th>
                      <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>{isRtl ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '12px' }}><Link href={`/dashboard/sales/installments/${sale._id}`} style={{ color: '#28aaa9' }}>{sale.saleId}</Link></td>
                        <td style={{ padding: '12px' }}>{sale.car?.brand} {sale.car?.model}</td>
                        <td style={{ padding: '12px' }}>SAR {sale.totalPrice?.toLocaleString()}</td>
                        <td style={{ padding: '12px' }}>{sale.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ec4561', borderRadius: '3px', background: '#ffffff', color: '#ec4561', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}
        >
          {deleting ? commonT('loading') : commonT('delete')}
        </button>
      </div>
    </div>
  );
}
