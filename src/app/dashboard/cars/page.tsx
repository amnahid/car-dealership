'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { CarStatus } from '@/types';

interface Purchase {
  supplierName: string;
  purchasePrice: number;
}

interface Car {
  _id: string;
  carId: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  status: CarStatus;
  purchase?: Purchase;
}

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

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

      <div
        className="card"
        style={{ padding: 0, overflow: 'hidden' }}
      >
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
        ) : cars.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No cars found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '800px' }}>
            <thead
              style={{
                background: '#f8f9fa',
                borderBottom: '1px solid #eee',
              }}
            >
              <tr>
                {['Car ID', 'Brand', 'Model', 'Year', 'Color', 'Supplier', 'Purchase Price', 'Status', 'Actions'].map(
                  (h) => (
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
                  )
                )}
              </tr>
            </thead>
            <tbody style={{ borderBottom: '1px solid #eee' }}>
              {cars.map((car) => (
                <tr
                  key={car._id}
                  style={{
                    borderBottom: '1px solid #f5f5f5',
                  }}
                >
                  <td
                    style={{
                      padding: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 500,
                      color: '#28aaa9',
                    }}
                  >
                    {car.carId}
                  </td>
                  <td style={{ padding: '12px' }}>{car.brand}</td>
                  <td style={{ padding: '12px' }}>{car.model}</td>
                  <td style={{ padding: '12px' }}>{car.year}</td>
                  <td style={{ padding: '12px' }}>{car.color}</td>
                  <td style={{ padding: '12px', color: '#525f80' }}>{car.purchase?.supplierName || '-'}</td>
                  <td style={{ padding: '12px' }}>${car.purchase?.purchasePrice?.toLocaleString() || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <StatusBadge status={car.status} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Link
                        href={`/dashboard/cars/${car._id}`}
                        style={{ color: '#28aaa9', textDecoration: 'none' }}
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/cars/${car._id}/edit`}
                        style={{ color: '#525f80', textDecoration: 'none' }}
                      >
                        Edit
                      </Link>
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
          <span
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              color: '#525f80',
            }}
          >
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