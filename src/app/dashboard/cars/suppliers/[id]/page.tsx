'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
  createdAt: string;
}

interface Purchase {
  _id: string;
  car: { _id: string; carId: string; brand: string; model: string; year: number };
  purchasePrice: number;
  purchaseDate: string;
  supplierContact?: string;
}

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stats, setStats] = useState({ totalPurchases: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await fetch(`/api/suppliers/${params.id}`);
        const data = await res.json();
        if (res.ok) {
          setSupplier(data.supplier);
          setPurchases(data.purchases || []);
          setStats(data.stats || { totalPurchases: 0, totalAmount: 0 });
        }
      } catch (error) {
        console.error('Failed to fetch supplier:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchSupplier();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      const res = await fetch(`/api/suppliers/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard/cars/suppliers');
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Loading...
      </div>
    );
  }

  if (!supplier) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Supplier not found
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {supplier.companyLogo ? (
              <img
                src={supplier.companyLogo}
                alt={supplier.companyName}
                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
              />
            ) : (
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 600, color: '#666' }}>
                {supplier.companyName.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="page-title" style={{ margin: 0 }}>{supplier.companyName}</h2>
              <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>{supplier.supplierId}</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            href={`/dashboard/cars/suppliers/${supplier._id}/edit`}
            style={{ padding: '8px 16px', background: '#ffc107', color: '#000', borderRadius: '6px', textDecoration: 'none', fontWeight: 500, fontSize: '14px' }}
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            style={{ padding: '8px 16px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}
          >
            Delete
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2b2d5d', marginBottom: '16px' }}>Company Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666', fontSize: '14px' }}>Company Number</span>
              <span style={{ fontWeight: 500, fontSize: '14px' }}>{supplier.companyNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666', fontSize: '14px' }}>Phone</span>
              <span style={{ fontWeight: 500, fontSize: '14px' }}>{supplier.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666', fontSize: '14px' }}>Email</span>
              <span style={{ fontWeight: 500, fontSize: '14px' }}>{supplier.email || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666', fontSize: '14px' }}>Address</span>
              <span style={{ fontWeight: 500, fontSize: '14px', textAlign: 'right', maxWidth: '150px' }}>{supplier.address || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666', fontSize: '14px' }}>Status</span>
              <span style={{
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500,
                background: supplier.status === 'active' ? '#d4edda' : '#f8d7da',
                color: supplier.status === 'active' ? '#155724' : '#721c24',
              }}>
                {supplier.status}
              </span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2b2d5d', marginBottom: '16px' }}>Sales Agent</h3>
          {supplier.salesAgent ? (
            <div style={{ display: 'flex', gap: '16px' }}>
              {supplier.salesAgent.photo ? (
                <img
                  src={supplier.salesAgent.photo}
                  alt={supplier.salesAgent.name}
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 600, color: '#666' }}>
                  {supplier.salesAgent.name.charAt(0)}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '15px' }}>{supplier.salesAgent.name}</p>
                {supplier.salesAgent.designation && (
                  <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#666' }}>{supplier.salesAgent.designation}</p>
                )}
                <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>{supplier.salesAgent.phone}</p>
                {supplier.salesAgent.email && (
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>{supplier.salesAgent.email}</p>
                )}
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>No sales agent assigned</p>
          )}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2b2d5d', marginBottom: '16px' }}>Purchase Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666', fontSize: '14px' }}>Total Purchases</span>
              <span style={{ fontWeight: 600, fontSize: '18px', color: '#28aaa9' }}>{stats.totalPurchases}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666', fontSize: '14px' }}>Total Amount</span>
              <span style={{ fontWeight: 600, fontSize: '18px', color: '#28aaa9' }}>${stats.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {supplier.notes && (
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2b2d5d', marginBottom: '12px' }}>Notes</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#666', whiteSpace: 'pre-wrap' }}>{supplier.notes}</p>
        </div>
      )}

      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2b2d5d', marginBottom: '16px' }}>Purchase History</h3>
        {purchases.length === 0 ? (
          <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>No purchases from this supplier</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#555' }}>Car</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#555' }}>Purchase Date</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#555' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr key={purchase._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <Link href={`/dashboard/cars/${purchase.car?._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>
                        {purchase.car?.carId} - {purchase.car?.brand} {purchase.car?.model} ({purchase.car?.year})
                      </Link>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600, textAlign: 'right', color: '#28aaa9' }}>
                      ${purchase.purchasePrice.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}