'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface NotificationLog {
  _id: string;
  notificationId: string;
  channel: 'whatsapp' | 'email';
  type: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  subject: string;
  content: string;
  referenceId?: string;
  referenceType?: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

export default function NotificationLogsPage() {
  const t = useTranslations('NotificationLogs');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    channel: '',
    type: '',
    status: '',
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (filters.channel) params.append('channel', filters.channel);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      
      const res = await fetch(`/api/notifications/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return '#059669';
      case 'failed': return '#dc2626';
      default: return '#f59e0b';
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return '#25D366';
      case 'email': return '#0284c7';
      case 'sms': return '#7c3aed';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 className="page-title" style={{ marginBottom: '24px', textAlign: isRtl ? 'right' : 'left' }}>{t('title')}</h2>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <select
          value={filters.channel}
          onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            minWidth: '120px',
            textAlign: isRtl ? 'right' : 'left'
          }}
        >
          <option value="">{t('allChannels')}</option>
          <option value="whatsapp">{t('channels.whatsapp')}</option>
          <option value="email">{t('channels.email')}</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            minWidth: '150px',
            textAlign: isRtl ? 'right' : 'left'
          }}
        >
          <option value="">{t('allTypes')}</option>
          <option value="sale_thank_you">{t('types.sale_thank_you')}</option>
          <option value="rental_confirmation">{t('types.rental_confirmation')}</option>
          <option value="installment_confirmation">{t('types.installment_confirmation')}</option>
          <option value="payment_reminder">{t('types.payment_reminder')}</option>
          <option value="payment_overdue">{t('types.payment_overdue')}</option>
          <option value="salary_payment">{t('types.salary_payment')}</option>
          <option value="document_renewed">{t('types.document_renewed')}</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            minWidth: '120px',
            textAlign: isRtl ? 'right' : 'left'
          }}
        >
          <option value="">{t('allStatus')}</option>
          <option value="sent">{t('statuses.sent')}</option>
          <option value="failed">{t('statuses.failed')}</option>
          <option value="pending">{t('statuses.pending')}</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{t('noLogs')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '800px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('id')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('brand')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('allTypes')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('recipient')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('subject')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('status')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('reference')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('sentAt')}</th>
              </tr>
            </thead>
            <tbody style={{ borderBottom: '1px solid #eee' }}>
              {logs.map((log) => (
                <tr key={log._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: '#6b7280' }}>
                    {log.notificationId}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '3px',
                        background: getChannelColor(log.channel),
                        color: '#ffffff',
                        textTransform: 'uppercase',
                      }}
                    >
                      {['whatsapp', 'email', 'sms'].includes(log.channel) ? t(`channels.${log.channel}`) : log.channel}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 500, fontSize: '13px' }}>
                    {t(`types.${log.type}`)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 500 }}>{log.recipientName}</div>
                    {log.recipientEmail && (
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{log.recipientEmail}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.subject}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '3px',
                        background: getStatusColor(log.status),
                        color: '#ffffff',
                        textTransform: 'uppercase',
                      }}
                    >
                      {t(`statuses.${log.status}`)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px' }}>
                    {log.referenceType && (
                      <div style={{ fontWeight: 500 }}>{log.referenceType}</div>
                    )}
                    {log.referenceId && (
                      <div style={{ color: '#6b7280', fontSize: '11px' }}>{log.referenceId}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: '#525f80', fontSize: '12px' }}>
                    {log.sentAt ? new Date(log.sentAt).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              border: '1px solid #ced4da',
              borderRadius: '3px',
              background: '#ffffff',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            {commonT('prev')}
          </button>
          <span style={{ padding: '8px 12px', fontSize: '12px', color: '#525f80' }}>
            {commonT('page', { page, total: totalPages })}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              border: '1px solid #ced4da',
              borderRadius: '3px',
              background: '#ffffff',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            {commonT('next')}
          </button>
        </div>
      )}
    </div>
  );
}
