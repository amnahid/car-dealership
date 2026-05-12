'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslations, useLocale } from 'next-intl';

interface Car {
  _id: string;
  carId: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  purchasePrice: number;
  repairCost: number;
  totalCost: number;
  revenue: number;
  profit: number;
}

interface ProfitSummary {
  totalCars: number;
  soldCars: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgProfit: number;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: string;
}

interface Breakdown {
  cashSales: number;
  installmentPayments: number;
  rentalIncome: number;
  salaryExpenses: number;
  carPurchaseCosts: number;
  repairCosts: number;
  otherExpenses: number;
}

function ReportsContent() {
  const t = useTranslations('Reports');
  const commonT = useTranslations('Common');
  const expensesT = useTranslations('Expenses');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [carsLoading, setCarsLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({ totalIncome: 0, totalExpense: 0, netProfit: 0, profitMargin: '0' });
  const [breakdown, setBreakdown] = useState<Breakdown>({ cashSales: 0, installmentPayments: 0, rentalIncome: 0, salaryExpenses: 0, carPurchaseCosts: 0, repairCosts: 0, otherExpenses: 0 });
  const [cars, setCars] = useState<Car[]>([]);
  const [profitSummary, setProfitSummary] = useState<ProfitSummary>({ totalCars: 0, soldCars: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0, avgProfit: 0 });
  const [period, setPeriod] = useState('month');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ period });
    if (dateRange.startDate) params.set('startDate', dateRange.startDate);
    if (dateRange.endDate) params.set('endDate', dateRange.endDate);

    try {
      const res = await fetch(`/api/reports/financial?${params}`);
      const data = await res.json();
      setSummary(data.summary || { totalIncome: 0, totalExpense: 0, netProfit: 0, profitMargin: '0' });
      setBreakdown(data.breakdown || { cashSales: 0, installmentPayments: 0, rentalIncome: 0, salaryExpenses: 0, carPurchaseCosts: 0, repairCosts: 0, otherExpenses: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [period, dateRange]);

  const fetchProfitPerCar = useCallback(async () => {
    setCarsLoading(true);
    try {
      const res = await fetch('/api/reports/profit-per-car');
      const data = await res.json();
      setCars(data.cars || []);
      setProfitSummary(data.summary || { totalCars: 0, soldCars: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0, avgProfit: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setCarsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchProfitPerCar();
  }, [fetchData, fetchProfitPerCar]);

  useEffect(() => {
    const preset = searchParams.get('preset') || 'thisMonth';
    const now = new Date();
    let start: Date;

    switch (preset) {
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
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    });
  }, [searchParams]);

  const handlePresetChange = (value: string) => {
    setPeriod(value);
    const now = new Date();
    let start: Date;

    switch (value) {
      case 'day':
        start = now;
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    });
  };

  const incomeVsExpense = [
    { name: commonT('income'), amount: summary.totalIncome },
    { name: commonT('expense'), amount: summary.totalExpense },
    { name: t('profit'), amount: summary.netProfit },
  ];

  const expenseBreakdown = [
    { name: t('cost'), amount: breakdown.carPurchaseCosts },
    { name: commonT('repairs'), amount: breakdown.repairCosts },
    { name: commonT('salaries'), amount: breakdown.salaryExpenses },
    { name: commonT('other'), amount: breakdown.otherExpenses },
  ].filter(d => d.amount > 0);

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const csv = ['Car ID,Brand,Model,Year,Status,Purchase Price,Repair Cost,Total Cost,Revenue,Profit'];
    cars.forEach((c: any) => csv.push(`${c.carId},${c.brand},${c.model},${c.year},${c.status},${c.purchasePrice},${c.repairCost},${c.totalCost},${c.revenue},${c.profit}`));
    const csvContent = '\uFEFF' + csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'car-profit-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (val: number | undefined | null) => `SAR ${(val || 0).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}`;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className={isRtl ? 'text-right' : 'text-left'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <h2 className="page-title">{t('title')}</h2>
        <div style={{ display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <button onClick={handlePrint} style={{ background: '#5b6be7', color: '#fff', padding: '8px 16px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>{commonT('export.print')}</button>
          <button onClick={handleExportCSV} style={{ background: '#42ca7f', color: '#fff', padding: '8px 16px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>{commonT('export.csv')}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #42ca7f', borderRight: isRtl ? '4px solid #42ca7f' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('totalIncome')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#42ca7f', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(summary.totalIncome)}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #ec4561', borderRight: isRtl ? '4px solid #ec4561' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('totalExpenses')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#ec4561', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(summary.totalExpense)}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #28aaa9', borderRight: isRtl ? '4px solid #28aaa9' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('netProfit')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#28aaa9', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(summary.netProfit)}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #f8b425', borderRight: isRtl ? '4px solid #f8b425' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{t('profitMargin')}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#f8b425', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{summary.profitMargin}%</p>
        </div>
      </div>

      <div className="no-print" style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        {['day', 'week', 'month', 'year'].map(p => (
          <button
            key={p}
            onClick={() => handlePresetChange(p)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              borderRadius: '3px',
              border: '1px solid #ced4da',
              background: period === p ? '#28aaa9' : '#ffffff',
              color: period === p ? '#ffffff' : '#525f80',
              cursor: 'pointer',
            }}
          >
            {t(`presets.${p}`)}
          </button>
        ))}
      </div>

      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#525f80' }}>{t('incomeVsExpense')}</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeVsExpense} layout={isRtl ? 'vertical' : 'horizontal'}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              {isRtl ? (
                <>
                  <XAxis type="number" fontSize={12} orientation="top" />
                  <YAxis dataKey="name" type="category" fontSize={12} orientation="right" />
                </>
              ) : (
                <>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                </>
              )}
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), commonT('amount')]} contentStyle={{ textAlign: isRtl ? 'right' : 'left' }} />
              <Bar dataKey="amount" fill="#28aaa9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#525f80' }}>{t('expenseBreakdown')}</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expenseBreakdown} layout={isRtl ? 'horizontal' : 'vertical'}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              {!isRtl ? (
                <>
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                </>
              ) : (
                <>
                  <XAxis dataKey="name" fontSize={12} orientation="top" />
                  <YAxis type="number" fontSize={12} orientation="right" />
                </>
              )}
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), commonT('amount')]} contentStyle={{ textAlign: isRtl ? 'right' : 'left' }} />
              <Bar dataKey="amount" fill="#ec4561" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#525f80' }}>{t('carProfitSummary')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '4px' }}>
            <p style={{ fontSize: '12px', color: '#9ca8b3', margin: 0 }}>{t('soldCars')} ({profitSummary.soldCars})</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#42ca7f', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(profitSummary.totalProfit)}</p>
          </div>
          <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '4px' }}>
            <p style={{ fontSize: '12px', color: '#9ca8b3', margin: 0 }}>{t('avgProfitPerCar')}</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: profitSummary.avgProfit >= 0 ? '#28aaa9' : '#ec4561', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(profitSummary.avgProfit)}</p>
          </div>
          <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '4px' }}>
            <p style={{ fontSize: '12px', color: '#9ca8b3', margin: 0 }}>{t('revenue')}</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#42ca7f', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(profitSummary.totalRevenue)}</p>
          </div>
          <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '4px' }}>
            <p style={{ fontSize: '12px', color: '#9ca8b3', margin: 0 }}>{t('cost')}</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#ec4561', margin: '4px 0 0', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(profitSummary.totalCost)}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <h4 style={{ marginTop: 0, marginBottom: '16px', padding: '20px', color: '#525f80' }}>{t('allCarsProfitReport')}</h4>
        {carsLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>
        ) : cars.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('noData')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '900px', direction: isRtl ? 'rtl' : 'ltr' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('id')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('brand')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('model')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('year')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('status')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('price')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{commonT('repairs')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('cost')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('revenue')}</th>
                  <th style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{t('profit')}</th>
                </tr>
              </thead>
              <tbody style={{ borderBottom: '1px solid #eee' }}>
                {cars.map(car => (
                  <tr key={car._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px', color: '#525f80' }}>{car.carId}</td>
                    <td style={{ padding: '12px' }}>{car.brand}</td>
                    <td style={{ padding: '12px' }}>{car.model}</td>
                    <td style={{ padding: '12px' }}>{car.year}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '3px', fontSize: '12px', fontWeight: 500, background: car.status === 'Sold' ? '#42ca7f20' : '#ec456120', color: car.status === 'Sold' ? '#42ca7f' : '#ec4561' }}>{car.status}</span>
                    </td>
                    <td style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(car.purchasePrice)}</td>
                    <td style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(car.repairCost)}</td>
                    <td style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(car.totalCost)}</td>
                    <td style={{ padding: '12px', textAlign: isRtl ? 'left' : 'right' }}>{formatCurrency(car.revenue)}</td>
                    <td style={{ padding: '12px', fontWeight: 600, color: car.profit >= 0 ? '#42ca7f' : '#ec4561', textAlign: isRtl ? 'left' : 'right' }}>
                      {car.profit >= 0 ? '+' : ''}{formatCurrency(car.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
