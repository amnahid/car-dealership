'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface VehicleDoc {
  _id: string;
  carId: string;
  documentType: string;
  expiryDate: string;
  issueDate: string;
  fileName: string;
  car?: { carId: string; brand: string; model: string };
}

function getExpiryClass(expiryDate: string): string {
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'bg-red-100 text-red-800';
  if (days <= 7) return 'text-red-600 font-semibold';
  if (days <= 15) return 'text-yellow-600 font-semibold';
  if (days <= 30) return 'text-orange-500 font-medium';
  return '';
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<VehicleDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?page=${page}&limit=15`);
      const data = await res.json();
      setDocuments(data.documents || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Documents</h2>
        <Link href="/dashboard/documents/new" className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-indigo-500">
          + Add Document
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No documents found.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Car ID', 'Type', 'Issue Date', 'Expiry Date', 'File', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documents.map((doc) => {
                const daysLeft = Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / 86400000);
                return (
                  <tr key={doc._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-indigo-600">{doc.carId}</td>
                    <td className="px-4 py-3">{doc.documentType}</td>
                    <td className="px-4 py-3">{new Date(doc.issueDate).toLocaleDateString()}</td>
                    <td className={`px-4 py-3 ${getExpiryClass(doc.expiryDate)}`}>
                      {new Date(doc.expiryDate).toLocaleDateString()}
                      {daysLeft <= 30 && daysLeft >= 0 && (
                        <span className="ml-1 text-xs">({daysLeft}d left)</span>
                      )}
                      {daysLeft < 0 && <span className="ml-1 text-xs">(Expired)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{doc.fileName || '-'}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/documents/${doc._id}`} className="text-indigo-600 hover:underline">View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-end">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Prev</button>
          <span className="px-3 py-1 text-sm">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
