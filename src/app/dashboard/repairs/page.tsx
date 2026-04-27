'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import EditRepairModal from '@/components/EditRepairModal';
import { useTranslations, useLocale } from 'next-intl';

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

export default function RepairsPage() {
  const t = useTranslations('Repairs');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [cars, setCars] = useState<{ _id: string; carId: string; brand: string; model: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.size === repairs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(repairs.map((r) => r._id)));
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

  const handleBulkAction = async (action: 'delete' | 'update-status', status?: string) => {
    if (action === 'delete' && !confirm(commonT('deleteConfirm'))) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/repairs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: Array.from(selectedIds), status }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        fetchRepairs();
      } else {
        const data = await res.json();
        alert(data.error || 'Bulk action failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const fetchRepairs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/repairs?page=${page}&limit=15`);
      const data = await res.json();
      setRepairs(data.repairs || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  useEffect(() => {
    fetch('/api/cars?limit=100')
      .then(res => res.json())
      .then(data => setCars(data.cars || []))
      .catch(console.error);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      const res = await fetch(`/api/repairs/${id}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); alert(data.error || 'Failed'); return; }
      fetchRepairs();
    } catch (err) { console.error(err); }
  };

  const handleUpdateRepair = async (id: string, data: Partial<Repair>) => {
    try {
      const res = await fetch(`/api/repairs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const resData = await res.json(); alert(resData.error || 'Failed'); return; }
      setShowModal(false);
      setEditingRepair(null);
      fetchRepairs();
    } catch (err) { console.error(err); }
  };

  const getStatusLabel = (status: string) => {
    const key = status.replace(' ', '').charAt(0).toLowerCase() + status.replace(' ', '').slice(1);
    return t(`statuses.${key}`);
  };

  const statusStyles: Record<string, { background: string; color: string }> = {
    Pending: { background: '#f8b425', color: '#ffffff' },
    'In Progress': { background: '#38a4f8', color: '#ffffff' },
    Completed: { background: '#42ca7f', color: '#ffffff' },
  };

  const formatCurrency = (val: number | undefined | null) => `SAR ${(val || 0).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}`;

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
          href="/dashboard/repairs/new"
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
            <div style={{ width: '1px', height: '24px', background: '#eee' }} />
            <select
              onChange={(e) => handleBulkAction('update-status', e.target.value)}
              disabled={bulkActionLoading}
              style={{
                height: '32px',
                fontSize: '13px',
                borderRadius: '3px',
                border: '1px solid #ced4da',
                background: '#ffffff',
                padding: '0 8px'
              }}
            >
              <option value="">{commonT('status')}</option>
              {['Pending', 'In Progress', 'Completed'].map((s) => (
                <option key={s} value={s}>{getStatusLabel(s)}</option>
              ))}
            </select>
            <button
              onClick={() => handleBulkAction('delete')}
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
        ) : repairs.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{t('noRepairsFound')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '700px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                <th style={{ padding: '12px', width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={repairs.length > 0 && selectedIds.size === repairs.length}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = selectedIds.size > 0 && selectedIds.size < repairs.length;
                      }
                    }}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('id')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('repairDescription')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('totalCost')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('repairDate')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('status')}</th>
                <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('actions')}</th>
              </tr>
            </thead>
            <tbody style={{ borderBottom: '1px solid #eee' }}>
              {repairs.map((r) => (
                <tr key={r._id} style={{ borderBottom: '1px solid #f5f5f5', background: selectedIds.has(r._id) ? '#28aaa905' : 'transparent' }}>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r._id)}
                      onChange={() => toggleSelect(r._id)}
                    />
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#28aaa9' }}>{r.carId}</td>
                  <td style={{ padding: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.repairDescription}
                  </td>
                  <td style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(r.totalCost || 0)}</td>
                  <td style={{ padding: '12px' }}>{new Date(r.repairDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}</td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        borderRadius: '3px',
                        ...(statusStyles[r.status] || { background: '#adb5bd', color: '#ffffff' }),
                      }}
                    >
                      {getStatusLabel(r.status)}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                      <button onClick={() => { setEditingRepair(r); setShowModal(true); }} style={{ color: '#f8b425', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>{commonT('edit')}</button>
                      <button onClick={() => handleDelete(r._id)} style={{ color: '#ec4561', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>{commonT('delete')}</button>
                      <Link href={`/dashboard/repairs/${r._id}`} style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>{commonT('view')}</Link>
                    </div>
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

    {showModal && editingRepair && (
      <EditRepairModal
        repair={editingRepair}
        cars={cars}
        onClose={() => { setShowModal(false); setEditingRepair(null); }}
        onSave={(data) => handleUpdateRepair(editingRepair._id, data)}
      />
    )}
  </div>
);
}
