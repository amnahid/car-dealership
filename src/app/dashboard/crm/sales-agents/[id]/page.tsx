'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import SalesAgentModal, { SalesAgent } from '@/components/forms/SalesAgentModal';
import { useTranslations, useLocale } from 'next-intl';

export default function SalesAgentDetailPage() {
  const t = useTranslations('SalesAgents');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const params = useParams();
  const router = useRouter();

  const [agent, setAgent] = useState<SalesAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchAgent = useCallback(async () => {
    const id = params?.id;
    if (!id) return;

    try {
        const res = await fetch(`/api/crm/sales-agents/${id}`);
        if (!res.ok) throw new Error('Sales agent not found');
        const data = await res.json();
        setAgent(data.agent);
    } catch (err: any) {
        setError(err.message || 'Failed to load sales agent');
    } finally {
        setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm'))) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/sales-agents/${agent?._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
        return;
      }
      router.push('/dashboard/crm/sales-agents');
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>;
  if (error || !agent) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ec4561' }}>
        {error || 'Sales agent not found'}
        <div style={{ marginTop: '16px' }}>
          <Link href="/dashboard/crm/sales-agents" style={{ color: '#28aaa9' }}>← {isRtl ? 'العودة لمناديب المبيعات' : 'Back to Sales Agents'}</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <Link href="/dashboard/crm/sales-agents" style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>
          ← {isRtl ? 'العودة لمناديب المبيعات' : 'Back to Sales Agents'}
        </Link>
        <button
            onClick={() => setShowEditModal(true)}
            style={{ padding: '8px 16px', background: '#f8b425', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '14px' }}
        >
            {commonT('edit')}
        </button>
      </div>

      <h2 className="page-title" style={{ marginBottom: '24px' }}>{isRtl ? 'تفاصيل مندوب المبيعات' : 'Sales Agent Details'}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <ImageUpload value={agent.profilePhoto} onChange={async (url) => {
              const res = await fetch(`/api/crm/sales-agents/${agent._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profilePhoto: url }),
              });
              if (res.ok) setAgent({ ...agent, profilePhoto: url });
            }} folder="sales-agents" label={agent.fullName} size={80} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>{isRtl ? 'المعلومات الشخصية' : 'Personal Information'}</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <span style={{ color: '#9ca8b3' }}>{t('agentId')}</span>
              <span style={{ color: '#28aaa9', fontWeight: 600, fontFamily: 'monospace' }}>{agent.agentId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <span style={{ color: '#9ca8b3' }}>{t('fullName')}</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{agent.fullName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <span style={{ color: '#9ca8b3' }}>{t('phone')}</span>
              <span style={{ color: '#2a3142' }}>{agent.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <span style={{ color: '#9ca8b3' }}>{t('email')}</span>
              <span style={{ color: '#2a3142' }}>{agent.email || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <span style={{ color: '#9ca8b3' }}>{t('passportNumber')}</span>
              <span style={{ color: '#2a3142' }}>{agent.passportNumber || '-'}</span>
            </div>
            {agent.passportExpiryDate && (
              <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <span style={{ color: '#9ca8b3' }}>{commonT('passportExpiryDate')}</span>
                <span style={{ color: '#2a3142' }}>{new Date(agent.passportExpiryDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>{t('address')}</h3>
          <p style={{ color: '#2a3142', lineHeight: '1.6', textAlign: isRtl ? 'right' : 'left' }}>
            {agent.address || '-'}
          </p>

          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginTop: '24px', marginBottom: '16px' }}>{t('documents')}</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {agent.passportDocument && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '4px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <span style={{ fontSize: '14px', color: '#2a3142' }}>{commonT('passportDocument')}</span>
                <a href={agent.passportDocument} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', fontSize: '13px', fontWeight: 500 }}>{isRtl ? 'عرض' : 'View'}</a>
              </div>
            )}
            {agent.drivingLicenseDocument && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '4px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <span style={{ fontSize: '14px', color: '#2a3142' }}>{commonT('drivingLicense')}</span>
                <a href={agent.drivingLicenseDocument} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', fontSize: '13px', fontWeight: 500 }}>{isRtl ? 'عرض' : 'View'}</a>
              </div>
            )}
            {agent.iqamaDocument && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '4px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <span style={{ fontSize: '14px', color: '#2a3142' }}>{commonT('iqama')}</span>
                <a href={agent.iqamaDocument} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', fontSize: '13px', fontWeight: 500 }}>{isRtl ? 'عرض' : 'View'}</a>
              </div>
            )}
            {!agent.passportDocument && !agent.drivingLicenseDocument && !agent.iqamaDocument && (
              <p style={{ color: '#9ca8b3', fontSize: '14px', textAlign: isRtl ? 'right' : 'left' }}>{isRtl ? 'لا يوجد مستندات' : 'No documents uploaded'}</p>
            )}
          </div>
        </div>
      </div>

      {agent.notes && (
        <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>{t('notes')}</h3>
            <p style={{ color: '#2a3142', whiteSpace: 'pre-wrap', textAlign: isRtl ? 'right' : 'left' }}>{agent.notes}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ec4561', borderRadius: '3px', background: '#ffffff', color: '#ec4561', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}
        >
          {deleting ? commonT('loading') : commonT('delete')}
        </button>
      </div>

      {showEditModal && (
          <SalesAgentModal 
            agent={agent} 
            onClose={() => setShowEditModal(false)} 
            onSave={() => { setShowEditModal(false); fetchAgent(); }} 
          />
      )}
    </div>
  );
}
