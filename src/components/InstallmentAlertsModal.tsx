'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface Payment {
  _id: string;
  saleId: string;
  customerName: string;
  customerPhone: string;
  carId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  daysOverdue?: number;
  daysUntilDue?: number;
}

interface AlertData {
  count: number;
  total: number;
  payments: Payment[];
}

interface InstallmentAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentPaid: (saleId: string, installmentNumber: number) => void;
}

export default function InstallmentAlertsModal({ isOpen, onClose, onPaymentPaid }: InstallmentAlertsModalProps) {
  const t = useTranslations('InstallmentAlerts');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'overdue' | 'upcoming'>('overdue');
  const [overdueData, setOverdueData] = useState<AlertData | null>(null);
  const [upcomingData, setUpcomingData] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/sales/installments/alerts')
        .then((res) => res.json())
        .then((data) => {
          setOverdueData(data.overdue);
          setUpcomingData(data.upcoming);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleMarkPaid = async (saleId: string, installmentNumber: number, amount: number) => {
    setProcessingId(`${saleId}-${installmentNumber}`);
    try {
      const res = await fetch(`/api/sales/installments/${saleId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installmentNumber,
          amount,
          paymentDate: new Date().toISOString().split('T')[0],
        }),
      });

      if (res.ok) {
        onPaymentPaid(saleId, installmentNumber);
        const refreshRes = await fetch('/api/sales/installments/alerts');
        const refreshData = await refreshRes.json();
        setOverdueData(refreshData.overdue);
        setUpcomingData(refreshData.upcoming);
      }
    } catch (err) {
      console.error('Failed to mark payment:', err);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  const data = activeTab === 'overdue' ? overdueData : upcomingData;

  const formatCurrency = (val: number | undefined | null) => `SAR ${(val || 0).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}`;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#ffffff', borderRadius: '8px', width: '800px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', textAlign: isRtl ? 'right' : 'left' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#2a3142' }}>{t('title')}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9ca8b3' }}>×</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #eee', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <button
            onClick={() => setActiveTab('overdue')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'overdue' ? '#ec4561' : 'transparent',
              color: activeTab === 'overdue' ? '#ffffff' : '#525f80',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {t('overdue')} ({overdueData?.count || 0})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'upcoming' ? '#f8b425' : 'transparent',
              color: activeTab === 'upcoming' ? '#ffffff' : '#525f80',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {t('upcoming')} ({upcomingData?.count || 0})
          </button>
        </div>

        <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee' }}>
          <span style={{ color: '#9ca8b3', fontSize: '14px' }}>{commonT('total')}: </span>
          <span style={{ color: activeTab === 'overdue' ? '#ec4561' : '#f8b425', fontWeight: 700, fontSize: '18px' }}>
            {formatCurrency(data?.total || 0)}
          </span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca8b3' }}>{commonT('loading')}</div>
          ) : data?.payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca8b3' }}>
              {t('noPayments', { type: activeTab === 'overdue' ? t('overdue') : t('upcoming') })}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px', marginTop: '16px', minWidth: '700px', direction: isRtl ? 'rtl' : 'ltr' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '10px', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, color: '#525f80' }}>{t('customer')}</th>
                    <th style={{ padding: '10px', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, color: '#525f80' }}>{commonT('id')}</th>
                    <th style={{ padding: '10px', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, color: '#525f80' }}>{t('installment')}</th>
                    <th style={{ padding: '10px', textAlign: isRtl ? 'left' : 'right', fontWeight: 600, color: '#525f80' }}>{commonT('amount')}</th>
                    <th style={{ padding: '10px', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, color: '#525f80' }}>{t('dueDate')}</th>
                    <th style={{ padding: '10px', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, color: '#525f80' }}>{commonT('status')}</th>
                    <th style={{ padding: '10px', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, color: '#525f80' }}>{commonT('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.payments.map((payment) => (
                    <tr key={`${payment.saleId}-${payment.installmentNumber}`} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 500 }}>{payment.customerName}</div>
                        <div style={{ fontSize: '12px', color: '#9ca8b3' }}>{payment.customerPhone}</div>
                      </td>
                      <td style={{ padding: '10px' }}>{payment.carId}</td>
                      <td style={{ padding: '10px' }}>#{payment.installmentNumber}</td>
                      <td style={{ padding: '10px', fontWeight: 600, textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(payment.amount)}</td>
                      <td style={{ padding: '10px' }}>{new Date(payment.dueDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          background: activeTab === 'overdue' ? '#ec4561' : '#f8b425',
                          color: '#ffffff',
                        }}>
                          {activeTab === 'overdue' ? t('daysOverdue', { days: payment.daysOverdue ?? 0 }) : t('dueInDays', { days: payment.daysUntilDue ?? 0 })}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <button
                          onClick={() => handleMarkPaid(payment.saleId, payment.installmentNumber, payment.amount)}
                          disabled={processingId === `${payment.saleId}-${payment.installmentNumber}`}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            background: '#28aaa9',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            opacity: processingId === `${payment.saleId}-${payment.installmentNumber}` ? 0.6 : 1,
                          }}
                        >
                          {processingId === `${payment.saleId}-${payment.installmentNumber}` ? t('processing') : t('markPaid')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
