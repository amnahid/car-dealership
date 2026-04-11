'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Rental {
  _id: string;
  rentalId: string;
  carId: string;
  customerName: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
  totalAmount: number;
  securityDeposit: number;
  status: string;
  returnDate?: string;
  actualReturnDate?: string;
  notes?: string;
}

export default function RentalDetailPage() {
  const params = useParams();
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    fetch(`/api/sales/rentals/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Rental not found');
        return res.json();
      })
      .then((data) => {
        setRental(data.rental);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load rental');
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>;
  }

  if (error || !rental) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ec4561' }}>
        {error || 'Rental not found'}
        <div style={{ marginTop: '16px' }}>
          <Link href="/dashboard/sales/rentals" style={{ color: '#28aaa9' }}>← Back to Rentals</Link>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    Active: '#28aaa9',
    Completed: '#42ca7f',
    Cancelled: '#ec4561',
  };

  const rentalDays = Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/sales/rentals" style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Rentals
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title">Rental Details</h2>
        <span
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            background: statusColors[rental.status] || '#28aaa9',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {rental.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Rental Information</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Rental ID</span>
              <span style={{ color: '#28aaa9', fontWeight: 600, fontFamily: 'monospace' }}>{rental.rentalId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Car ID</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{rental.carId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Duration</span>
              <span style={{ color: '#2a3142' }}>{rentalDays} days</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Customer Information</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Name</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{rental.customerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Phone</span>
              <span style={{ color: '#2a3142' }}>{rental.customerPhone}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Rental Period</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Start Date</span>
              <span style={{ color: '#2a3142' }}>{new Date(rental.startDate).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>End Date</span>
              <span style={{ color: '#2a3142' }}>{new Date(rental.endDate).toLocaleDateString()}</span>
            </div>
            {rental.actualReturnDate && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>Actual Return</span>
                <span style={{ color: '#2a3142' }}>{new Date(rental.actualReturnDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Payment Details</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Daily Rate</span>
              <span style={{ color: '#2a3142' }}>${rental.dailyRate.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Security Deposit</span>
              <span style={{ color: '#2a3142' }}>${rental.securityDeposit.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <span style={{ color: '#2a3142', fontWeight: 600 }}>Total Amount</span>
              <span style={{ color: '#28aaa9', fontWeight: 700, fontSize: '18px' }}>${rental.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {rental.notes && (
          <div className="card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Notes</h3>
            <p style={{ color: '#525f80', margin: 0 }}>{rental.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}