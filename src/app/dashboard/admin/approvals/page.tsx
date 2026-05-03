'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

interface EditRequest {
  _id: string;
  targetModel: string;
  targetId: string;
  requestedBy: {
    name: string;
    email: string;
  };
  proposedChanges: Record<string, any>;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewNotes?: string;
  createdAt: string;
}

export default function ApprovalsPage() {
  const t = useTranslations('Approvals');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [selectedRequest, setSelectedRequest] = useState<EditRequest | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/approvals?status=${statusFilter}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleProcess = async (action: 'Approve' | 'Reject') => {
    if (!selectedRequest) return;
    setProcessing(true);

    try {
      const res = await fetch(`/api/admin/approvals/${selectedRequest._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });

      if (res.ok) {
        setSelectedRequest(null);
        setNotes('');
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to process request');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const getModelLabel = (model: string) => {
    switch (model) {
      case 'Car': return 'Vehicle';
      case 'CashSale': return 'Cash Sale';
      case 'InstallmentSale': return 'Installment';
      case 'Rental': return 'Rental';
      case 'Customer': return 'Customer';
      case 'Transaction': return 'Transaction';
      case 'Document': return 'Document';
      default: return model;
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 className="page-title" style={{ marginBottom: '24px' }}>Admin Approvals</h2>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <button 
          onClick={() => setStatusFilter('Pending')}
          style={{ 
            padding: '8px 16px', 
            background: statusFilter === 'Pending' ? '#28aaa9' : '#fff',
            color: statusFilter === 'Pending' ? '#fff' : '#525f80',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Pending
        </button>
        <button 
          onClick={() => setStatusFilter('Approved')}
          style={{ 
            padding: '8px 16px', 
            background: statusFilter === 'Approved' ? '#28aaa9' : '#fff',
            color: statusFilter === 'Approved' ? '#fff' : '#525f80',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Approved
        </button>
        <button 
          onClick={() => setStatusFilter('Rejected')}
          style={{ 
            padding: '8px 16px', 
            background: statusFilter === 'Rejected' ? '#28aaa9' : '#fff',
            color: statusFilter === 'Rejected' ? '#fff' : '#525f80',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Rejected
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No approval requests found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '800px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>Module</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>Target ID</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>Requested By</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>
                        {getModelLabel(req.targetModel)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>{req.targetId}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{req.requestedBy?.name}</div>
                      <div style={{ fontSize: '12px', color: '#9ca8b3' }}>{req.requestedBy?.email}</div>
                    </td>
                    <td style={{ padding: '12px' }}>{new Date(req.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        onClick={() => setSelectedRequest(req)}
                        style={{ color: '#28aaa9', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedRequest(null)}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '600px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto', textAlign: isRtl ? 'right' : 'left' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Review Edit Request</h3>
            
            <div style={{ marginBottom: '20px', padding: '12px', background: '#f8f9fa', borderRadius: '4px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '14px' }}><strong>Module:</strong> {getModelLabel(selectedRequest.targetModel)}</p>
              <p style={{ margin: '0 0 8px', fontSize: '14px' }}><strong>Requested By:</strong> {selectedRequest.requestedBy?.name}</p>
              <p style={{ margin: 0, fontSize: '14px' }}><strong>Target ID:</strong> {selectedRequest.targetId}</p>
            </div>

            <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Proposed Changes:</h4>
            <div style={{ background: '#2d2d2d', color: '#f8f8f2', padding: '16px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
              {JSON.stringify(selectedRequest.proposedChanges, null, 2)}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Review Notes</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter notes for approval or rejection..."
                style={{ width: '100%', height: '80px', padding: '12px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '14px', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <button 
                onClick={() => setSelectedRequest(null)}
                style={{ padding: '10px 20px', background: '#fff', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              {selectedRequest.status === 'Pending' && (
                <>
                  <button 
                    onClick={() => handleProcess('Reject')}
                    disabled={processing}
                    style={{ padding: '10px 20px', background: '#ec4561', color: '#fff', border: 'none', borderRadius: '4px', cursor: processing ? 'not-allowed' : 'pointer' }}
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleProcess('Approve')}
                    disabled={processing}
                    style={{ padding: '10px 20px', background: '#42ca7f', color: '#fff', border: 'none', borderRadius: '4px', cursor: processing ? 'not-allowed' : 'pointer' }}
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
