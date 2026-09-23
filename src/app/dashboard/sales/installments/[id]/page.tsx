'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';

interface Payment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: string;
  method?: string;
  voucherNumber?: string;
  paidDate?: string;
  paidAmount?: number;
  lateFee?: number;
  notes?: string;
}

interface Sale {
  _id: string;
  saleId: string;
  carId: string;
  reportUrl?: string;
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
    status?: string;
  };
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
  paymentMethod?: string;
  paymentReference?: string;
  monthlyLateFee?: number;
  lateFeeCharged?: number;
  otherFees?: number;
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
  voucherNumber?: string;
  guarantor?: any;
  guarantorName?: string;
  guarantorPhone?: string;
}

export default function InstallmentSaleDetailPage() {
  const t = useTranslations('InstallmentSales');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  const params = useParams();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [showRevertPaymentModal, setShowRevertPaymentModal] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [regeneratingAgreement, setRegeneratingAgreement] = useState(false);
  const [regeneratingInvoice, setRegeneratingInvoice] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showDocsDropdown, setShowDocsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDocsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'primary' | 'danger' | 'warning' | 'success';
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleRegenerateInvoice = async () => {
    if (!sale) return;
    setRegeneratingInvoice(true);
    try {
      const res = await fetch(`/api/sales/installments/${sale._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-invoice' }),
      });
      if (res.ok) {
        showToast(t('invoiceSuccess') || 'Invoice generated successfully', 'success');
        fetchSale();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to regenerate invoice', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    } finally {
      setRegeneratingInvoice(false);
    }
  };

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

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowEditPaymentModal(true);
  };

  const handleEditSchedule = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowEditScheduleModal(true);
  };

  const handleRevertPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowRevertPaymentModal(true);
  };

  const executeCancelSale = async () => {
    if (!sale) return;
    try {
      const res = await fetch(`/api/sales/installments/${sale._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      const resData = await res.json();
      if (!res.ok) {
        showToast(resData.error || 'Failed to cancel sale', 'error');
        return;
      }
      
      if (resData.isPending) {
        showToast(resData.message || 'Cancellation request submitted for admin approval', 'info');
      } else {
        showToast('Sale cancelled successfully', 'success');
      }
      fetchSale();
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    }
  };

  const handleCancelSale = () => {
    setConfirmModal({
      isOpen: true,
      title: t('cancelSale') || 'Cancel Sale',
      message: t('cancelConfirm') || 'Are you sure you want to delete this installment sale?',
      confirmText: t('cancelSale') || 'Cancel Sale',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await executeCancelSale();
      },
    });
  };

  const executeRegenerateAgreement = async () => {
    const id = params?.id;
    if (!id) return;

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

      showToast('Agreement regenerated successfully', 'success');
      fetchSale();
    } catch (err: any) {
      showToast(err.message || 'Failed to regenerate agreement', 'error');
    } finally {
      setRegeneratingAgreement(false);
    }
  };

  const handleRegenerateAgreement = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Regenerate Agreement',
      message: 'Are you sure you want to regenerate the agreement?',
      confirmText: 'Regenerate',
      variant: 'primary',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await executeRegenerateAgreement();
      },
    });
  };

  const handleGenerateReport = async () => {
    if (!sale) return;
    setGeneratingReport(true);
    try {
      const res = await fetch(`/api/sales/installments/${sale._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-report' }),
      });
      if (res.ok) {
        showToast('Report generated successfully', 'success');
        fetchSale();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to generate report', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    } finally {
      setGeneratingReport(false);
    }
  };

  const [handingOver, setHandingOver] = useState(false);
  const [revertingHandover, setRevertingHandover] = useState(false);

  const executeHandover = async () => {
    if (!sale) return;
    setHandingOver(true);
    try {
      const res = await fetch(`/api/sales/installments/${sale._id}/handover`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || t('handOverSuccess') || 'Car marked as Handed successfully', 'success');
        fetchSale();
      } else {
        showToast(data.error || 'Failed to mark as Handed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    } finally {
      setHandingOver(false);
    }
  };

  const handleHandover = () => {
    setConfirmModal({
      isOpen: true,
      title: t('markAsHanded') || 'Mark as Handed',
      message: t('handOverConfirm') || 'Are you sure you want to mark this car as Handed over to the customer?',
      confirmText: t('markAsHanded') || 'Mark as Handed',
      variant: 'success',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await executeHandover();
      },
    });
  };

  const executeRevertHandover = async () => {
    if (!sale) return;
    setRevertingHandover(true);
    try {
      const res = await fetch(`/api/sales/installments/${sale._id}/revert-handover`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || t('revertHandoverSuccess') || 'Handover status reverted successfully', 'success');
        fetchSale();
      } else {
        showToast(data.error || 'Failed to revert handover', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    } finally {
      setRevertingHandover(false);
    }
  };

  const handleRevertHandover = () => {
    setConfirmModal({
      isOpen: true,
      title: t('revertHandover') || 'Revert Handover',
      message: t('revertHandoverConfirm') || 'Are you sure you want to revert the handover status?',
      confirmText: t('revertHandover') || 'Revert Handover',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await executeRevertHandover();
      },
    });
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
    Handed: '#20c997',
    Defaulted: '#ec4561',
    Cancelled: '#ec4561',
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/sales/installments" style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Installment Sales
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h2 className="page-title" style={{ margin: 0 }}>Installment Sale Details</h2>
          {sale.status === 'Handed' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '4px',
                background: '#28aaa9',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {t(`statuses.${sale.status.toLowerCase()}`) || sale.status}
            </span>
          ) : (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                background: statusColors[sale.status] || '#28aaa9',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {t(`statuses.${sale.status.toLowerCase()}`) || sale.status}
            </span>
          )}
          {sale.car?.status === 'Handed' && sale.status !== 'Handed' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '4px',
                background: '#e6f7f6',
                color: '#28aaa9',
                border: '1px solid #28aaa9',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {t('statuses.handed') || 'Handed'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }} className="no-print">
          {/* Mark as Handed Button (Only if not already handed and sale is not cancelled) */}
          {sale.status !== 'Cancelled' && sale.status !== 'Handed' && sale.car?.status !== 'Handed' && (
            <button
              onClick={handleHandover}
              disabled={handingOver}
              style={{
                padding: '8px 16px',
                background: '#20c997',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: handingOver ? 'default' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                opacity: handingOver ? 0.7 : 1,
              }}
            >
              {handingOver ? 'Updating...' : (t('markAsHanded') || 'Mark as Handed')}
            </button>
          )}

          {/* Revert Handover Button (When sale or car is Handed) */}
          {sale.status !== 'Cancelled' && (sale.status === 'Handed' || sale.car?.status === 'Handed') && (
            <button
              onClick={handleRevertHandover}
              disabled={revertingHandover}
              style={{
                padding: '8px 16px',
                background: '#ffffff',
                color: '#f8b425',
                border: '1px solid #f8b425',
                borderRadius: '4px',
                cursor: revertingHandover ? 'default' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                opacity: revertingHandover ? 0.7 : 1,
              }}
            >
              {revertingHandover ? 'Reverting...' : (t('revertHandover') || 'Revert Handover')}
            </button>
          )}

          {/* Documents & Reports Dropdown Menu */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDocsDropdown((prev) => !prev)}
              style={{
                padding: '8px 16px',
                background: '#ffffff',
                color: '#2a3142',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Documents & Reports</span>
              <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: showDocsDropdown ? 'rotate(180deg)' : 'none' }}>▼</span>
            </button>

            {showDocsDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: isRtl ? 'auto' : 0,
                  left: isRtl ? 0 : 'auto',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                  minWidth: '300px',
                  zIndex: 50,
                  padding: '8px 0',
                }}
              >
                {/* Status Report Section */}
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Status Report
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {sale.reportUrl ? (
                      <>
                        <a
                          href={sale.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ flex: 1, padding: '7px 12px', background: '#525f80', color: '#ffffff', borderRadius: '4px', textDecoration: 'none', fontSize: '13px', textAlign: 'center', fontWeight: 500 }}
                        >
                          View / Print
                        </a>
                        <button
                          onClick={handleGenerateReport}
                          disabled={generatingReport}
                          style={{ padding: '7px 12px', background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
                          title="Regenerate Report"
                        >
                          {generatingReport ? '...' : 'Regenerate'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleGenerateReport}
                        disabled={generatingReport}
                        style={{ width: '100%', padding: '7px 12px', background: '#525f80', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
                      >
                        {generatingReport ? 'Generating...' : 'Generate Status Report'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Tax Invoice Section */}
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Tax Invoice (ZATCA)
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {sale.invoiceUrl ? (
                      <>
                        <a
                          href={sale.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ flex: 1, padding: '7px 12px', background: '#28aaa9', color: '#ffffff', borderRadius: '4px', textDecoration: 'none', fontSize: '13px', textAlign: 'center', fontWeight: 500 }}
                        >
                          Download Invoice
                        </a>
                        <button
                          onClick={handleRegenerateInvoice}
                          disabled={regeneratingInvoice}
                          style={{ padding: '7px 12px', background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
                          title="Regenerate Invoice"
                        >
                          {regeneratingInvoice ? '...' : 'Regenerate'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleRegenerateInvoice}
                        disabled={regeneratingInvoice}
                        style={{ width: '100%', padding: '7px 12px', background: '#28aaa9', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
                      >
                        {regeneratingInvoice ? 'Generating...' : 'Generate Invoice'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sales Agreement Section */}
                <div style={{ padding: '10px 16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Sales Agreement
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {sale.agreementUrl ? (
                      <>
                        <a
                          href={sale.agreementUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ flex: 1, padding: '7px 12px', background: '#525f80', color: '#ffffff', borderRadius: '4px', textDecoration: 'none', fontSize: '13px', textAlign: 'center', fontWeight: 500 }}
                        >
                          Download Agreement
                        </a>
                        <button
                          onClick={handleRegenerateAgreement}
                          disabled={regeneratingAgreement}
                          style={{ padding: '7px 12px', background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
                          title="Regenerate Agreement"
                        >
                          {regeneratingAgreement ? '...' : 'Regenerate'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleRegenerateAgreement}
                        disabled={regeneratingAgreement}
                        style={{ width: '100%', padding: '7px 12px', background: '#525f80', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
                      >
                        {regeneratingAgreement ? 'Generating...' : 'Generate Agreement'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cancel Sale / Revert Cancellation */}
          {sale.status !== 'Cancelled' && (
            <button
              onClick={handleCancelSale}
              style={{
                padding: '8px 16px',
                background: '#ffffff',
                color: '#ec4561',
                border: '1px solid #ec4561',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Cancel Sale
            </button>
          )}
          {sale.status === 'Cancelled' && (
            <button
              onClick={() => setShowRevertModal(true)}
              style={{
                padding: '8px 16px',
                background: '#f8b425',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Revert Cancellation
            </button>
          )}
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
            {sale.voucherNumber && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>Voucher Number</span>
                <span style={{ color: '#525f80', fontWeight: 600 }}>{sale.voucherNumber}</span>
              </div>
            )}
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
                {(sale.guarantor as any)?.passportNumber && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9ca8b3' }}>{commonT('passportNumber')}</span>
                        <span style={{ color: '#2a3142' }}>{(sale.guarantor as any).passportNumber}</span>
                    </div>
                )}            </div>
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
            {sale.otherFees !== undefined && sale.otherFees > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>{t('otherFees')}</span>
                <span style={{ color: '#2a3142' }}>SAR {(sale.otherFees || 0).toLocaleString()}</span>
              </div>
            )}
            {sale.paymentMethod && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>DP Method</span>
                <span style={{ color: '#2a3142' }}>{sale.paymentMethod}</span>
              </div>
            )}
            {sale.paymentReference && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>DP Reference</span>
                <span style={{ color: '#2a3142' }}>{sale.paymentReference}</span>
              </div>
            )}
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
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>Method</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>Voucher #</th>
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
                    <td style={{ padding: '12px' }}>
                      SAR {(payment.status === 'Paid' ? ((payment.paidAmount || 0) - (payment.lateFee || 0)) : (payment.amount || 0)).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', background: statusColor, color: '#ffffff', fontSize: '12px' }}>
                        {payment.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#525f80' }}>{payment.method || '-'}</td>
                    <td style={{ padding: '12px', color: '#525f80' }}>{payment.voucherNumber || '-'}</td>
                    <td style={{ padding: '12px', color: payment.lateFee && payment.lateFee > 0 ? '#ec4561' : '#9ca8b3' }}>
                      {payment.lateFee && payment.lateFee > 0 ? `SAR ${(payment.lateFee || 0).toLocaleString()}` : '-'}
                    </td>
                    <td style={{ padding: '12px', color: '#9ca8b3' }}>
                      {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {payment.status !== 'Paid' ? (
                          <>
                            <button
                              onClick={() => handleRecordPayment(payment)}
                              style={{
                                padding: '5px 10px',
                                background: '#42ca7f',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500,
                              }}
                            >
                              Record Payment
                            </button>
                            <button
                              onClick={() => handleEditSchedule(payment)}
                              style={{
                                padding: '5px 10px',
                                background: '#f8f9fa',
                                color: '#525f80',
                                border: '1px solid #ced4da',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                              }}
                            >
                              Edit Schedule
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditPayment(payment)}
                              style={{
                                padding: '5px 10px',
                                background: '#28aaa9',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500,
                              }}
                            >
                              Edit Payment
                            </button>
                            <button
                              onClick={() => handleRevertPayment(payment)}
                              style={{
                                padding: '5px 10px',
                                background: '#fff1f0',
                                color: '#ec4561',
                                border: '1px solid #ffa39e',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500,
                              }}
                            >
                              Revert
                            </button>
                          </>
                        )}
                      </div>
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

      <EditPaymentModal
        isOpen={showEditPaymentModal}
        onClose={() => setShowEditPaymentModal(false)}
        onSave={() => {
          setShowEditPaymentModal(false);
          fetchSale();
        }}
        saleId={sale._id}
        payment={selectedPayment}
      />

      <EditScheduleModal
        isOpen={showEditScheduleModal}
        onClose={() => setShowEditScheduleModal(false)}
        onSave={() => {
          setShowEditScheduleModal(false);
          fetchSale();
        }}
        saleId={sale._id}
        payment={selectedPayment}
      />

      <RevertPaymentModal
        isOpen={showRevertPaymentModal}
        onClose={() => setShowRevertPaymentModal(false)}
        onSave={() => {
          setShowRevertPaymentModal(false);
          fetchSale();
        }}
        saleId={sale._id}
        payment={selectedPayment}
      />

      <RevertCancellationModal
        isOpen={showRevertModal}
        onClose={() => setShowRevertModal(false)}
        onSave={() => {
          setShowRevertModal(false);
          fetchSale();
        }}
        saleId={sale._id}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={commonT('cancel') || 'Cancel'}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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
      const res = await fetch(`/api/sales/installments/${saleId}`, {
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
          This will restore the installment sale to Active status and update the vehicle status. Please provide a reason for this action.
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
  const [method, setMethod] = useState('Cash');
  const [voucherNumber, setVoucherNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount.toString());
      setLateFeeAmount((payment.lateFee || 0).toString());
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setMethod(payment.method || 'Cash');
      setVoucherNumber(payment.voucherNumber || '');
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
          method,
          voucherNumber,
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Voucher #</label>
              <input
                value={voucherNumber}
                onChange={(e) => setVoucherNumber(e.target.value)}
                placeholder="V-0000"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
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

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  saleId: string;
  payment: Payment | null;
}

function EditPaymentModal({ isOpen, onClose, onSave, saleId, payment }: EditPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [lateFeeAmount, setLateFeeAmount] = useState('0');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('Cash');
  const [voucherNumber, setVoucherNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (payment) {
      const baseAmount = payment.paidAmount !== undefined
        ? payment.paidAmount - (payment.lateFee || 0)
        : payment.amount;
      setAmount(baseAmount.toString());
      setLateFeeAmount((payment.lateFee || 0).toString());
      setPaymentDate(payment.paidDate ? new Date(payment.paidDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setMethod(payment.method || 'Cash');
      setVoucherNumber(payment.voucherNumber || '');
      setNotes(payment.notes || '');
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installmentNumber: payment.installmentNumber,
          action: 'edit',
          amount: parseFloat(amount),
          lateFeeAmount: parseFloat(lateFeeAmount),
          paymentDate,
          method,
          voucherNumber,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update payment');
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
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '420px', maxWidth: '90%' }}>
        <h3 style={{ marginTop: 0, marginBottom: '6px', color: '#2a3142' }}>Edit Payment - #{payment.installmentNumber}</h3>
        <p style={{ fontSize: '13px', color: '#525f80', marginBottom: '16px' }}>
          Update payment details. Sale totals and ledger transactions will be automatically synchronized.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Base Amount (SAR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Late Fee Collected (SAR)</label>
            <input
              type="number"
              value={lateFeeAmount}
              onChange={(e) => setLateFeeAmount(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '16px', padding: '10px', background: '#f8f9fa', borderRadius: '4px', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', color: '#525f80' }}>Total Paid: </span>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#28aaa9' }}>SAR {totalToPay.toLocaleString()}</span>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Voucher #</label>
              <input
                value={voucherNumber}
                onChange={(e) => setVoucherNumber(e.target.value)}
                placeholder="V-0000"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px', height: '60px', resize: 'none' }}
            />
          </div>
          {error && <div style={{ color: '#ec4561', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: '#f8f9fa', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: '#28aaa9', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Saving...' : 'Update Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  saleId: string;
  payment: Payment | null;
}

function EditScheduleModal({ isOpen, onClose, onSave, saleId, payment }: EditScheduleModalProps) {
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount.toString());
      setDueDate(payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : '');
      setNotes(payment.notes || '');
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installmentNumber: payment.installmentNumber,
          action: 'edit',
          amount: parseFloat(amount),
          dueDate,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update schedule');
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
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '380px', maxWidth: '90%' }}>
        <h3 style={{ marginTop: 0, marginBottom: '6px', color: '#2a3142' }}>Edit Schedule - #{payment.installmentNumber}</h3>
        <p style={{ fontSize: '13px', color: '#525f80', marginBottom: '16px' }}>
          Adjust the scheduled amount and due date for this installment.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Scheduled Amount (SAR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px', height: '60px', resize: 'none' }}
            />
          </div>
          {error && <div style={{ color: '#ec4561', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: '#f8f9fa', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: '#28aaa9', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Saving...' : 'Update Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RevertPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  saleId: string;
  payment: Payment | null;
}

function RevertPaymentModal({ isOpen, onClose, onSave, saleId, payment }: RevertPaymentModalProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !payment) return null;

  const handleRevert = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/sales/installments/${saleId}/payments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installmentNumber: payment.installmentNumber,
          action: 'revert',
          notes: notes ? `[Reverted]: ${notes}` : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revert payment');
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
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', width: '420px', maxWidth: '90%' }}>
        <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#ec4561' }}>Revert Payment #{payment.installmentNumber}</h3>
        <p style={{ fontSize: '14px', color: '#525f80', lineHeight: '1.5', marginBottom: '16px' }}>
          This will change the status of installment <strong>#{payment.installmentNumber}</strong> from <strong>Paid</strong> back to <strong>Pending / Overdue</strong>.
          <br /><br />
          The recorded payment of <strong>SAR {(payment.paidAmount || payment.amount).toLocaleString()}</strong> will be deducted from Total Paid, the remaining balance will be restored, and related income transaction records will be cancelled.
        </p>
        <form onSubmit={handleRevert}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Reason / Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Payment recorded with wrong cheque / entry error"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px', height: '70px', resize: 'none' }}
            />
          </div>
          {error && <div style={{ color: '#ec4561', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: '#f8f9fa', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: '#ec4561', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Reverting...' : 'Confirm Revert'}
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
