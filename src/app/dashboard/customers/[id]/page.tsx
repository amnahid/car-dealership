'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import EditCustomerModal from '@/components/EditCustomerModal';
import ImageUpload from '@/components/ImageUpload';

interface Customer {
  _id: string;
  customerId: string;
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  nationalIdDocument?: string;
  drivingLicenseDocument?: string;
  iqamaDocument?: string;
  profilePhoto?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  createdAt: string;
  customerType?: 'Individual' | 'Business';
  vatRegistrationNumber?: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cashSales, setCashSales] = useState<Record<string, unknown>[]>([]);
  const [rentals, setRentals] = useState<Record<string, unknown>[]>([]);
  const [installments, setInstallments] = useState<Record<string, unknown>[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async (id: string) => {
    setHistoryLoading(true);
    try {
      const [cashRes, rentalRes, installmentRes] = await Promise.all([
        fetch(`/api/sales/cash?limit=1000&customer=${id}`),
        fetch(`/api/sales/rentals?limit=1000&customer=${id}`),
        fetch(`/api/sales/installments?limit=1000&customer=${id}`),
      ]);
      const [cashData, rentalData, installmentData] = await Promise.all([
        cashRes.json(),
        rentalRes.json(),
        installmentRes.json(),
      ]);
      setCashSales(cashData.sales || []);
      setRentals(rentalData.rentals || []);
      setInstallments(installmentData.installments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    fetch(`/api/customers/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Customer not found');
        return res.json();
      })
      .then((data) => {
        setCustomer(data.customer);
        fetchHistory(id as string);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load customer');
      })
      .finally(() => setLoading(false));
  }, [params?.id, fetchHistory]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    if (!confirm('This action cannot be undone. Continue?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/customers/${customer?._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
        return;
      }
      router.push('/dashboard/customers');
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdate = async (data: Partial<Customer>) => {
    try {
      const res = await fetch(`/api/customers/${customer?._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const resData = await res.json();
        alert(resData.error || 'Failed to update');
        return;
      }
      const updated = await res.json();
      setCustomer(updated.customer);
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>;
  }

  if (error || !customer) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ec4561' }}>
        {error || 'Customer not found'}
        <div style={{ marginTop: '16px' }}>
          <Link href="/dashboard/customers" style={{ color: '#28aaa9' }}>← Back to Customers</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/customers" style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Customers
        </Link>
      </div>

      <h2 className="page-title" style={{ marginBottom: '24px' }}>Customer Details</h2>

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <ImageUpload value={customer.profilePhoto} onChange={async (url) => {
              const res = await fetch(`/api/customers/${customer._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profilePhoto: url }),
              });
              if (res.ok) setCustomer({ ...customer, profilePhoto: url });
            }} folder="customers" label={customer.fullName} size={80} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Personal Information</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Customer ID</span>
              <span style={{ color: '#28aaa9', fontWeight: 600, fontFamily: 'monospace' }}>{customer.customerId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Full Name</span>
              <span style={{ color: '#2a3142', fontWeight: 500 }}>{customer.fullName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Phone</span>
              <span style={{ color: '#2a3142' }}>{customer.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Email</span>
              <span style={{ color: '#2a3142' }}>{customer.email || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Address</span>
              <span style={{ color: '#2a3142', textAlign: 'right', maxWidth: '200px' }}>
                {customer.buildingNumber} {customer.streetName}, {customer.district}, {customer.city} {customer.postalCode}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Customer Type</span>
              <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: customer.customerType === 'Business' ? '#e3f2fd' : '#f3e5f5', color: customer.customerType === 'Business' ? '#1565c0' : '#6a1b9a' }}>
                {customer.customerType || 'Individual'}
              </span>
            </div>
            {customer.vatRegistrationNumber && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca8b3' }}>VAT / TRN</span>
                <span style={{ color: '#2a3142', fontFamily: 'monospace' }}>{customer.vatRegistrationNumber}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Documents & Emergency</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {customer.nationalIdDocument ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca8b3' }}>National ID</span>
                <a href={customer.nationalIdDocument} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', fontSize: '14px' }}>View Document</a>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca8b3' }}>National ID</span>
                <span style={{ color: '#9ca8b3' }}>-</span>
              </div>
            )}
            {customer.drivingLicenseDocument ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca8b3' }}>Driving License</span>
                <a href={customer.drivingLicenseDocument} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', fontSize: '14px' }}>View Document</a>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca8b3' }}>Driving License</span>
                <span style={{ color: '#9ca8b3' }}>-</span>
              </div>
            )}
            {customer.iqamaDocument ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca8b3' }}>Iqama</span>
                <a href={customer.iqamaDocument} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', fontSize: '14px' }}>View Document</a>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca8b3' }}>Iqama</span>
                <span style={{ color: '#9ca8b3' }}>-</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Emergency Contact</span>
              <span style={{ color: '#2a3142' }}>{customer.emergencyContactName || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Emergency Phone</span>
              <span style={{ color: '#2a3142' }}>{customer.emergencyContactPhone || '-'}</span>
            </div>
          </div>
        </div>

        {(customer.notes || customer.createdAt) && (
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Additional Info</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {customer.createdAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca8b3' }}>Created</span>
                  <span style={{ color: '#525f80' }}>{new Date(customer.createdAt).toLocaleDateString()}</span>
                </div>
              )}
              {customer.notes && (
                <div>
                  <span style={{ color: '#9ca8b3', display: 'block', marginBottom: '4px' }}>Notes</span>
                  <p style={{ color: '#2a3142', margin: 0, whiteSpace: 'pre-wrap' }}>{customer.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Transaction History</h3>
        {historyLoading ? (
          <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
        ) : (
          <>
            {cashSales.length > 0 && (
              <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#2a3142', marginBottom: '16px', marginTop: 0 }}>Purchases ({cashSales.length})</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '14px' }}>
                    <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                      <tr>
                        {['Date', 'Car', 'Amount', 'Status'].map(h => <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {cashSales.map((sale) => {
                        const carData = sale.car as Record<string, unknown> | undefined;
                        return (
                        <tr key={sale._id as string} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '12px' }}>{new Date(sale.saleDate as string).toLocaleDateString()}</td>
                          <td style={{ padding: '12px' }}>{String(carData?.brand || '')} {String(carData?.model || '')}</td>
                          <td style={{ padding: '12px', fontWeight: 600, color: '#42ca7f' }}>SAR {(Number(sale.finalPrice) || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px' }}><span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', background: sale.status === 'Cancelled' ? '#ec456120' : '#42ca7f20', color: sale.status === 'Cancelled' ? '#ec4561' : '#42ca7f' }}>{sale.status === 'Cancelled' ? 'Cancelled' : 'Completed'}</span></td>
                        </tr>);
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {rentals.length > 0 && (
              <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#2a3142', marginBottom: '16px', marginTop: 0 }}>Rentals ({rentals.length})</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '14px' }}>
                    <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                      <tr>
                        {['Date', 'Car', 'Amount', 'Status'].map(h => <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80' }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {rentals.map((rental) => {
                        const carData = rental.car as Record<string, unknown> | undefined;
                        return (
                        <tr key={rental._id as string} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '12px' }}>{new Date(rental.startDate as string).toLocaleDateString()}</td>
                          <td style={{ padding: '12px' }}>{String(carData?.brand || '')} {String(carData?.model || '')}</td>
                          <td style={{ padding: '12px', fontWeight: 600, color: '#42ca7f' }}>SAR {(Number(rental.totalAmount) || 0).toLocaleString()}</td>
                          <td style={{ padding: '12px' }}><span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', background: rental.status === 'Cancelled' ? '#ec456120' : '#42ca7f20', color: rental.status === 'Cancelled' ? '#ec4561' : '#42ca7f' }}>{String(rental.status) || 'Active'}</span></td>
                        </tr>);
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {installments.length > 0 && (
              <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#2a3142', marginBottom: '16px', marginTop: 0 }}>Installment Plans ({installments.length})</h4>
                {installments.map((inst) => {
                  const carData = inst.car as Record<string, unknown> | undefined;
                  const payments = (inst.payments as Record<string, unknown>[]) || [];
                  const totalPaid = payments.filter((p) => p.paid).reduce((sum, p) => sum + Number(p.amount || 0), 0);
                  const outstanding = Number(inst.totalPrice || 0) - totalPaid;
                  return (
                  <div key={inst._id as string} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                      <div><span style={{ color: '#9ca8b3', fontSize: '12px' }}>Car</span><p style={{ margin: '4px 0', fontWeight: 500 }}>{String(carData?.brand || '')} {String(carData?.model || '')}</p></div>
                      <div><span style={{ color: '#9ca8b3', fontSize: '12px' }}>Total</span><p style={{ margin: '4px 0', fontWeight: 600 }}>SAR {(Number(inst.totalPrice) || 0).toLocaleString()}</p></div>
                      <div><span style={{ color: '#9ca8b3', fontSize: '12px' }}>Outstanding</span><p style={{ margin: '4px 0', fontWeight: 600, color: outstanding > 0 ? '#ec4561' : '#42ca7f' }}>SAR {(outstanding || 0).toLocaleString()}</p></div>
                    </div>
                  </div>);
                })}
              </div>
            )}
            {cashSales.length === 0 && rentals.length === 0 && installments.length === 0 && (
              <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#9ca8b3' }}>No transaction history found.</div>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={() => setShowEditModal(true)}
          style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: 'pointer' }}
        >
          Edit Customer
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ec4561', borderRadius: '3px', background: '#ffffff', color: '#ec4561', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}
        >
          {deleting ? 'Deleting...' : 'Delete Customer'}
        </button>
      </div>

      {showEditModal && (
        <EditCustomerModal customer={customer} onClose={() => setShowEditModal(false)} onSave={handleUpdate} />
      )}
    </div>
  );
}
