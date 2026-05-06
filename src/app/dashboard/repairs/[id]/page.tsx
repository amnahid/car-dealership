'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import EditRepairModal from '@/components/EditRepairModal';

interface Repair {
  _id: string;
  carId: string;
  repairDescription: string;
  partsReplaced: string;
  laborCost: number;
  repairCost: number;
  totalCost: number;
  repairDate: string;
  status: string;
  beforeImages: string[];
  afterImages: string[];
  car?: { 
    _id: string; 
    carId: string; 
    brand: string; 
    model: string;
    year: number;
    plateNumber?: string;
    chassisNumber?: string;
    engineNumber?: string;
    sequenceNumber?: string;
    color?: string;
  };
}

interface Car {
  _id: string;
  carId: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  plateNumber?: string;
}

export default function RepairDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [repair, setRepair] = useState<Repair | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    fetch(`/api/repairs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Repair not found');
        return res.json();
      })
      .then((data) => {
        setRepair(data.repair);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load repair');
      })
      .finally(() => setLoading(false));

    fetch('/api/cars?limit=100')
      .then(res => res.json())
      .then(data => setCars(data.cars || []))
      .catch(console.error);
  }, [params?.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this repair?')) return;
    if (!confirm('This action cannot be undone. Continue?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/repairs/${repair?._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
        return;
      }
      router.push('/dashboard/repairs');
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdate = async (data: Partial<Repair>) => {
    try {
      const res = await fetch(`/api/repairs/${repair?._id}`, {
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
      setRepair(updated.repair);
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>;
  }

  if (error || !repair) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ec4561' }}>
        {error || 'Repair not found'}
        <div style={{ marginTop: '16px' }}>
          <Link href="/dashboard/repairs" style={{ color: '#28aaa9' }}>← Back to Repairs</Link>
        </div>
      </div>
    );
  }

  const statusStyles: Record<string, { background: string; color: string }> = {
    Pending: { background: '#f8b425', color: '#ffffff' },
    'In Progress': { background: '#38a4f8', color: '#ffffff' },
    Completed: { background: '#42ca7f', color: '#ffffff' },
    Cancelled: { background: '#ec4561', color: '#ffffff' },
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/repairs" style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Repairs
        </Link>
      </div>

      <h2 className="page-title" style={{ marginBottom: '24px' }}>Repair Details</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Repair Information</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Car ID</span>
              <span style={{ color: '#28aaa9', fontWeight: 600, fontFamily: 'monospace' }}>{repair.carId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Status</span>
              <span style={{ padding: '4px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500, background: statusStyles[repair.status]?.background, color: statusStyles[repair.status]?.color }}>{repair.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Repair Date</span>
              <span style={{ color: '#2a3142' }}>{new Date(repair.repairDate).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Labor Cost</span>
              <span style={{ color: '#2a3142' }}>SAR {(repair.laborCost || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3' }}>Parts Cost</span>
              <span style={{ color: '#2a3142' }}>SAR {(repair.repairCost || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca8b3', fontWeight: 600 }}>Total Cost</span>
              <span style={{ color: '#2a3142', fontWeight: 600 }}>SAR {(repair.totalCost || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Description</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <span style={{ color: '#9ca8b3', display: 'block', marginBottom: '4px' }}>Repair Description</span>
              <p style={{ color: '#2a3142', margin: 0 }}>{repair.repairDescription}</p>
            </div>
            {repair.partsReplaced && (
              <div>
                <span style={{ color: '#9ca8b3', display: 'block', marginBottom: '4px' }}>Parts Replaced</span>
                <p style={{ color: '#2a3142', margin: 0 }}>{repair.partsReplaced}</p>
              </div>
            )}
          </div>
        </div>

        {(repair.beforeImages?.length > 0 || repair.afterImages?.length > 0) && (
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px' }}>Images</h3>
            {repair.beforeImages?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ color: '#9ca8b3', display: 'block', marginBottom: '8px' }}>Before</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {repair.beforeImages.map((img, i) => (
                    <img key={i} src={img} alt={`Before ${i + 1}`} style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '4px' }} />
                  ))}
                </div>
              </div>
            )}
            {repair.afterImages?.length > 0 && (
              <div>
                <span style={{ color: '#9ca8b3', display: 'block', marginBottom: '8px' }}>After</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {repair.afterImages.map((img, i) => (
                    <img key={i} src={img} alt={`After ${i + 1}`} style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '4px' }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={() => setShowEditModal(true)}
          style={{ padding: '10px 20px', fontSize: '14px', border: 'none', borderRadius: '3px', background: '#28aaa9', color: '#ffffff', cursor: 'pointer' }}
        >
          Edit Repair
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #ec4561', borderRadius: '3px', background: '#ffffff', color: '#ec4561', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}
        >
          {deleting ? 'Deleting...' : 'Delete Repair'}
        </button>
      </div>

      {showEditModal && repair && (
        <EditRepairModal repair={repair} cars={cars} onClose={() => setShowEditModal(false)} onSave={handleUpdate} />
      )}
    </div>
  );
}
