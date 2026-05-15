'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

interface Sale {
  _id: string;
  saleId: string;
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
  salePrice: number;
  discountType?: 'flat' | 'percentage';
  discountValue?: number;
  discountAmount: number;
  finalPrice: number;
  agentName?: string;
  agentCommission?: number;
  saleDate: string;
  notes?: string;
  status?: string;
  invoiceUrl?: string;
  vatRate?: number;
  vatAmount?: number;
  finalPriceWithVat?: number;
  invoiceType?: 'Standard' | 'Simplified';
  zatcaStatus?: 'Pending' | 'Cleared' | 'Reported' | 'Failed' | 'NotRequired';
  zatcaUUID?: string;
  zatcaQRCode?: string;
  zatcaHash?: string;
  zatcaErrorMessage?: string;
  registrationDriverName?: string;
  registrationDriverIqama?: string;
  registrationDriverLicenseExpiryDate?: string;
}

export default function CashSaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    loadSale();
  }, [params?.id]);

  const loadSale = () => {
    const id = params?.id;
    if (!id) return;

    fetch(`/api/sales/cash/${id}`)
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

  const handleGenerateInvoice = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/sales/cash/${params?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-invoice' }),
      });
      if (!res.ok) throw new Error('Failed to generate invoice');
      const data = await res.json();
      if (data.invoiceUrl) {
        setSale((prev) => prev ? { ...prev, invoiceUrl: data.invoiceUrl } : null);
      }
    } catch (err) {
      alert('Failed to generate invoice');
    } finally {
      setGenerating(false);
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
          <Link href="/dashboard/sales/cash" style={{ color: '#28aaa9' }}>← Back to Cash Sales</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/sales/cash" style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Cash Sales
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title">Cash Sale Details</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          {sale.invoiceUrl && (
            <a
              href={sale.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="no-print"
              style={{ padding: '8px 16px', background: '#28aaa9', color: '#ffffff', border: 'none', borderRadius: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}
            >
              Download Invoice
            </a>
          )}
          <button
            onClick={handleGenerateInvoice}
            disabled={generating}
            className="no-print"
            style={{ padding: '8px 16px', background: '#ffffff', color: '#525f80', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, opacity: generating ? 0.7 : 1 }}
          >
            {generating ? (sale.invoiceUrl ? 'Regenerating...' : 'Generating...') : (sale.invoiceUrl ? 'Regenerate Invoice' : 'Generate Invoice')}
          </button>
          {sale.status === 'Cancelled' && (
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
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Sale Information</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Sale ID</span>
              <span style={{ color: '#28aaa9', fontWeight: 600, fontFamily: 'monospace' }}>{sale.saleId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Status</span>
              <span style={{ 
                padding: '4px 8px', 
                borderRadius: '3px', 
                fontSize: '12px', 
                fontWeight: 500,
                background: sale.status === 'Cancelled' ? '#ec456120' : '#28aaa920', 
                color: sale.status === 'Cancelled' ? '#ec4561' : '#28aaa9' 
              }}>{sale.status || 'Active'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Sale Date</span>
              <span style={{ color: '#2a3142' }}>{new Date(sale.saleDate).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Car ID</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{sale.carId}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Vehicle Information</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Vehicle</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{sale.car ? `${sale.car.brand} ${sale.car.model} (${sale.car.year})` : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Plate Number</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{sale.car?.plateNumber || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Chassis Number (VIN)</span>
              <span style={{ color: '#2a3142' }}>{sale.car?.chassisNumber || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Engine Number</span>
              <span style={{ color: '#2a3142' }}>{sale.car?.engineNumber || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Sequence Number</span>
              <span style={{ color: '#2a3142' }}>{sale.car?.sequenceNumber || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Color</span>
              <span style={{ color: '#2a3142' }}>{sale.car?.color || '-'}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Customer Information</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Name</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{sale.customerName || 'Cash Customer'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Phone</span>
              <span style={{ color: '#2a3142' }}>{sale.customerPhone || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Registered Driver</span>
              <span style={{ color: '#2a3142' }}>{sale.registrationDriverName || sale.customerName || sale.agentName || 'Cash Customer'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Driver Iqama</span>
              <span style={{ color: '#2a3142' }}>{sale.registrationDriverIqama || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>License Expiry</span>
              <span style={{ color: '#2a3142' }}>
                {sale.registrationDriverLicenseExpiryDate ? new Date(sale.registrationDriverLicenseExpiryDate).toLocaleDateString() : '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Payment Details</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Sale Price</span>
              <span style={{ color: '#2a3142' }}>SAR {(sale.salePrice || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>
                {sale.discountType === 'percentage' && (sale.discountValue ?? 0) > 0
                  ? `Discount (${sale.discountValue}%)`
                  : 'Discount'}
              </span>
              <span style={{ color: sale.discountAmount > 0 ? '#ec4561' : '#2a3142' }}>
                {sale.discountAmount > 0 ? `-SAR ${(sale.discountAmount || 0).toLocaleString()}` : '-'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <span style={{ color: '#9ca8b3', fontWeight: 600 }}>Subtotal</span>
              <span style={{ color: '#2a3142', fontWeight: 600 }}>SAR {(sale.finalPrice || 0).toLocaleString()}</span>
            </div>
            {sale.vatAmount !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>VAT ({sale.vatRate ?? 15}%)</span>
                <span style={{ color: '#2a3142' }}>SAR {(sale.vatAmount || 0).toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <span style={{ color: '#2a3142', fontWeight: 600 }}>Total (incl. VAT)</span>
              <span style={{ color: '#28aaa9', fontWeight: 700, fontSize: '18px' }}>
                SAR {(sale.finalPriceWithVat ?? sale.finalPrice ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {sale.agentName && (
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Agent Information</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>Agent Name</span>
                <span style={{ color: '#2a3142' }}>{sale.agentName}</span>
              </div>
              {sale.agentCommission !== undefined && sale.agentCommission > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca8b3' }}>Commission</span>
                  <span style={{ color: '#2a3142' }}>SAR {(sale.agentCommission || 0).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {sale.notes && (
          <div className="card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Notes</h3>
            <p style={{ color: '#525f80', margin: 0 }}>{sale.notes}</p>
          </div>
        )}

        <div className="card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
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

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={() => router.push(`/dashboard/sales/cash?edit=${sale._id}`)}
          style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #f8b425', borderRadius: '3px', background: '#ffffff', color: '#f8b425', cursor: 'pointer' }}
        >
          Edit Sale
        </button>
        {sale.invoiceUrl ? (
          <a
            href={sale.invoiceUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #28aaa9', borderRadius: '3px', background: '#ffffff', color: '#28aaa9', textDecoration: 'none', cursor: 'pointer' }}
          >
            Download Invoice
          </a>
        ) : (
          <button
            onClick={handleGenerateInvoice}
            disabled={generating}
            style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #28aaa9', borderRadius: '3px', background: generating ? '#f0f0f0' : '#28aaa9', color: generating ? '#999' : '#ffffff', cursor: generating ? 'not-allowed' : 'pointer' }}
          >
            {generating ? 'Generating...' : 'Generate Invoice'}
          </button>
        )}
        {sale.invoiceUrl && (
          <button
            onClick={handleGenerateInvoice}
            disabled={generating}
            style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #666', borderRadius: '3px', background: generating ? '#f0f0f0' : '#ffffff', color: generating ? '#999' : '#666', cursor: generating ? 'not-allowed' : 'pointer' }}
          >
            {generating ? 'Regenerating...' : 'Regenerate Invoice'}
          </button>
        )}
      </div>

      <RevertCancellationModal
        isOpen={showRevertModal}
        onClose={() => setShowRevertModal(false)}
        onSave={() => {
          setShowRevertModal(false);
          loadSale();
        }}
        saleId={sale._id}
      />
    </div>
  );
}

interface RevertCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  saleId: string;
}

function RevertCancellationModal({ isOpen, onClose, onSave, saleId }: RevertCancellationModalProps) {
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
      const res = await fetch(`/api/sales/cash/${saleId}`, {
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
          This will restore the cash sale to Active status and update the vehicle status to Sold. Please provide a reason for this action.
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
        body: JSON.stringify({ referenceId: saleId, referenceType: 'CashSale' }),
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
