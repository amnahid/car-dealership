'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslations, useLocale } from 'next-intl';

interface Supplier {
  _id: string;
  supplierId: string;
  companyName: string;
  companyLogo?: string;
  companyNumber: string;
  email?: string;
  phone: string;
  address?: string;
  salesAgent?: {
    name: string;
    phone: string;
    email?: string;
    photo?: string;
    designation?: string;
  };
  status: 'active' | 'inactive';
  notes?: string;
  totalPurchases: number;
  totalAmount: number;
}

export default function SuppliersPage() {
  const t = useTranslations('Suppliers');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const searchParams = useSearchParams();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.size === suppliers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(suppliers.map((s) => s._id)));
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
    if (!confirm(t('deleteConfirm'))) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/suppliers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        fetchSuppliers(pagination.page, search, statusFilter);
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

  const fetchSuppliers = useCallback(async (page = 1, searchVal = debouncedSearch, status = statusFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (searchVal) params.set('search', searchVal);
      if (status) params.set('status', status);

      const res = await fetch(`/api/suppliers?${params.toString()}`);
      const data = await res.json();
      setSuppliers(data.suppliers || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchSuppliers(parseInt(searchParams.get('page') || '1'), searchParams.get('search') || '', searchParams.get('status') || '');
  }, [fetchSuppliers, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    router.push(`/dashboard/cars/suppliers?${params.toString()}`);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    router.push(`/dashboard/cars/suppliers?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSuppliers(pagination.page, search, statusFilter);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const formatCurrency = (value: number | undefined | null) => `SAR ${(value || 0).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}`;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className={isRtl ? 'text-right' : 'text-left'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <h2 className="page-title" style={{ margin: 0 }}>{t('title')}</h2>
        <Link
          href="/dashboard/cars/suppliers/new"
          style={{
            padding: '10px 20px',
            background: '#28aaa9',
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          + {t('addNew')}
        </Link>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '10px 14px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
              textAlign: isRtl ? 'right' : 'left'
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
              background: '#fff',
              minWidth: '150px',
              textAlign: isRtl ? 'right' : 'left'
            }}
          >
            <option value="">{t('allStatus')}</option>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </select>
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              background: '#2b2d5d',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {commonT('search')}
          </button>
        </form>
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

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', direction: isRtl ? 'rtl' : 'ltr' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '14px 16px', width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={suppliers.length > 0 && selectedIds.size === suppliers.length}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = selectedIds.size > 0 && selectedIds.size < suppliers.length;
                      }
                    }}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={{ padding: '14px 16px', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, fontSize: '14px', color: '#555' }}>{t('company')}</th>
                <th style={{ padding: '14px 16px', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, fontSize: '14px', color: '#555' }}>{t('companyNo')}</th>
                <th style={{ padding: '14px 16px', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, fontSize: '14px', color: '#555' }}>{t('contact')}</th>
                <th style={{ padding: '14px 16px', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, fontSize: '14px', color: '#555' }}>{t('salesAgent')}</th>
                <th style={{ padding: '14px 16px', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, fontSize: '14px', color: '#555' }}>{t('purchases')}</th>
                <th style={{ padding: '14px 16px', textAlign: isRtl ? 'left' : 'right', fontWeight: 600, fontSize: '14px', color: '#555' }}>{t('totalAmount')}</th>
                <th style={{ padding: '14px 16px', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, fontSize: '14px', color: '#555' }}>{t('status')}</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, fontSize: '14px', color: '#555' }}>{commonT('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>{commonT('loading')}</td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>{t('noSuppliers')}</td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier._id} style={{ borderBottom: '1px solid #eee', background: selectedIds.has(supplier._id) ? '#28aaa905' : 'transparent' }}>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(supplier._id)}
                        onChange={() => toggleSelect(supplier._id)}
                      />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        {supplier.companyLogo ? (
                          <img
                            src={supplier.companyLogo}
                            alt={supplier.companyName}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 600, color: '#666' }}>
                            {supplier.companyName.charAt(0)}
                          </div>
                        )}
                        <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                          <Link href={`/dashboard/cars/suppliers/${supplier._id}`} style={{ color: '#2b2d5d', fontWeight: 500, textDecoration: 'none' }}>
                            {supplier.companyName}
                          </Link>
                          {supplier.email && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#999' }}>{supplier.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>{supplier.companyNumber}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                      <p style={{ margin: 0 }}>{supplier.phone}</p>
                      {supplier.address && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#999' }}>{supplier.address}</p>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                      {supplier.salesAgent ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                          {supplier.salesAgent.photo ? (
                            <img src={supplier.salesAgent.photo} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#666' }}>
                              {supplier.salesAgent.name.charAt(0)}
                            </div>
                          )}
                          <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: '13px' }}>{supplier.salesAgent.name}</p>
                            {supplier.salesAgent.designation && <p style={{ margin: 0, fontSize: '11px', color: '#999' }}>{supplier.salesAgent.designation}</p>}
                          </div>
                        </div>
                      ) : <span style={{ color: '#999' }}>-</span>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500 }}>{supplier.totalPurchases}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500, color: '#28aaa9', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(supplier.totalAmount)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: supplier.status === 'active' ? '#d4edda' : '#f8d7da',
                        color: supplier.status === 'active' ? '#155724' : '#721c24',
                      }}>
                        {supplier.status === 'active' ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <Link
                          href={`/dashboard/cars/suppliers/${supplier._id}`}
                          style={{ padding: '6px 12px', background: '#e9ecef', borderRadius: '4px', fontSize: '12px', color: '#555', textDecoration: 'none' }}
                        >
                          {commonT('view')}
                        </Link>
                        <Link
                          href={`/dashboard/cars/suppliers/${supplier._id}/edit`}
                          style={{ padding: '6px 12px', background: '#fff3cd', borderRadius: '4px', fontSize: '12px', color: '#856404', textDecoration: 'none' }}
                        >
                          {commonT('edit')}
                        </Link>
                        <button
                          onClick={() => handleDelete(supplier._id)}
                          style={{ padding: '6px 12px', background: '#f8d7da', borderRadius: '4px', fontSize: '12px', color: '#721c24', border: 'none', cursor: 'pointer' }}
                        >
                          {commonT('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              {t('showing', { 
                start: ((pagination.page - 1) * pagination.limit) + 1,
                end: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total
              })}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', (pagination.page - 1).toString());
                  router.push(`/dashboard/cars/suppliers?${params.toString()}`);
                }}
                style={{ padding: '8px 14px', border: '1px solid #ddd', background: '#fff', borderRadius: '4px', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', opacity: pagination.page <= 1 ? 0.5 : 1 }}
              >
                {commonT('prev')}
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', (pagination.page + 1).toString());
                  router.push(`/dashboard/cars/suppliers?${params.toString()}`);
                }}
                style={{ padding: '8px 14px', border: '1px solid #ddd', background: '#fff', borderRadius: '4px', cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer', opacity: pagination.page >= pagination.totalPages ? 0.5 : 1 }}
              >
                {commonT('next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
