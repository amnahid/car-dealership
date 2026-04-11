'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Repair {
  _id: string;
  carId: string;
  repairDescription: string;
  totalCost: number;
  repairDate: string;
  status: string;
  car?: { carId: string; brand: string; model: string };
}

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRepairs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/repairs?page=${page}&limit=15`);
      const data = await res.json();
      setRepairs(data.repairs || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  const statusStyles: Record<string, { background: string; color: string }> = {
    Pending: { background: '#f8b425', color: '#ffffff' },
    'In Progress': { background: '#38a4f8', color: '#ffffff' },
    Completed: { background: '#42ca7f', color: '#ffffff' },
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <h2 className="page-title">Repairs</h2>
        <Link
          href="/dashboard/repairs/new"
          style={{
            background: '#28aaa9',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 500,
            padding: '10px 16px',
            borderRadius: '3px',
            textDecoration: 'none',
            border: '1px solid #28aaa9',
          }}
        >
          + Add Repair
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
        ) : repairs.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No repairs found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '700px' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                {['Car ID', 'Description', 'Total Cost', 'Repair Date', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#525f80',
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ borderBottom: '1px solid #eee' }}>
              {repairs.map((r) => (
                <tr key={r._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#28aaa9' }}>{r.carId}</td>
                  <td style={{ padding: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.repairDescription}
                  </td>
                  <td style={{ padding: '12px' }}>${r.totalCost?.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>{new Date(r.repairDate).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        borderRadius: '3px',
                        ...(statusStyles[r.status] || { background: '#adb5bd', color: '#ffffff' }),
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Link href={`/dashboard/repairs/${r._id}`} style={{ color: '#28aaa9', textDecoration: 'none' }}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              border: '1px solid #ced4da',
              borderRadius: '3px',
              background: '#ffffff',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            Prev
          </button>
          <span style={{ padding: '8px 12px', fontSize: '12px', color: '#525f80' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              border: '1px solid #ced4da',
              borderRadius: '3px',
              background: '#ffffff',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}