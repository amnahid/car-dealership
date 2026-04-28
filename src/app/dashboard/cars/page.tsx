'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import DataTransferButtons from '@/components/DataTransferButtons';
import { useDebounce } from '@/hooks/useDebounce';
import { CarStatus } from '@/types';
import { useTranslations, useLocale } from 'next-intl';

interface Purchase {
  supplierName: string;
  purchasePrice: number;
  purchaseDate?: string;
}

interface Car {
  _id: string;
  carId: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  status: CarStatus;
  images: string[];
  totalRepairCost: number;
  purchase?: Purchase;
  createdAt?: string;
}

function formatCurrency(value: number | undefined | null, locale: string): string {
  if (value === undefined || value === null) return 'SAR 0';
  return `SAR ${value.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}`;
}

interface FilterOptions {
  colors: string[];
  years: number[];
  brands: string[];
  models: string[];
}

export default function CarsPage() {
  const t = useTranslations('Cars');
  const commonT = useTranslations('Common');
  const statusT = useTranslations('Status');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const TABS = [t('inventoryTab'), t('stockReportTab')] as const;
  type Tab = typeof TABS[number];

  const [cars, setCars] = useState<Car[]>([]);
  const [stats, setStats] = useState({ inStock: 0, sold: 0, underRepair: 0, rented: 0, reserved: 0, totalPurchaseValue: 0, totalRepairCost: 0, totalCost: 0 });
  const [stockReport, setStockReport] = useState<{ brand: string; count: number; value: number; models: Record<string, number> }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(TABS[0]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ colors: [], years: [], brands: [], models: [] });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.size === cars.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cars.map((c) => c._id)));
    }
  };

  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(commonT('deleteConfirm'))) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/cars/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCars();
        fetchStats();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete car');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkAction = async (action: 'delete' | 'update-status', status?: string) => {
    if (action === 'delete' && !confirm(commonT('deleteConfirm'))) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/cars/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: Array.from(selectedIds), status }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        fetchCars();
        fetchStats();
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

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/cars/stats');
      const data = await res.json();
      setStats({
        inStock: data.statusCounts?.inStock || 0,
        sold: data.statusCounts?.sold || 0,
        underRepair: data.statusCounts?.underRepair || 0,
        rented: data.statusCounts?.rented || 0,
        reserved: data.statusCounts?.reserved || 0,
        totalPurchaseValue: data.inStockStats?.totalPurchaseValue || 0,
        totalRepairCost: data.inStockStats?.totalRepairCost || 0,
        totalCost: data.inStockStats?.totalCost || 0,
      });
      setStockReport(data.stockReport || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/cars', { method: 'OPTIONS' });
      const data = await res.json();
      setFilterOptions({
        colors: data.colors || [],
        years: data.years || [],
        brands: data.brands || [],
        models: data.models || [],
      });
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  }, []);

  const fetchCars = useCallback(async () => {
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (debouncedSearch) params.set('brand', debouncedSearch);
    if (statusFilter) params.set('status', statusFilter);
    if (modelFilter) params.set('model', modelFilter);
    if (yearFilter) params.set('year', yearFilter);
    if (colorFilter) params.set('color', colorFilter);

    try {
      const res = await fetch(`/api/cars?${params}`);
      if (!res.ok) {
        console.error('Failed to fetch cars:', res.status);
        setCars([]);
        return;
      }
      const data = await res.json();
      setCars(data.cars || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, modelFilter, yearFilter, colorFilter]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const filteredCars = cars;

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
        <h2 className="page-title">{t('inventory')}</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <DataTransferButtons entityType="cars" onImportSuccess={fetchCars} />
          <Link
            href="/dashboard/cars/new"
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
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: statusT('inStock'), value: stats.inStock, color: '#28aaa9', key: 'In Stock' },
          { label: statusT('underRepair'), value: stats.underRepair, color: '#f5a623', key: 'Under Repair' },
          { label: statusT('reserved'), value: stats.reserved, color: '#38a4f8', key: 'Reserved' },
          { label: statusT('sold'), value: stats.sold, color: '#42ca7f', key: 'Sold' },
          { label: statusT('rented'), value: stats.rented, color: '#8b5cf6', key: 'Rented' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card"
            style={{
              padding: '16px',
              borderLeft: isRtl ? 'none' : `4px solid ${stat.color}`,
              borderRight: isRtl ? `4px solid ${stat.color}` : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: isRtl ? 'row-reverse' : 'row'
            }}
          >
            <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
              <div style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{stat.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#2a3142' }}>{stat.value}</div>
            </div>
            {stat.key === 'In Stock' && stats.totalCost > 0 && (
              <div style={{ fontSize: '12px', color: '#525f80', textAlign: isRtl ? 'left' : 'right' }}>
                {t('totalCost')}<br />
                <span style={{ fontWeight: 600, color: '#28aaa9' }}>{formatCurrency(stats.totalCost, locale)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #e5e5e5', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #28aaa9' : '2px solid transparent',
              color: activeTab === tab ? '#28aaa9' : '#525f80',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === t('inventoryTab') && (
        <>
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
                <span style={{ fontWeight: 600, color: '#28aaa9' }}>{selectedIds.size} {commonT('actions')}</span>
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
                  {['In Stock', 'Under Repair', 'Reserved', 'Sold', 'Rented'].map((s) => (
                    <option key={s} value={s}>
                      {statusT(s.replace(' ', '').charAt(0).toLowerCase() + s.replace(' ', '').slice(1))}
                    </option>
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
                  {commonT('delete')}
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

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <input
              type="text"
              placeholder={t('searchBrand')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: '160px',
                height: '40px',
                fontSize: '14px',
                borderRadius: '0',
                padding: '0 12px',
                border: '1px solid #ced4da',
                background: '#ffffff',
                textAlign: isRtl ? 'right' : 'left'
              }}
            />
            <input
              type="text"
              placeholder={t('searchModel')}
              value={modelFilter}
              onChange={(e) => {
                setModelFilter(e.target.value);
                setPage(1);
              }}
              style={{
                width: '160px',
                height: '40px',
                fontSize: '14px',
                borderRadius: '0',
                padding: '0 12px',
                border: '1px solid #ced4da',
                background: '#ffffff',
                textAlign: isRtl ? 'right' : 'left'
              }}
            />
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setPage(1);
              }}
              style={{
                width: '120px',
                height: '40px',
                fontSize: '14px',
                borderRadius: '0',
                padding: '0 12px',
                border: '1px solid #ced4da',
                background: '#ffffff',
                textAlign: isRtl ? 'right' : 'left'
              }}
            >
              <option value="">{commonT('year')}</option>
              {filterOptions.years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={colorFilter}
              onChange={(e) => {
                setColorFilter(e.target.value);
                setPage(1);
              }}
              style={{
                width: '120px',
                height: '40px',
                fontSize: '14px',
                borderRadius: '0',
                padding: '0 12px',
                border: '1px solid #ced4da',
                background: '#ffffff',
                textAlign: isRtl ? 'right' : 'left'
              }}
            >
              <option value="">{commonT('color')}</option>
              {filterOptions.colors.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                width: '140px',
                height: '40px',
                fontSize: '14px',
                borderRadius: '0',
                padding: '0 12px',
                border: '1px solid #ced4da',
                background: '#ffffff',
                textAlign: isRtl ? 'right' : 'left'
              }}
            >
              <option value="">{t('allStatuses')}</option>
              {['In Stock', 'Under Repair', 'Reserved', 'Sold', 'Rented'].map((s) => (
                <option key={s} value={s}>
                  {statusT(s.replace(' ', '').charAt(0).toLowerCase() + s.replace(' ', '').slice(1))}
                </option>
              ))}
            </select>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>
            ) : filteredCars.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{t('noCarsFound')}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '14px', minWidth: '900px', direction: isRtl ? 'rtl' : 'ltr' }}>
                  <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                    <tr>
                      <th style={{ padding: '12px', width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={cars.length > 0 && selectedIds.size === cars.length}
                          ref={(input) => {
                            if (input) {
                              input.indeterminate = selectedIds.size > 0 && selectedIds.size < cars.length;
                            }
                          }}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('image')}</th>
                      <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('id')}</th>
                      <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('brand')}</th>
                      <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('model')}</th>
                      <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('year')}</th>
                      <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('color')}</th>
                      <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('purchasePrice')}</th>
                      <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('repairCost')}</th>
                      <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('totalCost')}</th>
                      <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('status')}</th>
                      <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('actions')}</th>
                    </tr>
                  </thead>
                  <tbody style={{ borderBottom: '1px solid #eee' }}>
                    {filteredCars.map((car) => (
                        <tr key={car._id} style={{ borderBottom: '1px solid #f5f5f5', background: selectedIds.has(car._id) ? '#28aaa905' : 'transparent' }}>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(car._id)}
                              onChange={() => handleSelect(car._id)}
                            />
                          </td>
                          <td style={{ padding: '8px', width: '60px' }}>
                            {car.images?.[0] ? (
                              <img src={car.images[0]} alt={car.carId} style={{ width: '50px', height: '50px', objectFit: 'contain', background: '#f8f9fa', borderRadius: '4px' }} />
                            ) : (
                              <div style={{ width: '50px', height: '50px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '12px' }}>🚗</span>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 500, color: '#28aaa9' }}>
                            {car.carId}
                          </td>
                          <td style={{ padding: '12px' }}>{car.brand}</td>
                          <td style={{ padding: '12px' }}>{car.model}</td>
                          <td style={{ padding: '12px' }}>{car.year}</td>
                          <td style={{ padding: '12px' }}>{car.color}</td>
                          <td style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(car.purchase?.purchasePrice || 0, locale)}</td>
                          <td style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', color: car.totalRepairCost > 0 ? '#f5a623' : '#525f80' }}>
                            {car.totalRepairCost > 0 ? formatCurrency(car.totalRepairCost, locale) : '-'}
                          </td>
                          <td style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontWeight: 600, color: '#28aaa9' }}>
                            {formatCurrency((car.purchase?.purchasePrice || 0) + (car.totalRepairCost || 0), locale)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <StatusBadge status={car.status} />
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                              <Link href={`/dashboard/cars/${car._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>{commonT('view')}</Link>
                              <Link href={`/dashboard/cars/${car._id}/edit`} style={{ color: '#525f80', textDecoration: 'none' }}>{commonT('edit')}</Link>
                              <button
                                onClick={() => handleDelete(car._id)}
                                disabled={deleting === car._id}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ec4561',
                                  cursor: 'pointer',
                                  padding: 0,
                                  fontSize: '14px',
                                  opacity: deleting === car._id ? 0.5 : 1,
                                }}
                              >
                                {commonT('delete')}
                              </button>
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
        </>
      )}

      {activeTab === t('stockReportTab') && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {stockReport.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{t('stockReport.noCars')}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px', minWidth: '600px', direction: isRtl ? 'rtl' : 'ltr' }}>
                <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('brand')}</th>
                    <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('stockReport.count')}</th>
                    <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('stockReport.totalValue')}</th>
                    <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('stockReport.models')}</th>
                  </tr>
                </thead>
                <tbody style={{ borderBottom: '1px solid #eee' }}>
                  {stockReport.map((brand) => (
                    <tr key={brand.brand} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#2a3142' }}>{brand.brand}</td>
                      <td style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontWeight: 600 }}>{brand.count}</td>
                      <td style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', color: '#28aaa9', fontWeight: 500 }}>{formatCurrency(brand.value, locale)}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                          {(Object.entries(brand.models) as [string, number][]).map(([model, count]) => (
                            <span key={model} style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: '3px', fontSize: '12px' }}>
                              {model} ({count})
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      </div>
  );
}
