'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

interface VehicleDoc {
  _id: string;
  carId: string;
  documentType: string;
  expiryDate: string;
  issueDate: string;
  fileName: string;
  fileUrl?: string;
  car?: { carId: string; brand: string; model: string };
}

function getExpiryStyle(expiryDate: string): React.CSSProperties {
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { color: '#ec4561', fontWeight: 600 };
  if (days <= 7) return { color: '#ec4561', fontWeight: 600 };
  if (days <= 15) return { color: '#f8b425', fontWeight: 600 };
  if (days <= 30) return { color: '#f8a426', fontWeight: 500 };
  return { color: '#2a3142' };
}

export default function DocumentsPage() {
  const t = useTranslations('Documents');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [documents, setDocuments] = useState<VehicleDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((d) => d._id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    if (!confirm(commonT('deleteConfirm'))) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/documents/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        fetchDocs();
      } else {
        const data = await res.json();
        alert(data.error || 'Bulk delete failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d._id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (url: string | undefined, fileName: string | undefined) => {
    if (url) window.open(url, '_blank');
  };

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?page=${page}&limit=15`);
      const data = await res.json();
      setDocuments(data.documents || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexDirection: isRtl ? 'row-reverse' : 'row'
        }}
      >
        <h2 className="page-title">{t('title')}</h2>
        <Link
          href="/dashboard/documents/new"
          style={{
            background: '#28aaa9',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 500,
            padding: '10px 16px',
            borderRadius: '3px',
            textDecoration: 'none',
            border: '1px solid #28aaa9',
          }}
        >
          + {t('addNew')}
        </Link>
      </div>

      {selectedIds.size > 0 && (
        <div
          style={{
            position: 'sticky',
            top: '0',
            zIndex: 10,
            background: '#ffffff',
            padding: '12px 16px',
            marginBottom: '16px',
            border: '1px solid #28aaa9',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            flexDirection: isRtl ? 'row-reverse' : 'row'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <span style={{ fontWeight: 600, color: '#28aaa9' }}>{selectedIds.size} {commonT('selected')}</span>
            <button
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
              style={{
                height: '32px',
                padding: '0 12px',
                fontSize: '13px',
                borderRadius: '3px',
                border: '1px solid #dc3545',
                background: '#ffffff',
                color: '#dc3545',
                cursor: 'pointer'
              }}
            >
              {commonT('deleteSelected')}
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca8b3',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {commonT('cancel')}
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{t('noDocumentsFound')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '600px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                <th style={{ padding: '12px', width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={documents.length > 0 && selectedIds.size === documents.length}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = selectedIds.size > 0 && selectedIds.size < documents.length;
                      }
                    }}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('id')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('documentType')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('issueDate')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('expiryDate')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('file')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('actions')}</th>
              </tr>
            </thead>
            <tbody style={{ borderBottom: '1px solid #eee' }}>
              {documents.map((doc) => {
                const daysLeft = Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / 86400000);
                const expiryStyle = getExpiryStyle(doc.expiryDate);
                return (
                  <tr key={doc._id} style={{ borderBottom: '1px solid #f5f5f5', background: selectedIds.has(doc._id) ? '#28aaa905' : 'transparent' }}>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(doc._id)}
                        onChange={() => toggleSelect(doc._id)}
                      />
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#28aaa9' }}>{doc.carId}</td>
                    <td style={{ padding: '12px' }}>{doc.documentType}</td>
                    <td style={{ padding: '12px' }}>{new Date(doc.issueDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}</td>
                    <td style={{ padding: '12px', ...expiryStyle }}>
                      {new Date(doc.expiryDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                      {daysLeft <= 30 && daysLeft >= 0 && (
                        <span style={{ marginLeft: isRtl ? '0' : '4px', marginRight: isRtl ? '4px' : '0', fontSize: '11px' }}>({t('daysLeft', { days: daysLeft })})</span>
                      )}
                      {daysLeft < 0 && <span style={{ marginLeft: isRtl ? '0' : '4px', marginRight: isRtl ? '4px' : '0', fontSize: '11px' }}>({t('expired')})</span>}
                    </td>
                    <td style={{ padding: '12px', color: '#525f80', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.fileName || '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <Link href={`/dashboard/documents/${doc._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>{commonT('view')}</Link>
                        <Link href={`/dashboard/documents/${doc._id}/edit`} style={{ color: '#525f80', textDecoration: 'none' }}>{commonT('edit')}</Link>
                        {doc.fileUrl && (
                          <button onClick={() => handleDownload(doc.fileUrl, doc.fileName)} style={{ background: 'none', border: 'none', color: '#28aaa9', cursor: 'pointer', padding: 0, fontSize: '14px' }}>{t('download')}</button>
                        )}
                        <button onClick={() => handleDelete(doc._id)} disabled={deleting === doc._id} style={{ background: 'none', border: 'none', color: '#ec4561', cursor: 'pointer', padding: 0, fontSize: '14px', opacity: deleting === doc._id ? 0.5 : 1 }}>{commonT('delete')}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
