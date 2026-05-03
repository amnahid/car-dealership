'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTranslations, useLocale } from 'next-intl';
import { DateRangeFilter } from '@/components/DateRangeFilter';

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
  const t = useTranslations('Incomes');
  const commonT = useTranslations('Common');
  const financeT = useTranslations('Finance');
  const expensesT = useTranslations('Expenses');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({ total: 0, count: 0, byCategory: {}, byMonth: {} });
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
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
    setPage(1);
  }, [dateRange]);

  const getCategoryLabel = (cat: string) => {
    const key = cat.replace(' ', '').charAt(0).toLowerCase() + cat.replace(' ', '').slice(1);
    return financeT(`categories.${key}`) || cat;
  };

  const categoryData = Object.entries(summary.byCategory).map(([name, value]) => ({ name: getCategoryLabel(name), value }));
  const monthData = Object.entries(summary.byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month: month.slice(5), amount }));

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

  const formatCurrency = (val: number | undefined | null) => `SAR ${(val || 0).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}`;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className={isRtl ? 'text-right' : 'text-left'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <h2 className="page-title">{t('title')}</h2>
        <div style={{ display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <button onClick={handlePrint} style={{ background: '#5b6be7', color: '#fff', padding: '8px 16px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>{expensesT('export.print')}</button>
          <button onClick={handleExportCSV} style={{ background: '#42ca7f', color: '#fff', padding: '8px 16px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>{expensesT('export.csv')}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #42ca7f', borderRight: isRtl ? '4px solid #42ca7f' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('totalIncome')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#42ca7f', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(summary.total)}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #f8b425', borderRight: isRtl ? '4px solid #f8b425' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{financeT('transactions')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#f8b425', margin: '4px 0 0' }}>{summary.count}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #28aaa9', borderRight: isRtl ? '4px solid #28aaa9' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('avgPerIncome')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#28aaa9', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(summary.count > 0 ? Math.round(summary.total / summary.count) : 0)}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #5b6be7', borderRight: isRtl ? '4px solid #5b6be7' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{financeT('allCategories')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#5b6be7', margin: '4px 0 0' }}>{Object.keys(summary.byCategory).length}</p>
        </div>
      </div>

      <DateRangeFilter onChange={(start, end) => setDateRange({ startDate: start, endDate: end })} initialPreset="30d" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#525f80' }}>{t('byCategory')}</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), commonT('amount')]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#525f80' }}>{t('monthly')}</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="month" fontSize={12} orientation={isRtl ? 'top' : 'bottom'} />
              <YAxis fontSize={12} orientation={isRtl ? 'right' : 'left'} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), commonT('amount')]} />
              <Bar dataKey="amount" fill="#42ca7f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>
        ) : incomes.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{t('noIncomes')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '600px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('date')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{financeT('category')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('description')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('amount')}</th>
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #eee' }}>
                {incomes.map(inc => (
                  <tr key={inc._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px', color: '#525f80' }}>{new Date(inc.date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}</td>
                    <td style={{ padding: '12px' }}>{getCategoryLabel(inc.category)}</td>
                    <td style={{ padding: '12px' }}>{inc.description}</td>
                    <td style={{ padding: '12px', fontWeight: 600, color: '#42ca7f', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(inc.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>{commonT('prev')}</button>
          <span style={{ padding: '8px 12px', fontSize: '12px', color: '#525f80' }}>{commonT('page', { page, total: totalPages })}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid #ced4da', borderRadius: '3px', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>{commonT('next')}</button>
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
