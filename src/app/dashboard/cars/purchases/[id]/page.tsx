'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Car {
  _id: string;
  carId: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  engineNumber: string;
  chassisNumber: string;
}

interface Supplier {
  _id: string;
  companyName: string;
  supplierId: string;
  phone: string;
  email: string;
  address: string;
}

interface Purchase {
  _id: string;
  car: Car;
  supplier?: Supplier;
  supplierName: string;
  supplierContact: string;
  purchasePrice: number;
  purchaseDate: string;
  isNewCar: boolean;
  conditionImages: string[];
  insuranceUrl?: string;
  insuranceExpiry?: string;
  registrationUrl?: string;
  registrationExpiry?: string;
  roadPermitUrl?: string;
  roadPermitExpiry?: string;
  documentUrl?: string;
  notes?: string;
  createdBy: { name: string; email: string };
  createdAt: string;
}

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPurchase();
    }
  }, [params.id]);

  const handleDelete = async () => {
    const confirmDelete = confirm('Are you sure you want to delete this purchase?');
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/cars/purchases/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard/cars/purchases');
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete purchase');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setDeleting(false);
    }
  };

  const fetchPurchase = async () => {
    try {
      const res = await fetch(`/api/cars/purchases/${params.id}`);
      const data = await res.json();
      if (res.ok) {
        setPurchase(data.purchase);
      } else {
        setError(data.error || 'Failed to fetch purchase');
      }
    } catch {
      setError('Failed to fetch purchase');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount || 0);
  };

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    maxWidth: '1000px',
    margin: '0 auto',
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

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#666',
    marginBottom: '4px',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '15px',
    color: '#333',
    fontWeight: 500,
  };

  const badgeStyle = (isNew: boolean): React.CSSProperties => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500,
    background: isNew ? '#d4edda' : '#fff3cd',
    color: isNew ? '#155724' : '#856404',
  });

  if (loading) {
    return <div style={{ ...containerStyle, textAlign: 'center' }}>Loading...</div>;
  }

  if (error || !purchase) {
    return <div style={{ ...containerStyle, textAlign: 'center', color: '#dc3545' }}>{error || 'Purchase not found'}</div>;
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <Link href="/dashboard/cars/purchases" style={{ fontSize: '14px', color: '#28aaa9', textDecoration: 'none' }}>
            ← Back to Purchases
          </Link>
          <h1 style={titleStyle}>Purchase Details</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            href={`/dashboard/cars/purchases/${purchase._id}/edit`}
            style={{
              padding: '10px 20px',
              background: '#28aaa9',
              color: '#fff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Edit Purchase
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              background: '#ec4561',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: deleting ? 'not-allowed' : 'pointer',
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? 'Deleting...' : 'Delete Purchase'}
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
          Purchase Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div>
            <p style={labelStyle}>Car</p>
            <Link href={`/dashboard/cars/${purchase.car?._id}`} style={{ ...valueStyle, color: '#28aaa9', textDecoration: 'none' }}>
              {purchase.car?.carId} - {purchase.car?.brand} {purchase.car?.model}
            </Link>
            <p style={{ fontSize: '13px', color: '#666' }}>{purchase.car?.year} • {purchase.car?.color}</p>
          </div>
          <div>
            <p style={labelStyle}>Supplier</p>
            {purchase.supplier ? (
              <Link href={`/dashboard/cars/suppliers/${purchase.supplier._id}`} style={{ ...valueStyle, color: '#28aaa9', textDecoration: 'none' }}>
                {purchase.supplier.companyName}
              </Link>
            ) : (
              <p style={valueStyle}>{purchase.supplierName || '-'}</p>
            )}
          </div>
          <div>
            <p style={labelStyle}>Car Type</p>
            <span style={badgeStyle(purchase.isNewCar)}>{purchase.isNewCar ? 'New Car' : 'Used Car'}</span>
          </div>
          <div>
            <p style={labelStyle}>Purchase Price</p>
            <p style={{ ...valueStyle, color: '#28aaa9', fontSize: '18px' }}>{formatCurrency(purchase.purchasePrice)}</p>
          </div>
          <div>
            <p style={labelStyle}>Purchase Date</p>
            <p style={valueStyle}>{new Date(purchase.purchaseDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p style={labelStyle}>Supplier Contact</p>
            <p style={valueStyle}>{purchase.supplierContact || '-'}</p>
          </div>
        </div>
      </div>

      {(purchase.conditionImages?.length > 0 || purchase.insuranceUrl || purchase.registrationUrl || purchase.roadPermitUrl) && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
            Documents & Images
          </h3>
          
          {purchase.conditionImages?.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p style={labelStyle}>Condition Images ({purchase.conditionImages.length})</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {purchase.conditionImages.map((img, i) => (
                  <img key={i} src={img} alt={`Condition ${i + 1}`} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px' }} />
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {purchase.insuranceUrl && (
              <div>
                <p style={labelStyle}>Insurance</p>
                <a href={purchase.insuranceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', textDecoration: 'none' }}>
                  View Document
                </a>
                {purchase.insuranceExpiry && (
                  <p style={{ fontSize: '12px', color: '#666' }}>Exp: {new Date(purchase.insuranceExpiry).toLocaleDateString()}</p>
                )}
              </div>
            )}
            {purchase.registrationUrl && (
              <div>
                <p style={labelStyle}>Registration</p>
                <a href={purchase.registrationUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', textDecoration: 'none' }}>
                  View Document
                </a>
                {purchase.registrationExpiry && (
                  <p style={{ fontSize: '12px', color: '#666' }}>Exp: {new Date(purchase.registrationExpiry).toLocaleDateString()}</p>
                )}
              </div>
            )}
            {purchase.roadPermitUrl && (
              <div>
                <p style={labelStyle}>Road Permit</p>
                <a href={purchase.roadPermitUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', textDecoration: 'none' }}>
                  View Document
                </a>
                {purchase.roadPermitExpiry && (
                  <p style={{ fontSize: '12px', color: '#666' }}>Exp: {new Date(purchase.roadPermitExpiry).toLocaleDateString()}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {purchase.notes && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Notes</h3>
          <p style={{ fontSize: '14px', color: '#555' }}>{purchase.notes}</p>
        </div>
      )}

      <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '20px' }}>
        Created by {purchase.createdBy?.name || 'Unknown'} • {new Date(purchase.createdAt).toLocaleString()}
      </div>
    </div>
  );
}