'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/constants/currency';
import DataTransferButtons from '@/components/DataTransferButtons';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import { PrintColumn, ActiveFilterItem, SummaryStatItem } from '@/lib/printUtils';
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
  status: string;
  images: string[];
  totalRepairCost: number;
  purchase?: Purchase;
  createdAt?: string;
  plateNumber?: string;
  sequenceNumber?: string;
  chassisNumber?: string;
}

interface StockStats {
  count: number;
  inStock: number;
  underRepair: number;
  reserved: number;
  totalPurchase: number;
  totalRepair: number;
}

export default function StockPage() {
  const commonT = useTranslations('Common');
  const statusT = useTranslations('Status');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  const [statusFilter, setStatusFilter] = useState<string[]>(['In Stock', 'Under Repair']);
  const [modelFilter, setModelFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  
  const [filterOptions, setFilterOptions] = useState<{ years: number[]; models: string[] }>({ years: [], models: [] });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<StockStats>({ count: 0, inStock: 0, underRepair: 0, reserved: 0, totalPurchase: 0, totalRepair: 0 });

  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/cars', { method: 'OPTIONS' });
      const data = await res.json();
      setFilterOptions({
        years: data.years || [],
        models: data.models || [],
      });
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    
    const params = new URLSearchParams({ limit: '15', page: page.toString() });
    
    if (debouncedSearch) params.set('brand', debouncedSearch);
    if (statusFilter.length > 0) params.set('status', statusFilter.join(','));
    if (modelFilter) params.set('model', modelFilter);
    if (yearFilter) params.set('year', yearFilter);

    fetch(`/api/cars?${params}`)
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        setCars(data.cars || []);
        setTotalPages(data.pagination?.pages || 1);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, debouncedSearch, statusFilter, modelFilter, yearFilter]);

  useEffect(() => {
    fetch('/api/cars/stats')
      .then(res => res.json())
      .then(data => {
        setStats({
          count: (data.statusCounts?.inStock || 0) + (data.statusCounts?.underRepair || 0) + (data.statusCounts?.reserved || 0),
          inStock: data.statusCounts?.inStock || 0,
          underRepair: data.statusCounts?.underRepair || 0,
          reserved: data.statusCounts?.reserved || 0,
          totalPurchase: (data.inStockStats?.totalPurchaseValue || 0), // Adjust if needed
          totalRepair: (data.inStockStats?.totalRepairCost || 0),
        });
      })
      .catch(console.error);
  }, []);

  const stockPrintColumns: PrintColumn[] = [
    { header: 'SL', getter: (_, i) => String((page - 1) * 15 + i + 1), align: 'center' },
    { header: 'CAR NO', getter: (c: Car) => c.plateNumber || 'NO PLATE', align: 'center' },
    { header: 'الماركة', getter: (c: Car) => c.brand },
    { header: 'MODEL', getter: (c: Car) => c.model },
    { header: 'YEAR', getter: (c: Car) => String(c.year), align: 'center' },
    { header: 'SERIAL NO', getter: (c: Car) => c.sequenceNumber || '-' },
    { header: 'CHASSIS NO', getter: (c: Car) => c.chassisNumber || '-' },
    { header: 'REMARK', getter: (c: Car) => statusT(c.status.replace(/\s+/g, '').charAt(0).toLowerCase() + c.status.replace(/\s+/g, '').slice(1)) || c.status },
  ];

  const activeFiltersList: ActiveFilterItem[] = [];
  if (statusFilter.length > 0) {
    activeFiltersList.push({
      label: commonT('status') || 'Status',
      value: statusFilter.join(', '),
    });
  }
  if (modelFilter) activeFiltersList.push({ label: commonT('model') || 'Model', value: modelFilter });
  if (yearFilter) activeFiltersList.push({ label: commonT('year') || 'Year', value: yearFilter });
  if (debouncedSearch) activeFiltersList.push({ label: commonT('search') || 'Search', value: debouncedSearch });

  const printSummaryStats: SummaryStatItem[] = [
    { label: statusT('inStock') || 'In Stock', value: stats.inStock, color: '#28aaa9' },
    { label: statusT('underRepair') || 'Under Repair', value: stats.underRepair, color: '#f5a623' },
    { label: statusT('reserved') || 'Reserved', value: stats.reserved, color: '#38a4f8' },
    { label: 'Total Purchase', value: formatCurrency(stats.totalPurchase), color: '#42ca7f' },
    { label: 'Total Repair', value: formatCurrency(stats.totalRepair), color: '#ec4561' },
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <h2 className="page-title">ALL STOCK LIST</h2>
        <DataTransferButtons
          entityType="cars"
          title="ALL STOCK LIST"
          filters={{
            status: statusFilter.join(','),
            model: modelFilter,
            year: yearFilter,
            brand: debouncedSearch,
          }}
          columns={stockPrintColumns}
          data={cars}
          activeFiltersList={activeFiltersList}
          summaryStats={printSummaryStats}
          onImportSuccess={() => setPage(1)} // Just re-trigger fetch
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: statusT('inStock'), value: stats.inStock, color: '#28aaa9' },
          { label: statusT('underRepair'), value: stats.underRepair, color: '#f5a623' },
          { label: statusT('reserved'), value: stats.reserved, color: '#38a4f8' },
          { label: 'Purchase Value', value: formatCurrency(stats.totalPurchase), color: '#42ca7f' },
          { label: 'Total Cost', value: formatCurrency(stats.totalPurchase + stats.totalRepair), color: '#ec4561' },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : `4px solid ${stat.color}`, borderRight: isRtl ? `4px solid ${stat.color}` : 'none' }}>
            <div style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{stat.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <input
          type="text"
          placeholder={commonT('search') || "Search by brand..."}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            width: '250px',
            height: '40px',
            fontSize: '14px',
            borderRadius: '0',
            padding: '0 12px',
            border: '1px solid #ced4da',
            background: '#ffffff',
            textAlign: isRtl ? 'right' : 'left'
          }}
        />
        
        <MultiSelectFilter
          placeholder={commonT('status') || 'Status'}
          selectedValues={statusFilter}
          onChange={(vals) => { setStatusFilter(vals); setPage(1); }}
          options={[
            { value: 'In Stock', label: statusT('inStock'), color: '#28aaa9' },
            { value: 'Under Repair', label: statusT('underRepair'), color: '#f5a623' },
            { value: 'Reserved', label: statusT('reserved'), color: '#38a4f8' },
          ]}
        />

        <select
          value={modelFilter}
          onChange={(e) => { setModelFilter(e.target.value); setPage(1); }}
          style={{ height: '40px', padding: '0 12px', fontSize: '14px', borderRadius: '3px', border: '1px solid #ced4da', background: '#ffffff', minWidth: '150px' }}
        >
          <option value="">{commonT('all') || 'All'} Models</option>
          {filterOptions.models.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={yearFilter}
          onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
          style={{ height: '40px', padding: '0 12px', fontSize: '14px', borderRadius: '3px', border: '1px solid #ced4da', background: '#ffffff', minWidth: '100px' }}
        >
          <option value="">{commonT('all') || 'All'} Years</option>
          {filterOptions.years.map(y => (
            <option key={y} value={y.toString()}>{y}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading') || 'Loading...'}</div>
        ) : cars.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No cars in stock.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '1000px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>SL</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>CAR NO</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>الماركة</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>MODEL</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>YEAR</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>SERIAL NO</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>CHASSIS NO</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>REMARK</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>{commonT('actions') || 'ACTIONS'}</th>
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #eee' }}>
                {cars.map((car, index) => (
                  <tr key={car._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#525f80' }}>
                      {(page - 1) * 15 + index + 1}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: car.plateNumber ? '#2a3142' : '#dc3545' }}>
                      {car.plateNumber || 'NO PLATE'}
                    </td>
                    <td style={{ padding: '12px' }}>{car.brand}</td>
                    <td style={{ padding: '12px' }}>{car.model}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{car.year}</td>
                    <td style={{ padding: '12px' }}>{car.sequenceNumber || '-'}</td>
                    <td style={{ padding: '12px' }}>{car.chassisNumber || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <StatusBadge status={car.status as any} />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <Link href={`/dashboard/cars/${car._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>{commonT('view') || 'View'}</Link>
                        <Link href={`/dashboard/cars/${car._id}/edit`} style={{ color: '#525f80', textDecoration: 'none' }}>{commonT('edit') || 'Edit'}</Link>
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
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>{commonT('prev') || 'Prev'}</button>
          <span style={{ padding: '8px 12px', fontSize: '12px', color: '#525f80' }}>{commonT('page', { page: page, total: totalPages }) || `Page ${page} of ${totalPages}`}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>{commonT('next') || 'Next'}</button>
        </div>
      )}
    </div>
  );
}
