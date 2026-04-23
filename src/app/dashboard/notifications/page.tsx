'use client';

import { useState, useEffect, useCallback } from 'react';

interface NotificationLog {
  _id: string;
  notificationId: string;
  channel: 'sms' | 'email';
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
      case 'sms': return '#7c3aed';
      case 'email': return '#0284c7';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 className="page-title" style={{ marginBottom: '24px' }}>Notification Logs</h2>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select
          value={filters.channel}
          onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            minWidth: '120px',
          }}
        >
          <option value="">All Channels</option>
          <option value="sms">SMS</option>
          <option value="email">Email</option>
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
          }}
        >
          <option value="">All Types</option>
          <option value="sale_thank_you">Sale Thank You</option>
          <option value="rental_confirmation">Rental Confirmation</option>
          <option value="installment_confirmation">Installment Confirmation</option>
          <option value="payment_reminder">Payment Reminder</option>
          <option value="payment_overdue">Payment Overdue</option>
          <option value="salary_payment">Salary Payment</option>
          <option value="document_renewed">Document Renewed</option>
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
          }}
        >
          <option value="">All Status</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No notification logs found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '800px' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                {['ID', 'Channel', 'Type', 'Recipient', 'Subject', 'Status', 'Reference', 'Date'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#525f80',
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
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
                      {log.channel}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 500, fontSize: '13px' }}>
                    {log.type}
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
                      {log.status}
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
                    {log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
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
            Prev
          </button>
          <span style={{ padding: '8px 12px', fontSize: '12px', color: '#525f80' }}>
            Page {page} of {totalPages}
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
            Next
          </button>
        </div>
      )}
    </div>
  );
}