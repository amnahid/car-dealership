'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Rental {
  _id: string;
  rentalId: string;
  carId: string;
  car?: {
    brand: string;
    model: string;
    year: number;
    plateNumber?: string;
    chassisNumber: string;
    engineNumber?: string;
    sequenceNumber?: string;
    color?: string;
    images?: string[];
  };
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
  lateFee?: number;
  agreementDocument?: string;
  agreementUrl?: string;
  invoiceUrl?: string;
  reportUrl?: string;
  notes?: string;
  vatRate?: number;
  vatAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  rateType?: 'Daily' | 'Monthly';
  payments?: Array<{
    amount: number;
    date: string;
    method: string;
    reference?: string;
    note?: string;
  }>;
  invoiceType?: 'Standard' | 'Simplified';
  totalAmountWithVat?: number;
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
  voucherNumber?: string;
}

export default function RentalDetailPage() {
  const params = useParams();
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regeneratingAgreement, setRegeneratingAgreement] = useState(false);
  const [regeneratingInvoice, setRegeneratingInvoice] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Cash',
    reference: '',
    voucherNumber: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rental || !paymentForm.amount) return;
    setRecordingPayment(true);
    try {
      const res = await fetch(`/api/sales/rentals/${rental._id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      });
      if (res.ok) {
        setShowPaymentModal(false);
        setPaymentForm({
          amount: '',
          method: 'Cash',
          reference: '',
          voucherNumber: '',
          note: '',
          date: new Date().toISOString().split('T')[0],
        });
        fetchRental();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleRegenerateInvoice = async () => {
    if (!rental) return;
    setRegeneratingInvoice(true);
    try {
      const res = await fetch(`/api/sales/rentals/${rental._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-invoice' }),
      });
      if (res.ok) {
        fetchRental();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to regenerate invoice');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setRegeneratingInvoice(false);
    }
  };

  const fetchRental = () => {
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
  };

  useEffect(() => {
    fetchRental();
  }, [params?.id]);

  const handleRegenerateAgreement = async () => {
    const id = params?.id;
    if (!id || !confirm('Are you sure you want to regenerate the agreement?')) return;

    setRegeneratingAgreement(true);
    try {
      const res = await fetch(`/api/sales/rentals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-agreement' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to regenerate agreement');
      }

      fetchRental();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRegeneratingAgreement(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!rental) return;
    setGeneratingReport(true);
    try {
      const res = await fetch(`/api/sales/rentals/${rental._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-report' }),
      });
      if (res.ok) {
        fetchRental();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setGeneratingReport(false);
    }
  };

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
        <div style={{ display: 'flex', gap: '12px' }}>
          {rental.reportUrl && (
            <a
              href={rental.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="no-print"
              style={{ padding: '8px 16px', background: '#525f80', color: '#ffffff', border: 'none', borderRadius: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}
            >
              Print Status Report
            </a>
          )}
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="no-print"
            style={{ padding: '8px 16px', background: '#ffffff', color: '#525f80', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, opacity: generatingReport ? 0.7 : 1 }}
          >
            {generatingReport ? (rental.reportUrl ? 'Regenerating...' : 'Generating...') : (rental.reportUrl ? 'Regenerate Report' : 'Generate Status Report')}
          </button>
          {rental.invoiceUrl && (
            <a
              href={rental.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="no-print"
              style={{ padding: '8px 16px', background: '#28aaa9', color: '#ffffff', border: 'none', borderRadius: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}
            >
              Download Invoice
            </a>
          )}
          <button
            onClick={handleRegenerateInvoice}
            disabled={regeneratingInvoice}
            className="no-print"
            style={{ padding: '8px 16px', background: '#ffffff', color: '#525f80', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, opacity: regeneratingInvoice ? 0.7 : 1 }}
          >
            {regeneratingInvoice ? (rental.invoiceUrl ? 'Regenerating...' : 'Generating...') : (rental.invoiceUrl ? 'Regenerate Invoice' : 'Generate Invoice')}
          </button>
          {rental.agreementUrl && (
            <a
              href={rental.agreementUrl}
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
            {regeneratingAgreement ? (rental.agreementUrl ? 'Regenerating...' : 'Generating...') : (rental.agreementUrl ? 'Regenerate Agreement' : 'Generate Agreement')}
          </button>
          {rental.status === 'Cancelled' && (
            <button
              onClick={() => setShowRevertModal(true)}
              className="no-print"
              style={{ padding: '8px 16px', background: '#f8b425', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
            >
              Revert Cancellation
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Rental Information</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Status</span>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: (statusColors[rental.status] || '#28aaa9') + '20',
                  color: statusColors[rental.status] || '#28aaa9',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {rental.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Rental ID</span>
              <span style={{ color: '#28aaa9', fontWeight: 600, fontFamily: 'monospace' }}>{rental.rentalId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Car ID</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{rental.carId}</span>
            </div>
            {rental.voucherNumber && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>Voucher Number</span>
                <span style={{ color: '#525f80', fontWeight: 600 }}>{rental.voucherNumber}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Duration</span>
              <span style={{ color: '#2a3142' }}>{rentalDays} days</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Vehicle Information</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Vehicle</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{rental.car ? `${rental.car.brand} ${rental.car.model} (${rental.car.year})` : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Plate Number</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{rental.car?.plateNumber || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Chassis Number (VIN)</span>
              <span style={{ color: '#2a3142' }}>{rental.car?.chassisNumber || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Engine Number</span>
              <span style={{ color: '#2a3142' }}>{rental.car?.engineNumber || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Sequence Number</span>
              <span style={{ color: '#2a3142' }}>{rental.car?.sequenceNumber || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Color</span>
              <span style={{ color: '#2a3142' }}>{rental.car?.color || '-'}</span>
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
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Tafweed Authorization</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Status</span>
              <span style={{ color: rental.tafweedStatus === 'Expired' ? '#ec4561' : '#28aaa9', fontWeight: 600 }}>
                {rental.tafweedStatus || 'Active'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Authorized Driver</span>
              <span style={{ color: '#2a3142' }}>{rental.tafweedAuthorizedTo || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Driver Iqama</span>
              <span style={{ color: '#2a3142' }}>{rental.tafweedDriverIqama || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Duration</span>
              <span style={{ color: '#2a3142' }}>{rental.tafweedDurationMonths ? `${rental.tafweedDurationMonths} months` : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Tafweed Expiry</span>
              <span style={{ color: '#2a3142' }}>{rental.tafweedExpiryDate ? new Date(rental.tafweedExpiryDate).toLocaleDateString() : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Driver License Expiry</span>
              <span style={{ color: '#2a3142' }}>{rental.driverLicenseExpiryDate ? new Date(rental.driverLicenseExpiryDate).toLocaleDateString() : '-'}</span>
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
              <span style={{ color: '#9ca8b3' }}>Rate ({rental.rateType || 'Daily'})</span>
              <span style={{ color: '#2a3142' }}>SAR {(rental.dailyRate || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Security Deposit</span>
              <span style={{ color: '#2a3142' }}>SAR {(rental.securityDeposit || 0).toLocaleString()}</span>
            </div>
            {rental.lateFee !== undefined && rental.lateFee > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>Late Fee</span>
                <span style={{ color: '#ec4561', fontWeight: 600 }}>SAR {(rental.lateFee || 0).toLocaleString()}</span>
              </div>
            )}
            {rental.vatAmount !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>VAT ({rental.vatRate ?? 15}%)</span>
                <span style={{ color: '#2a3142' }}>SAR {(rental.vatAmount || 0).toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <span style={{ color: '#2a3142', fontWeight: 600 }}>Total Amount</span>
              <span style={{ color: '#28aaa9', fontWeight: 700, fontSize: '18px' }}>SAR {(rental.totalAmountWithVat || rental.totalAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', margin: 0 }}>Financial Summary</h3>
            {rental.status !== 'Cancelled' && (
              <button 
                onClick={() => {
                  setPaymentForm({ ...paymentForm, amount: (rental.remainingAmount || 0).toString() });
                  setShowPaymentModal(true);
                }}
                style={{ padding: '4px 12px', background: '#42ca7f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
              >
                Record Payment
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Paid Amount</span>
              <span style={{ color: '#42ca7f', fontWeight: 600 }}>SAR {(rental.paidAmount || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Remaining Balance</span>
              <span style={{ color: (rental.remainingAmount || 0) > 0 ? '#ec4561' : '#28aaa9', fontWeight: 700 }}>SAR {(rental.remainingAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {rental.payments && rental.payments.length > 0 && (
          <div className="card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Payment History</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Method</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Reference</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rental.payments.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px' }}>{new Date(p.date).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#28aaa9' }}>SAR {p.amount.toLocaleString()}</td>
                      <td style={{ padding: '12px' }}>{p.method}</td>
                      <td style={{ padding: '12px' }}>{p.reference || '-'}</td>
                      <td style={{ padding: '12px' }}>{p.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Record Payment</h3>
              <form onSubmit={handleRecordPayment}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Amount (SAR)</label>
                  <input required type="number" step="any" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #ced4da' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Method</label>
                  <select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #ced4da' }}>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Online">Online Payment</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Reference</label>
                    <input value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #ced4da' }} placeholder="Ref #" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Voucher #</label>
                    <input value={paymentForm.voucherNumber} onChange={e => setPaymentForm({...paymentForm, voucherNumber: e.target.value})} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #ced4da' }} placeholder="V-0000" />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Date</label>
                  <input type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #ced4da' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Notes</label>
                  <input value={paymentForm.note} onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #ced4da' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowPaymentModal(false)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #ced4da', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={recordingPayment} style={{ padding: '8px 16px', background: '#28aaa9', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: recordingPayment ? 0.7 : 1 }}>
                    {recordingPayment ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {rental.notes && (
          <div className="card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Notes</h3>
            <p style={{ color: '#525f80', margin: 0 }}>{rental.notes}</p>
          </div>
        )}

        {rental.agreementDocument && (
          <div className="card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Agreement Document</h3>
            <a href={rental.agreementDocument} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              View Agreement (PDF)
            </a>
          </div>
        )}

        <div className="card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>ZATCA E-Invoice</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Invoice Type</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{rental.invoiceType || 'Simplified'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>ZATCA Status</span>
              <ZatcaStatusBadge status={rental.zatcaStatus} rentalId={rental._id} errorMessage={rental.zatcaErrorMessage} />
            </div>
            {rental.zatcaUUID && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: '1 / -1' }}>
                <span style={{ color: '#9ca8b3' }}>Invoice UUID</span>
                <span style={{ color: '#525f80', fontFamily: 'monospace', fontSize: '13px' }}>{rental.zatcaUUID}</span>
              </div>
            )}
            {rental.zatcaHash && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: '1 / -1' }}>
                <span style={{ color: '#9ca8b3' }}>Invoice Hash</span>
                <span style={{ color: '#525f80', fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>{rental.zatcaHash}</span>
              </div>
            )}
            {rental.zatcaQRCode && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#9ca8b3', fontSize: '13px' }}>QR Code</span>
                <img src={rental.zatcaQRCode} alt="ZATCA QR Code" style={{ width: '120px', height: '120px' }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <RevertCancellationModal
        isOpen={showRevertModal}
        onClose={() => setShowRevertModal(false)}
        onSave={() => {
          setShowRevertModal(false);
          fetchRental();
        }}
        rentalId={rental._id}
      />
    </div>
  );
}

interface RevertCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  rentalId: string;
}

function RevertCancellationModal({ isOpen, onClose, onSave, rentalId }: RevertCancellationModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/sales/rentals/${rentalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revert-cancellation',
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revert cancellation');
      }

      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2a3142' }}>Revert Cancellation</h3>
        <p style={{ fontSize: '14px', color: '#525f80', marginBottom: '16px' }}>
          This will restore the rental to Active status and update the vehicle status to Rented. Please provide a reason for this action.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Reason for Revert</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="e.g., Cancelled by mistake"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px', height: '100px', resize: 'none' }}
            />
          </div>
          {error && <div style={{ color: '#ec4561', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: '#f8f9fa', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: '#f8b425', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Processing...' : 'Revert Cancellation'}
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

function ZatcaStatusBadge({ status, rentalId, errorMessage }: { status?: string; rentalId: string; errorMessage?: string }) {
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
        body: JSON.stringify({ referenceId: rentalId, referenceType: 'Rental' }),
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
      {(status === 'Failed' || status === 'Pending') && (
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
