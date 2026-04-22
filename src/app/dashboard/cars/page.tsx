'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { CarStatus } from '@/types';
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
  status: CarStatus;
  images: string[];
  totalRepairCost: number;
  purchase?: Purchase;
  createdAt?: string;
}

const TABS = ['Inventory', 'Stock Report'] as const;
type Tab = typeof TABS[number];

function getDaysInStock(purchaseDate?: string, createdAt?: string): number {
  const date = purchaseDate || createdAt;
  if (!date) return 0;
  const start = new Date(date);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Inventory');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (search) params.set('brand', search);
    if (statusFilter) params.set('status', statusFilter);

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
  }, [page, search, statusFilter]);

  const fetchAllCars = useCallback(async () => {
    try {
      const res = await fetch('/api/cars?limit=1000');
      const data = await res.json();
      setAllCars(data.cars || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  useEffect(() => {
    fetchAllCars();
  }, [fetchAllCars]);

  const stats = useMemo(() => {
    const inStock = allCars.filter(c => c.status === 'In Stock').length;
    const sold = allCars.filter(c => c.status === 'Sold').length;
    const underRepair = allCars.filter(c => c.status === 'Under Repair').length;
    const rented = allCars.filter(c => c.status === 'Rented').length;
    const reserved = allCars.filter(c => c.status === 'Reserved').length;

    const totalPurchaseValue = allCars
      .filter(c => c.status === 'In Stock')
      .reduce((sum, c) => sum + (c.purchase?.purchasePrice || 0), 0);

    const totalRepairCost = allCars.reduce((sum, c) => sum + (c.totalRepairCost || 0), 0);

    const totalCost = allCars.filter(c => c.status === 'In Stock')
      .reduce((sum, c) => sum + (c.purchase?.purchasePrice || 0) + (c.totalRepairCost || 0), 0);

    return { inStock, sold, underRepair, rented, reserved, totalPurchaseValue, totalRepairCost, totalCost };
  }, [allCars]);

  const stockReport = useMemo(() => {
    const inStockCars = allCars.filter(c => c.status === 'In Stock');
    const byBrand: any = {};
    
    inStockCars.forEach(car => {
      if (!byBrand[car.brand]) {
        byBrand[car.brand] = { count: 0, value: 0, models: {} };
      }
      byBrand[car.brand].count++;
      byBrand[car.brand].value += car.purchase?.purchasePrice || 0;
      byBrand[car.brand].models[car.model] = (byBrand[car.brand].models[car.model] || 0) + 1;
    });

    return Object.entries(byBrand)
      .map(([brand, data]: [string, any]) => ({ brand, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [allCars]);

  const filteredCars = useMemo(() => {
    let result = cars;
    if (statusFilter) {
      result = result.filter(c => c.status === statusFilter);
    }
    return result;
  }, [cars, statusFilter]);

  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <h2 className="page-title">Car Inventory</h2>
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
          + Add New Car
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'In Stock', value: stats.inStock, color: '#28aaa9' },
          { label: 'Sold', value: stats.sold, color: '#42ca7f' },
          { label: 'Under Repair', value: stats.underRepair, color: '#f5a623' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card"
            style={{
              padding: '16px',
              borderLeft: `4px solid ${stat.color}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{stat.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#2a3142' }}>{stat.value}</div>
            </div>
            {stat.label === 'In Stock' && stats.totalCost > 0 && (
              <div style={{ fontSize: '12px', color: '#525f80', textAlign: 'right' }}>
                Total Cost<br />
                <span style={{ fontWeight: 600, color: '#28aaa9' }}>{formatCurrency(stats.totalCost)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #e5e5e5' }}>
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

      {activeTab === 'Inventory' && (
        <>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Search by brand..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
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
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                height: '40px',
                fontSize: '14px',
                borderRadius: '0',
                padding: '0 12px',
                border: '1px solid #ced4da',
                background: '#ffffff',
              }}
            >
              <option value="">All Statuses</option>
              {['In Stock', 'Under Repair', 'Reserved', 'Sold', 'Rented'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
            ) : filteredCars.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No cars found.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '14px', minWidth: '900px' }}>
                  <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                    <tr>
                      {['Image', 'Car ID', 'Brand', 'Model', 'Year', 'Color', 'Purchase Price', 'Repair Cost', 'Total Cost', 'Status', 'Actions'].map((h) => (
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
                    {filteredCars.map((car) => (
                        <tr key={car._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '8px', width: '60px' }}>
                            {car.images?.[0] ? (
                              <img src={car.images[0]} alt={car.carId} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                            ) : (
                              <div style={{ width: '50px', height: '50px', background: '#f0f0f0', borderRadius: '4px' }} />
                            )}
                          </td>
                          <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 500, color: '#28aaa9' }}>
                            {car.carId}
                          </td>
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
                          <td style={{ padding: '12px' }}>
                            <StatusBadge status={car.status} />
                          </td>
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
        </>
      )}

      {activeTab === 'Stock Report' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {stockReport.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No cars in stock.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px', minWidth: '600px' }}>
                <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>Brand</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>Count</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>Total Value</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>Models</th>
                  </tr>
                </thead>
                <tbody style={{ borderBottom: '1px solid #eee' }}>
                  {stockReport.map((brand) => (
                    <tr key={brand.brand} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#2a3142' }}>{brand.brand}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{brand.count}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#28aaa9', fontWeight: 500 }}>{formatCurrency(brand.value)}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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