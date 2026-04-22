'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface DocData {
  _id: string;
  carId: string;
  documentType: string;
  issueDate: string;
  expiryDate: string;
  fileUrl: string;
  fileName: string;
  notes: string;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/documents/${id}`)
        .then(r => r.json())
        .then(data => {
          setDoc(data.document);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>;
  if (!doc) return <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Document not found</div>;

  const daysLeft = Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / 86400000);

  return (
    <div style={{ maxWidth: '600px' }}>
      <Link href="/dashboard/documents" style={{ color: '#28aaa9', textDecoration: 'none', fontSize: '14px' }}>← Documents</Link>
      <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#2a3142', marginTop: '8px' }}>{doc.documentType}</h2>
      <p style={{ color: '#525f80', fontFamily: 'monospace', fontSize: '14px' }}>{doc.carId}</p>

      {daysLeft <= 30 && daysLeft >= 0 && (
        <div style={{ marginTop: '16px', padding: '12px', background: daysLeft <= 7 ? '#fff5f5' : '#fffbf0', border: `1px solid ${daysLeft <= 7 ? '#ec4561' : '#f5a623'}`, borderRadius: '4px' }}>
          <span style={{ color: daysLeft <= 7 ? '#ec4561' : '#f5a623', fontWeight: 600 }}>Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>
        </div>
      )}
      {daysLeft < 0 && (
        <div style={{ marginTop: '16px', padding: '12px', background: '#fff5f5', border: '1px solid #ec4561', borderRadius: '4px', color: '#ec4561', fontWeight: 600 }}>
          This document has expired
        </div>
      )}

      <div className="card" style={{ marginTop: '20px', padding: '20px' }}>
        <table style={{ width: '100%', fontSize: '14px' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '12px', color: '#525f80' }}>Issue Date</td>
              <td style={{ padding: '12px', fontWeight: 500 }}>{new Date(doc.issueDate).toLocaleDateString()}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '12px', color: '#525f80' }}>Expiry Date</td>
              <td style={{ padding: '12px', fontWeight: 500 }}>{new Date(doc.expiryDate).toLocaleDateString()}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '12px', color: '#525f80' }}>File</td>
              <td style={{ padding: '12px' }}>
                {doc.fileUrl ? (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#28aaa9', textDecoration: 'none' }}>{doc.fileName || 'View File'}</a>
                ) : '-'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '12px', color: '#525f80' }}>Notes</td>
              <td style={{ padding: '12px' }}>{doc.notes || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <Link href={`/dashboard/documents/${id}/edit`} style={{ padding: '10px 20px', background: '#28aaa9', color: '#fff', borderRadius: '3px', textDecoration: 'none' }}>Edit</Link>
      </div>
    </div>
  );
}