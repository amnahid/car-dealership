'use client';

import { useEffect, useState } from 'react';
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
  nationalId?: string;
  drivingLicense?: string;
  profilePhoto?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  createdAt: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      })
      .catch((err) => {
        setError(err.message || 'Failed to load customer');
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

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
              <span style={{ color: '#2a3142', textAlign: 'right', maxWidth: '200px' }}>{customer.address}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Documents & Emergency</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>National ID</span>
              <span style={{ color: '#2a3142', fontFamily: 'monospace' }}>{customer.nationalId || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Driving License</span>
              <span style={{ color: '#2a3142', fontFamily: 'monospace' }}>{customer.drivingLicense || '-'}</span>
            </div>
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
