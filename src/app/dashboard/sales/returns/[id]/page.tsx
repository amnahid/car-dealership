'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface PurchaseReturn {
  _id: string;
  returnId: string;
  originalSaleId: string;
  saleType: 'Cash' | 'Installment' | 'Rental';
  carId: string;
  customerName: string;
  customerPhone: string;
  originalPrice: number;
  refundAmount: number;
  penaltyAmount: number;
  conditionNotes?: string;
  returnDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  notes?: string;
  createdAt: string;
  approvedAt?: string;
  car?: { _id: string; carId: string; brand: string; model: string; images: string[] };
  customer?: { _id: string; fullName: string; phone: string; profilePhoto?: string };
}

export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [ret, setRet] = useState<PurchaseReturn | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/sales/returns/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setRet(data.return);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this return request?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/sales/returns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard/sales/returns');
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete return');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/sales/returns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setRet(data.return);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#f5a623';
      case 'Approved': return '#28aaa9';
      case 'Rejected': return '#ec4561';
      case 'Completed': return '#42ca7f';
      default: return '#9ca8b3';
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>;
  }

  if (!ret) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#ec4561' }}>Return not found</div>;
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <Link href="/dashboard/sales/returns" style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>← Back to Returns</Link>
          <h2 className="page-title" style={{ marginTop: '8px' }}>Return Details</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: '8px 16px',
              borderRadius: '3px',
              fontSize: '14px',
              fontWeight: 600,
              background: '#ec456110',
              color: '#ec4561',
              border: '1px solid #ec4561',
              cursor: deleting ? 'not-allowed' : 'pointer',
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? 'Deleting...' : 'Delete Request'}
          </button>
          <span style={{ padding: '8px 16px', borderRadius: '3px', fontSize: '14px', fontWeight: 600, background: getStatusColor(ret.status) + '20', color: getStatusColor(ret.status) }}>
            {ret.status}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>Car Information</h3>
          {ret.car?.images?.[0] && (
            <img src={ret.car.images[0]} alt="" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '16px' }} />
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
            <div><span style={{ color: '#9ca8b3' }}>Car ID:</span></div>
            <div style={{ fontFamily: 'monospace', color: '#28aaa9' }}>{ret.carId}</div>
            <div><span style={{ color: '#9ca8b3' }}>Brand:</span></div>
            <div>{ret.car?.brand || '-'}</div>
            <div><span style={{ color: '#9ca8b3' }}>Model:</span></div>
            <div>{ret.car?.model || '-'}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>Customer Information</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            {ret.customer?.profilePhoto ? (
              <img src={ret.customer.profilePhoto} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#28aaa9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: 600 }}>
                {ret.customerName?.[0] || '?'}
              </div>
            )}
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{ret.customerName}</div>
              <div style={{ fontSize: '14px', color: '#9ca8b3' }}>{ret.customerPhone}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>Transaction Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
            <div><span style={{ color: '#9ca8b3' }}>Return ID:</span></div>
            <div style={{ fontFamily: 'monospace', color: '#28aaa9' }}>{ret.returnId}</div>
            <div><span style={{ color: '#9ca8b3' }}>Original Sale ID:</span></div>
            <div style={{ fontFamily: 'monospace' }}>{ret.originalSaleId}</div>
            <div><span style={{ color: '#9ca8b3' }}>Sale Type:</span></div>
            <div>{ret.saleType}</div>
            <div><span style={{ color: '#9ca8b3' }}>Return Date:</span></div>
            <div>{ret.returnDate ? new Date(ret.returnDate).toLocaleDateString() : '-'}</div>
            <div><span style={{ color: '#9ca8b3' }}>Created:</span></div>
            <div>{ret.createdAt ? new Date(ret.createdAt).toLocaleString() : '-'}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>Financial Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
            <div><span style={{ color: '#9ca8b3' }}>Original Price:</span></div>
            <div style={{ fontWeight: 600 }}>SAR{(ret.originalPrice || 0).toLocaleString()}</div>
            <div><span style={{ color: '#9ca8b3' }}>Refund Amount:</span></div>
            <div style={{ color: '#42ca7f', fontWeight: 600 }}>SAR{(ret.refundAmount || 0).toLocaleString()}</div>
            <div><span style={{ color: '#9ca8b3' }}>Penalty Amount:</span></div>
            <div style={{ color: '#ec4561' }}>SAR{(ret.penaltyAmount || 0).toLocaleString()}</div>
            <div><span style={{ color: '#9ca8b3' }}>Net Refund:</span></div>
            <div style={{ color: '#28aaa9', fontWeight: 700, fontSize: '18px' }}>SAR{((ret.refundAmount || 0) - (ret.penaltyAmount || 0)).toLocaleString()}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>Condition & Notes</h3>
          <div style={{ fontSize: '14px' }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#9ca8b3' }}>Condition Notes:</span>
              <p style={{ margin: '4px 0 0' }}>{ret.conditionNotes || '-'}</p>
            </div>
            <div>
              <span style={{ color: '#9ca8b3' }}>Notes:</span>
              <p style={{ margin: '4px 0 0' }}>{ret.notes || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {ret.status === 'Pending' && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button onClick={() => handleStatusUpdate('Rejected')} disabled={updating} style={{ background: '#ec4561', color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '12px 24px', borderRadius: '3px', border: '1px solid #ec4561', cursor: updating ? 'not-allowed' : 'pointer' }}>
            Reject Return
          </button>
          <button onClick={() => handleStatusUpdate('Approved')} disabled={updating} style={{ background: '#28aaa9', color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '12px 24px', borderRadius: '3px', border: '1px solid #28aaa9', cursor: updating ? 'not-allowed' : 'pointer' }}>
            Approve Return
          </button>
        </div>
      )}

      {ret.status === 'Approved' && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button onClick={() => handleStatusUpdate('Completed')} disabled={updating} style={{ background: '#42ca7f', color: '#ffffff', fontSize: '14px', fontWeight: 500, padding: '12px 24px', borderRadius: '3px', border: '1px solid #42ca7f', cursor: updating ? 'not-allowed' : 'pointer' }}>
            Mark Completed
          </button>
        </div>
      )}
    </div>
  );
}