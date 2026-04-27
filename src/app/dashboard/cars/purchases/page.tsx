'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Car {
  _id: string;
  carId: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  images: string[];
}

interface Supplier {
  _id: string;
  companyName: string;
  supplierId: string;
  phone: string;
}

interface Purchase {
  _id: string;
  car: Car;
  supplier: Supplier;
  supplierName: string;
  supplierContact: string;
  purchasePrice: number;
  purchaseDate: string;
  isNewCar: boolean;
  conditionImages: string[];
}

export default function PurchasesPage() {
  const searchParams = useSearchParams();
  const carId = searchParams.get('carId');
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCarId, setFilterCarId] = useState(carId || '');

  useEffect(() => {
    fetchPurchases();
  }, [filterCarId]);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCarId) params.set('carId', filterCarId);
      
      const res = await fetch(`/api/cars/purchases?${params}`);
      const data = await res.json();
      if (res.ok) {
        setPurchases(data.purchases);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount || 0);
  };

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    overflowX: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#2b2d5d',
    margin: 0,
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
  };

  const thStyle: React.CSSProperties = {
    padding: '12px',
    textAlign: 'left',
    background: '#f8f9fa',
    fontWeight: 600,
    fontSize: '13px',
    color: '#555',
    borderBottom: '2px solid #e9ecef',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px',
    fontSize: '14px',
    color: '#333',
    borderBottom: '1px solid #eee',
  };

  const badgeStyle = (isNew: boolean): React.CSSProperties => ({
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    background: isNew ? '#d4edda' : '#fff3cd',
    color: isNew ? '#155724' : '#856404',
  });

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 className="page-title" style={titleStyle}>Car Purchases</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Filter by Car ID..."
            value={filterCarId}
            onChange={(e) => setFilterCarId(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1px solid #ced4da',
              borderRadius: '3px',
              fontSize: '14px',
              width: '200px',
              height: '40px',
            }}
          />
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
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>{error}</div>
      ) : purchases.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No purchases found.</div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '80px' }}>Image</th>
              <th style={thStyle}>Car</th>
              <th style={thStyle}>Supplier</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Price</th>
              <th style={thStyle}>Purchase Date</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase._id} style={{ background: '#fff' }}>
                <td style={{ ...tdStyle, width: '80px' }}>
                  {purchase.car?.images?.[0] ? (
                    <img src={purchase.car.images[0]} alt={purchase.car.brand} style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ width: '60px', height: '45px', background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999' }}>No Image</div>
                  )}
                </td>
                <td style={tdStyle}>
                  <Link href={`/dashboard/cars/${purchase.car?._id}`} style={{ color: '#28aaa9', textDecoration: 'none', fontWeight: 500 }}>
                    {purchase.car?.carId} - {purchase.car?.brand} {purchase.car?.model}
                  </Link>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                    {purchase.car?.year} • {purchase.car?.color}
                  </div>
                </td>
                <td style={tdStyle}>
                  {purchase.supplier ? (
                    <Link href={`/dashboard/cars/suppliers/${purchase.supplier._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>
                      {purchase.supplier.companyName}
                    </Link>
                  ) : (
                    purchase.supplierName || '-'
                  )}
                </td>
                <td style={tdStyle}>
                  <span style={badgeStyle(purchase.isNewCar)}>
                    {purchase.isNewCar ? 'New' : 'Used'}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#28aaa9' }}>
                  {formatCurrency(purchase.purchasePrice)}
                </td>
                <td style={tdStyle}>
                  {new Date(purchase.purchaseDate).toLocaleDateString()}
                </td>
                <td style={tdStyle}>
                  <Link href={`/dashboard/cars/purchases/${purchase._id}`} style={{ marginRight: '12px', color: '#28aaa9', textDecoration: 'none' }}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}