'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    { name: 'Income', amount: summary.totalIncome },
    { name: 'Expense', amount: summary.totalExpense },
    { name: 'Profit', amount: summary.netProfit },
  ];

  const expenseBreakdown = [
    { name: 'Car Purchases', amount: breakdown.carPurchaseCosts },
    { name: 'Repairs', amount: breakdown.repairCosts },
    { name: 'Salaries', amount: breakdown.salaryExpenses },
    { name: 'Other', amount: breakdown.otherExpenses },
  ].filter(d => d.amount > 0);

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const csv = ['Car ID,Brand,Model,Year,Status,Purchase Price,Repair Cost,Total Cost,Revenue,Profit'];
    cars.forEach(c => csv.push(`${c.carId},${c.brand},${c.model},${c.year},${c.status},${c.purchasePrice},${c.repairCost},${c.totalCost},${c.revenue},${c.profit}`));
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'car-profit-report.csv';
    a.click();
  };

  const handleExportExcel = () => {
    const xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
    const workbook = `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
      <Worksheet ss:Name="Car Profit"><Table>
        <Row><Cell><Data ss:Type="String">Car ID</Data></Cell><Cell><Data ss:Type="String">Brand</Data></Cell><Cell><Data ss:Type="String">Model</Data></Cell><Cell><Data ss:Type="String">Year</Data></Cell><Cell><Data ss:Type="String">Status</Data></Cell><Cell><Data ss:Type="String">Purchase Price</Data></Cell><Cell><Data ss:Type="String">Repair Cost</Data></Cell><Cell><Data ss:Type="String">Total Cost</Data></Cell><Cell><Data ss:Type="String">Revenue</Data></Cell><Cell><Data ss:Type="String">Profit</Data></Cell></Row>
        ${cars.map(c => `<Row><Cell><Data ss:Type="String">${c.carId}</Data></Cell><Cell><Data ss:Type="String">${c.brand}</Data></Cell><Cell><Data ss:Type="String">${c.model}</Data></Cell><Cell><Data ss:Type="Number">${c.year}</Data></Cell><Cell><Data ss:Type="String">${c.status}</Data></Cell><Cell><Data ss:Type="Number">${c.purchasePrice}</Data></Cell><Cell><Data ss:Type="Number">${c.repairCost}</Data></Cell><Cell><Data ss:Type="Number">${c.totalCost}</Data></Cell><Cell><Data ss:Type="Number">${c.revenue}</Data></Cell><Cell><Data ss:Type="Number">${c.profit}</Data></Cell></Row>`).join('')}
      </Table></Worksheet></Workbook>`;
    const blob = new Blob([xml + workbook], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'car-profit-report.xls';
    a.click();
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 className="page-title">Financial Reports</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handlePrint} style={{ background: '#5b6be7', color: '#fff', padding: '8px 16px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Print</button>
          <button onClick={handleExportCSV} style={{ background: '#42ca7f', color: '#fff', padding: '8px 16px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>CSV</button>
          <button onClick={handleExportExcel} style={{ background: '#28aaa9', color: '#fff', padding: '8px 16px', borderRadius: '3px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Excel</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #42ca7f' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Total Income</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#42ca7f', margin: '4px 0 0' }}>SAR {summary.totalIncome.toLocaleString()}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ec4561' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Total Expenses</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#ec4561', margin: '4px 0 0' }}>SAR {summary.totalExpense.toLocaleString()}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #28aaa9' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Net Profit</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#28aaa9', margin: '4px 0 0' }}>SAR {summary.netProfit.toLocaleString()}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f8b425' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>Profit Margin</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#f8b425', margin: '4px 0 0' }}>{summary.profitMargin}%</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
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
            {p === 'day' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#525f80' }}>Income vs Expense</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeVsExpense}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value) => [`SAR ${Number(value).toLocaleString()}`, 'Amount']} />
              <Bar dataKey="amount" fill="#28aaa9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#525f80' }}>Expense Breakdown</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expenseBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="name" type="category" width={100} fontSize={12} />
              <Tooltip formatter={(value) => [`SAR ${Number(value).toLocaleString()}`, 'Amount']} />
              <Bar dataKey="amount" fill="#ec4561" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#525f80' }}>Car Profit Summary</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '4px' }}>
            <p style={{ fontSize: '12px', color: '#9ca8b3', margin: 0 }}>Sold Cars ({profitSummary.soldCars})</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#42ca7f', margin: '4px 0 0' }}>SAR {profitSummary.totalProfit.toLocaleString()}</p>
          </div>
          <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '4px' }}>
            <p style={{ fontSize: '12px', color: '#9ca8b3', margin: 0 }}>Avg Profit / Car</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: profitSummary.avgProfit >= 0 ? '#28aaa9' : '#ec4561', margin: '4px 0 0' }}>SAR {profitSummary.avgProfit.toLocaleString()}</p>
          </div>
          <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '4px' }}>
            <p style={{ fontSize: '12px', color: '#9ca8b3', margin: 0 }}>Total Revenue</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#42ca7f', margin: '4px 0 0' }}>SAR {profitSummary.totalRevenue.toLocaleString()}</p>
          </div>
          <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '4px' }}>
            <p style={{ fontSize: '12px', color: '#9ca8b3', margin: 0 }}>Total Cost</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#ec4561', margin: '4px 0 0' }}>SAR {profitSummary.totalCost.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <h4 style={{ marginTop: 0, marginBottom: '16px', padding: '20px', color: '#525f80' }}>All Cars - Profit Report</h4>
        {carsLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>Loading...</div>
        ) : cars.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca8b3' }}>No cars found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', minWidth: '900px' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  {['Car ID', 'Brand', 'Model', 'Year', 'Status', 'Purchase Price', 'Repair Cost', 'Total Cost', 'Revenue', 'Profit'].map(h => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#525f80', textTransform: 'uppercase' }}>{h}</th>
                  ))}
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
                    <td style={{ padding: '12px' }}>SAR {car.purchasePrice.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>SAR {car.repairCost.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>SAR {car.totalCost.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>SAR {car.revenue.toLocaleString()}</td>
                    <td style={{ padding: '12px', fontWeight: 600, color: car.profit >= 0 ? '#42ca7f' : '#ec4561' }}>
                      {car.profit >= 0 ? '+' : ''}SAR {car.profit.toLocaleString()}
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