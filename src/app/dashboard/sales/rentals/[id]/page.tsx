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
  lateFee?: number;
  agreementDocument?: string;
  agreementUrl?: string;
  invoiceUrl?: string;
  notes?: string;
  vatRate?: number;
  vatAmount?: number;
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
}

export default function RentalDetailPage() {
  const params = useParams();
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regeneratingAgreement, setRegeneratingAgreement] = useState(false);
  const [regeneratingInvoice, setRegeneratingInvoice] = useState(false);

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
            {regeneratingInvoice ? 'Generating...' : 'Regenerate Invoice'}
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
            {regeneratingAgreement ? 'Regenerating...' : 'Regenerate Agreement'}
          </button>
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
              <span style={{ color: '#9ca8b3' }}>Daily Rate</span>
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
              <span style={{ color: '#28aaa9', fontWeight: 700, fontSize: '18px' }}>SAR {(rental.totalAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

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
