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

  const statusColor: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Repairs</h2>
        <Link href="/dashboard/repairs/new" className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-indigo-500">
          + Add Repair
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : repairs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No repairs found.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Car ID', 'Description', 'Total Cost', 'Repair Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {repairs.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-indigo-600">{r.carId}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{r.repairDescription}</td>
                  <td className="px-4 py-3">${r.totalCost?.toLocaleString()}</td>
                  <td className="px-4 py-3">{new Date(r.repairDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[r.status] || 'bg-gray-100 text-gray-800'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/repairs/${r._id}`} className="text-indigo-600 hover:underline">View</Link>
                  </td>
                </tr>
              ))}
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
