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
  lateFee?: number;
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
  vatRate?: number;
  vatAmount?: number;
  finalPriceWithVat?: number;
  monthlyLateFee?: number;
  lateFeeCharged?: number;
  agreementDocument?: string;
  agreementUrl?: string;
  invoiceUrl?: string;
  invoiceType?: 'Standard' | 'Simplified';
  zatcaStatus?: 'Pending' | 'Cleared' | 'Reported' | 'Failed' | 'NotRequired';
  zatcaUUID?: string;
  zatcaErrorMessage?: string;
  zatcaQRCode?: string;
  zatcaHash?: string;
  tafweedStatus?: 'Active' | 'Expired';
  tafweedAuthorizedTo?: string;
  tafweedDriverIqama?: string;
  tafweedDurationMonths?: number;
  tafweedExpiryDate?: string;
  driverLicenseExpiryDate?: string;
  guarantor?: any;
  guarantorName?: string;
  guarantorPhone?: string;
}

export default function InstallmentSaleDetailPage() {
  const params = useParams();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [regeneratingAgreement, setRegeneratingAgreement] = useState(false);

  const fetchSale = () => {
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
  };

  useEffect(() => {
    fetchSale();
  }, [params?.id]);

  const handleRecordPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const handleRegenerateAgreement = async () => {
    const id = params?.id;
    if (!id || !confirm('Are you sure you want to regenerate the agreement?')) return;

    setRegeneratingAgreement(true);
    try {
      const res = await fetch(`/api/sales/installments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-agreement' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to regenerate agreement');
      }

      fetchSale();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRegeneratingAgreement(false);
    }
  };

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
        <div style={{ display: 'flex', gap: '12px' }}>
          {sale.agreementUrl && (
            <a
              href={sale.agreementUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="no-print"
              style={{ padding: '8px 16px', background: '#ffffff', color: '#525f80', border: '1px solid #ced4da', borderRadius: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}
            >
              Download Agreement
            </a>
          )}
          <button
            onClick={handleRegenerateAgreement}
            disabled={regeneratingAgreement}
            className="no-print"
            style={{ padding: '8px 16px', background: '#ffffff', color: '#525f80', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, opacity: regeneratingAgreement ? 0.7 : 1 }}
          >
            {regeneratingAgreement ? 'Regenerating...' : 'Regenerate Agreement'}
          </button>
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

        {sale.guarantorName && (
            <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Guarantor Information</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>Name</span>
                <span style={{ color: '#2a3142', fontWeight: 500 }}>
                    {sale.guarantor ? <Link href={`/dashboard/crm/guarantors/${(sale.guarantor as any)._id || sale.guarantor}`} style={{ color: '#28aaa9' }}>{sale.guarantorName}</Link> : sale.guarantorName}
                </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>Phone</span>
                <span style={{ color: '#2a3142' }}>{sale.guarantorPhone}</span>
                </div>
                {(sale.guarantor as any)?.nationalId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9ca8b3' }}>National ID</span>
                        <span style={{ color: '#2a3142' }}>{(sale.guarantor as any).nationalId}</span>
                    </div>
                )}
            </div>
            </div>
        )}

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Tafweed Authorization</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Status</span>
              <span style={{ color: sale.tafweedStatus === 'Expired' ? '#ec4561' : '#28aaa9', fontWeight: 600 }}>
                {sale.tafweedStatus || 'Active'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Authorized Driver</span>
              <span style={{ color: '#2a3142' }}>{sale.tafweedAuthorizedTo || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Driver Iqama</span>
              <span style={{ color: '#2a3142' }}>{sale.tafweedDriverIqama || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Duration</span>
              <span style={{ color: '#2a3142' }}>{sale.tafweedDurationMonths ? `${sale.tafweedDurationMonths} months` : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Tafweed Expiry</span>
              <span style={{ color: '#2a3142' }}>{sale.tafweedExpiryDate ? new Date(sale.tafweedExpiryDate).toLocaleDateString() : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Driver License Expiry</span>
              <span style={{ color: '#2a3142' }}>{sale.driverLicenseExpiryDate ? new Date(sale.driverLicenseExpiryDate).toLocaleDateString() : '-'}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Payment Details</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Total Price</span>
              <span style={{ color: '#2a3142' }}>SAR {(sale.totalPrice || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Down Payment</span>
              <span style={{ color: '#2a3142' }}>SAR {(sale.downPayment || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Loan Amount</span>
              <span style={{ color: '#2a3142' }}>SAR {(sale.loanAmount || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Interest Rate</span>
              <span style={{ color: '#2a3142' }}>{sale.interestRate}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Tenure</span>
              <span style={{ color: '#2a3142' }}>{sale.tenureMonths} months</span>
            </div>
            {sale.vatAmount !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>VAT ({sale.vatRate ?? 15}%)</span>
                <span style={{ color: '#2a3142' }}>SAR {(sale.vatAmount || 0).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Payment Summary</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Monthly Payment</span>
              <span style={{ color: '#28aaa9', fontWeight: 600 }}>SAR {(sale.monthlyPayment || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Total Paid</span>
              <span style={{ color: '#42ca7f', fontWeight: 600 }}>SAR {(sale.totalPaid || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Remaining</span>
              <span style={{ color: '#ec4561', fontWeight: 600 }}>SAR {(sale.remainingAmount || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Next Payment</span>
              <span style={{ color: '#2a3142' }}>SAR {(sale.nextPaymentAmount || 0).toLocaleString()} ({new Date(sale.nextPaymentDate).toLocaleDateString()})</span>
            </div>
            {sale.monthlyLateFee !== undefined && sale.monthlyLateFee > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>Monthly Late Fee</span>
                <span style={{ color: '#f8b425', fontWeight: 600 }}>SAR {(sale.monthlyLateFee || 0).toLocaleString()}</span>
              </div>
            )}
            {sale.lateFeeCharged !== undefined && sale.lateFeeCharged > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>Total Late Fees</span>
                <span style={{ color: '#ec4561', fontWeight: 600 }}>SAR {(sale.lateFeeCharged || 0).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Payment Schedule</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '14px', minWidth: '800px' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>#</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>Due Date</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>Late Fee</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>Paid Date</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(sale.paymentSchedule || []).map((payment) => {
                const statusColor = payment.status === 'Paid' ? '#42ca7f' : payment.status === 'Overdue' ? '#ec4561' : '#f8b425';
                return (
                  <tr key={payment.installmentNumber} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px' }}>{payment.installmentNumber}</td>
                    <td style={{ padding: '12px' }}>{new Date(payment.dueDate).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>SAR {(payment.amount || 0).toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', background: statusColor, color: '#ffffff', fontSize: '12px' }}>
                        {payment.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: payment.lateFee && payment.lateFee > 0 ? '#ec4561' : '#9ca8b3' }}>
                      {payment.lateFee && payment.lateFee > 0 ? `SAR ${(payment.lateFee || 0).toLocaleString()}` : '-'}
                    </td>
                    <td style={{ padding: '12px', color: '#9ca8b3' }}>
                      {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {payment.status !== 'Paid' && (
                        <button
                          onClick={() => handleRecordPayment(payment)}
                          style={{
                            padding: '6px 12px',
                            background: '#42ca7f',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <RecordPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowModal(false)}
        onSave={() => {
          setShowModal(false);
          fetchSale();
        }}
        saleId={sale._id}
        payment={selectedPayment}
      />

      {sale.agreementDocument && (
        <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Agreement Document</h3>
          <a href={sale.agreementDocument} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            View Agreement (PDF)
          </a>
        </div>
      )}

      {sale.notes && (
        <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Notes</h3>
          <p style={{ color: '#525f80', margin: 0 }}>{sale.notes}</p>
        </div>
      )}

      <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>ZATCA E-Invoice</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9ca8b3' }}>Invoice Type</span>
            <span style={{ color: '#2a3142', fontWeight: 500 }}>{sale.invoiceType || 'Simplified'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#9ca8b3' }}>ZATCA Status</span>
            <ZatcaStatusBadge status={sale.zatcaStatus} saleId={sale._id} errorMessage={sale.zatcaErrorMessage} />
          </div>
          {sale.zatcaUUID && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: '1 / -1' }}>
              <span style={{ color: '#9ca8b3' }}>Invoice UUID</span>
              <span style={{ color: '#525f80', fontFamily: 'monospace', fontSize: '13px' }}>{sale.zatcaUUID}</span>
            </div>
          )}
          {sale.zatcaHash && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: '1 / -1' }}>
              <span style={{ color: '#9ca8b3' }}>Invoice Hash</span>
              <span style={{ color: '#525f80', fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>{sale.zatcaHash}</span>
            </div>
          )}
          {sale.zatcaQRCode && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#9ca8b3', fontSize: '13px' }}>QR Code</span>
              <img src={sale.zatcaQRCode} alt="ZATCA QR Code" style={{ width: '120px', height: '120px' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  saleId: string;
  payment: Payment | null;
}

function RecordPaymentModal({ isOpen, onClose, onSave, saleId, payment }: RecordPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [lateFeeAmount, setLateFeeAmount] = useState('0');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount.toString());
      setLateFeeAmount((payment.lateFee || 0).toString());
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError('');
    }
  }, [payment]);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/sales/installments/${saleId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installmentNumber: payment.installmentNumber,
          amount: parseFloat(amount),
          lateFeeAmount: parseFloat(lateFeeAmount),
          paymentDate,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to record payment');
      }

      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalToPay = (parseFloat(amount) || 0) + (parseFloat(lateFeeAmount) || 0);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>Record Payment - #{payment.installmentNumber}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Base Amount (SAR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Late Fee Collected (SAR)</label>
            <input
              type="number"
              value={lateFeeAmount}
              onChange={(e) => setLateFeeAmount(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '4px', textAlign: 'center' }}>
            <span style={{ fontSize: '14px', color: '#525f80' }}>Total to Collect: </span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#28aaa9' }}>SAR {totalToPay.toLocaleString()}</span>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px', height: '80px', resize: 'none' }}
            />
          </div>
          {error && <div style={{ color: '#ec4561', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: '#f8f9fa', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: '#42ca7f', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ZATCA_BADGE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  Cleared:     { bg: '#e6f4ea', color: '#2e7d32', label: 'Cleared' },
  Reported:    { bg: '#e8f5e9', color: '#388e3c', label: 'Reported' },
  Pending:     { bg: '#fff8e1', color: '#f57c00', label: 'Pending' },
  Failed:      { bg: '#fce4ec', color: '#c62828', label: 'Failed' },
  NotRequired: { bg: '#f5f5f5', color: '#757575', label: 'N/A' },
};

function ZatcaStatusBadge({ status, saleId, errorMessage }: { status?: string; saleId: string; errorMessage?: string }) {
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');
  const s = status ? (ZATCA_BADGE_COLORS[status] ?? ZATCA_BADGE_COLORS['NotRequired']) : ZATCA_BADGE_COLORS['NotRequired'];

  const handleRetry = async () => {
    setRetrying(true);
    setRetryError('');
    try {
      const res = await fetch('/api/zatca/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceId: saleId, referenceType: 'InstallmentSale' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRetryError(data.error || `Server error ${res.status}`);
        return;
      }
      const failed = data.results?.find((r: { success: boolean; error?: string }) => !r.success);
      if (failed) {
        setRetryError(failed.error || 'ZATCA rejected the invoice');
        return;
      }
      window.location.reload();
    } catch (e) {
      setRetryError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setRetrying(false);
    }
  };

  const displayError = retryError || errorMessage;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: s.bg, color: s.color }}>
        {s.label}
      </span>
      {status === 'Failed' && (
        <>
          <button onClick={handleRetry} disabled={retrying} style={{ fontSize: '11px', color: '#28aaa9', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {retrying ? 'Retrying...' : '↺ Retry'}
          </button>
          {displayError && (
            <span style={{ fontSize: '11px', color: '#c62828', maxWidth: '260px', textAlign: 'right', wordBreak: 'break-word', lineHeight: '1.4' }}>
              {displayError}
            </span>
          )}
        </>
      )}
    </div>
  );
}
