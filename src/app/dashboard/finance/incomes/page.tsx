'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Income {
  _id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
}

interface Summary {
  total: number;
  count: number;
  byCategory: Record<string, number>;
  byMonth: Record<string, number>;
}

const COLORS = ['#42ca7f', '#28aaa9', '#f8b425', '#5b6be7', '#a16ae7', '#e75be7', '#ec4561', '#28a7e7'];

function IncomesContent() {
  const searchParams = useSearchParams();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({ total: 0, count: 0, byCategory: {}, byMonth: {} });
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [preset, setPreset] = useState('thisMonth');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '20' });
    if (dateRange.startDate) params.set('startDate', dateRange.startDate);
    if (dateRange.endDate) params.set('endDate', dateRange.endDate);

    try {
      const res = await fetch(`/api/reports/incomes?${params}`);
      const data = await res.json();
      setIncomes(data.incomes || []);
      setSummary(data.summary || { total: 0, count: 0, byCategory: {}, byMonth: {} });
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, page]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  useEffect(() => {
    const preset = searchParams.get('preset') || 'thisMonth';
    setPreset(preset);
    const now = new Date();
    let start: Date, end: Date = now;

    switch (preset) {
      case 'today':
        start = now;
        break;
      case 'thisWeek':
        start = new Date(now.setDate(now.getDate() - now.getDay()));
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
    setPage(1);
  }, [searchParams]);

  const categoryData = Object.entries(summary.byCategory).map(([name, value]) => ({ name, value }));
  const monthData = Object.entries(summary.byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month: month.slice(5), amount }));

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const now = new Date();
    let start: Date, end: Date = now;

    switch (value) {
      case 'today':
        start = now;
        break;
      case 'thisWeek':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        return;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
    setPage(1);
  };

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const csv = ['Date,Category,Description,Amount'];
    incomes.forEach(i => csv.push(`${i.date},${i.category},"${i.description}",${i.amount}`));
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'incomes.csv';
    a.click();
  };

  const handleExportExcel = () => {
    const xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
    const workbook = `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
      <Worksheet ss:Name="Incomes"><Table>
        <Row><Cell><Data ss:Type="String">Date</Data></Cell><Cell><Data ss:Type="String">Category</Data></Cell><Cell><Data ss:Type="String">Description</Data></Cell><Cell><Data ss:Type="String">Amount</Data></Cell></Row>
        ${incomes.map(i => `<Row><Cell><Data ss:Type="String">${i.date}</Data></Cell><Cell><Data ss:Type="String">${i.category}</Data></Cell><Cell><Data ss:Type="String">${i.description.replace(/"/g, '&quot;')}</Data></Cell><Cell><Data ss:Type="Number">${i.amount}</Data></Cell></Row>`).join('')}
      </Table></Worksheet></Workbook>`;
    const blob = new Blob([xml + workbook], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'incomes.xls';
    a.click();
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 className="page-title">Incomes</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handlePrint} style={{ background: '#5b6be7', color: '#fff', padding: '8px 16px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Print</button>
          <button onClick={handleExportCSV} style={{ background: '#42ca7f', color: '#fff', padding: '8px 16px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>CSV</button>
          <button onClick={handleExportExcel} style={{ background: '#28aaa9', color: '#fff', padding: '8px 16px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Excel</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #42ca7f' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Total Income</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#42ca7f', margin: '4px 0 0' }}>SAR {summary.total.toLocaleString()}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f8b425' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Transactions</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#f8b425', margin: '4px 0 0' }}>{summary.count}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #28aaa9' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Average</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#28aaa9', margin: '4px 0 0' }}>SAR {summary.count > 0 ? Math.round(summary.total / summary.count).toLocaleString() : 0}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #5b6be7' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Categories</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#5b6be7', margin: '4px 0 0' }}>{Object.keys(summary.byCategory).length}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {['today', 'thisWeek', 'thisMonth', 'thisYear', 'custom'].map(p => (
          <button
            key={p}
            onClick={() => handlePresetChange(p)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              borderRadius: '3px',
              border: '1px solid #ced4da',
              background: preset === p ? '#28aaa9' : '#ffffff',
              color: preset === p ? '#ffffff' : '#525f80',
              cursor: 'pointer',
            }}
          >
            {p === 'thisWeek' ? 'This Week' : p === 'thisMonth' ? 'This Month' : p === 'thisYear' ? 'This Year' : p === 'today' ? 'Today' : 'Custom'}
          </button>
        ))}
        {preset === 'custom' && (
          <>
            <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} style={{ height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
            <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} style={{ height: '40px', fontSize: '14px', borderRadius: '0', padding: '0 12px', border: '1px solid #ced4da' }} />
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#525f80' }}>Income by Category</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`SAR ${Number(value).toLocaleString()}`, 'Amount']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#525f80' }}>Monthly Income</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value) => [`SAR ${Number(value).toLocaleString()}`, 'Amount']} />
              <Bar dataKey="amount" fill="#42ca7f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
        ) : incomes.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No incomes found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '600px' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  {['Date', 'Category', 'Description', 'Amount'].map(h => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #eee' }}>
                {incomes.map(inc => (
                  <tr key={inc._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px', color: '#525f80' }}>{new Date(inc.date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>{inc.category}</td>
                    <td style={{ padding: '12px' }}>{inc.description}</td>
                    <td style={{ padding: '12px', fontWeight: 600, color: '#42ca7f' }}>SAR {inc.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>Prev</button>
          <span style={{ padding: '8px 12px', fontSize: '12px', color: '#525f80' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>Next</button>
        </div>
      )}
    </div>
  );
}

export default function IncomesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IncomesContent />
    </Suspense>
  );
}