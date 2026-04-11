'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Payment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: string;
  paidDate?: string;
  paidAmount?: number;
}

interface Sale {
  _id: string;
  saleId: string;
  carId: string;
  customerName: string;
  customerPhone: string;
  totalPrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  interestRate: number;
  tenureMonths: number;
  startDate: string;
  paymentSchedule: Payment[];
  nextPaymentDate: string;
  nextPaymentAmount: number;
  totalPaid: number;
  remainingAmount: number;
  status: string;
  notes?: string;
}

export default function InstallmentSaleDetailPage() {
  const params = useParams();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    fetch(`/api/sales/installments/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Sale not found');
        return res.json();
      })
      .then((data) => {
        setSale(data.sale);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load sale');
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>;
  }

  if (error || !sale) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ec4561' }}>
        {error || 'Sale not found'}
        <div style={{ marginTop: '16px' }}>
          <Link href="/dashboard/sales/installments" style={{ color: '#28aaa9' }}>← Back to Installment Sales</Link>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    Active: '#28aaa9',
    Completed: '#42ca7f',
    Defaulted: '#ec4561',
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/sales/installments" style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Installment Sales
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title">Installment Sale Details</h2>
        <span
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            background: statusColors[sale.status] || '#28aaa9',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {sale.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Sale Information</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Sale ID</span>
              <span style={{ color: '#28aaa9', fontWeight: 600, fontFamily: 'monospace' }}>{sale.saleId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Start Date</span>
              <span style={{ color: '#2a3142' }}>{new Date(sale.startDate).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Car ID</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{sale.carId}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Customer Information</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Name</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{sale.customerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Phone</span>
              <span style={{ color: '#2a3142' }}>{sale.customerPhone}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Payment Details</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Total Price</span>
              <span style={{ color: '#2a3142' }}>${sale.totalPrice.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Down Payment</span>
              <span style={{ color: '#2a3142' }}>${sale.downPayment.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Loan Amount</span>
              <span style={{ color: '#2a3142' }}>${sale.loanAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Interest Rate</span>
              <span style={{ color: '#2a3142' }}>{sale.interestRate}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Tenure</span>
              <span style={{ color: '#2a3142' }}>{sale.tenureMonths} months</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Payment Summary</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Monthly Payment</span>
              <span style={{ color: '#28aaa9', fontWeight: 600 }}>${sale.monthlyPayment.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Total Paid</span>
              <span style={{ color: '#42ca7f', fontWeight: 600 }}>${sale.totalPaid.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Remaining</span>
              <span style={{ color: '#ec4561', fontWeight: 600 }}>${sale.remainingAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Next Payment</span>
              <span style={{ color: '#2a3142' }}>${sale.nextPaymentAmount.toLocaleString()} ({new Date(sale.nextPaymentDate).toLocaleDateString()})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Payment Schedule</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '14px', minWidth: '600px' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>#</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>Due Date</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {(sale.paymentSchedule || []).map((payment) => {
                const statusColor = payment.status === 'Paid' ? '#42ca7f' : payment.status === 'Overdue' ? '#ec4561' : '#f8b425';
                return (
                  <tr key={payment.installmentNumber} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px' }}>{payment.installmentNumber}</td>
                    <td style={{ padding: '12px' }}>{new Date(payment.dueDate).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>${payment.amount.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', background: statusColor, color: '#ffffff', fontSize: '12px' }}>
                        {payment.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#9ca8b3' }}>
                      {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sale.notes && (
        <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Notes</h3>
          <p style={{ color: '#525f80', margin: 0 }}>{sale.notes}</p>
        </div>
      )}
    </div>
  );
}