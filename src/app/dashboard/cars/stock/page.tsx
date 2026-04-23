'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/constants/currency';

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
}

interface StockStats {
  count: number;
  totalPurchase: number;
  totalRepair: number;
}

export default function StockPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<StockStats>({ count: 0, totalPurchase: 0, totalRepair: 0 });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '15', status: 'In Stock', page: page.toString() });
    if (debouncedSearch) params.set('brand', debouncedSearch);

    fetch(`/api/cars?${params}`)
      .then(res => res.json())
      .then(data => {
        setCars(data.cars || []);
        setTotalPages(data.pagination?.pages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetch('/api/cars/stats')
      .then(res => res.json())
      .then(data => {
        setStats({
          count: data.statusCounts?.inStock || 0,
          totalPurchase: data.inStockStats?.totalPurchaseValue || 0,
          totalRepair: data.inStockStats?.totalRepairCost || 0,
        });
      })
      .catch(console.error);
  }, []);

  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 className="page-title" style={{ marginBottom: '24px' }}>Stock Management</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #28aaa9' }}>
          <div style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Total In Stock</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#2a3142' }}>{stats.count}</div>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #42ca7f' }}>
          <div style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Purchase Value</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#2a3142' }}>{formatCurrency(stats.totalPurchase)}</div>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f5a623' }}>
          <div style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Total Cost</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#2a3142' }}>{formatCurrency(stats.totalPurchase + stats.totalRepair)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search by brand..."
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
          }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
        ) : cars.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No cars in stock.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '900px' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  {['Image', 'Car ID', 'Brand', 'Model', 'Year', 'Color', 'Purchase Price', 'Repair Cost', 'Total Cost', 'Supplier', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #eee' }}>
                {cars.map((car) => (
                  <tr key={car._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '8px', width: '60px' }}>
                      {car.images?.[0] ? (
                        <img src={car.images[0]} alt={car.carId} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (
                        <div style={{ width: '50px', height: '50px', background: '#f0f0f0', borderRadius: '4px' }} />
                      )}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 500, color: '#28aaa9' }}>{car.carId}</td>
                    <td style={{ padding: '12px' }}>{car.brand}</td>
                    <td style={{ padding: '12px' }}>{car.model}</td>
                    <td style={{ padding: '12px' }}>{car.year}</td>
                    <td style={{ padding: '12px' }}>{car.color}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(car.purchase?.purchasePrice || 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: car.totalRepairCost > 0 ? '#f5a623' : '#525f80' }}>
                      {car.totalRepairCost > 0 ? formatCurrency(car.totalRepairCost) : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#28aaa9' }}>
                      {formatCurrency((car.purchase?.purchasePrice || 0) + (car.totalRepairCost || 0))}
                    </td>
                    <td style={{ padding: '12px', color: '#525f80' }}>{car.purchase?.supplierName || '-'}</td>
                    <td style={{ padding: '12px' }}><StatusBadge status={car.status as any} /></td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <Link href={`/dashboard/cars/${car._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>View</Link>
                        <Link href={`/dashboard/cars/${car._id}/edit`} style={{ color: '#525f80', textDecoration: 'none' }}>Edit</Link>
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
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>Prev</button>
          <span style={{ padding: '8px 12px', fontSize: '12px', color: '#525f80' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>Next</button>
        </div>
      )}
    </div>
  );
}
