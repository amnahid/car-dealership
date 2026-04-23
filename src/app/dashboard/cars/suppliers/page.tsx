'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  const fetchSuppliers = async (page = 1, searchVal = debouncedSearch, status = statusFilter) => {
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
  };

  useEffect(() => {
    fetchSuppliers();
  }, [searchParams.get('page'), searchParams.get('status')]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    router.push(`/dashboard/cars/suppliers?${params.toString()}`);
    fetchSuppliers(1, search, statusFilter);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    router.push(`/dashboard/cars/suppliers?${params.toString()}`);
    fetchSuppliers(1, search, status);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSuppliers(pagination.page, search, statusFilter);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const formatCurrency = (value: number) => value.toLocaleString();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title" style={{ margin: 0 }}>Suppliers</h2>
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
          + Add Supplier
        </Link>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '10px 14px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '14px',
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
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
            Search
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#555' }}>Company</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#555' }}>Company No.</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#555' }}>Contact</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#555' }}>Sales Agent</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#555' }}>Purchases</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#555' }}>Total Amount</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#555' }}>Status</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, fontSize: '14px', color: '#555' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading...</td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No suppliers found</td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                        <div>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {supplier.salesAgent.photo ? (
                            <img src={supplier.salesAgent.photo} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#666' }}>
                              {supplier.salesAgent.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: '13px' }}>{supplier.salesAgent.name}</p>
                            {supplier.salesAgent.designation && <p style={{ margin: 0, fontSize: '11px', color: '#999' }}>{supplier.salesAgent.designation}</p>}
                          </div>
                        </div>
                      ) : <span style={{ color: '#999' }}>-</span>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500 }}>{supplier.totalPurchases}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500, color: '#28aaa9' }}>${formatCurrency(supplier.totalAmount)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: supplier.status === 'active' ? '#d4edda' : '#f8d7da',
                        color: supplier.status === 'active' ? '#155724' : '#721c24',
                      }}>
                        {supplier.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Link
                          href={`/dashboard/cars/suppliers/${supplier._id}`}
                          style={{ padding: '6px 12px', background: '#e9ecef', borderRadius: '4px', fontSize: '12px', color: '#555', textDecoration: 'none' }}
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/cars/suppliers/${supplier._id}/edit`}
                          style={{ padding: '6px 12px', background: '#fff3cd', borderRadius: '4px', fontSize: '12px', color: '#856404', textDecoration: 'none' }}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(supplier._id)}
                          style={{ padding: '6px 12px', background: '#f8d7da', borderRadius: '4px', fontSize: '12px', color: '#721c24', border: 'none', cursor: 'pointer' }}
                        >
                          Delete
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
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} suppliers
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', (pagination.page - 1).toString());
                  router.push(`/dashboard/cars/suppliers?${params.toString()}`);
                }}
                style={{ padding: '8px 14px', border: '1px solid #ddd', background: '#fff', borderRadius: '4px', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', opacity: pagination.page <= 1 ? 0.5 : 1 }}
              >
                Previous
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
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}