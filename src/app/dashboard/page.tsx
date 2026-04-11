'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import InstallmentAlertsModal from '@/components/InstallmentAlertsModal';

interface StatsData {
  totalCars: number;
  carsInStock: number;
  carsUnderRepair: number;
  carsSold: number;
  carsRented: number;
  carsReserved: number;
  totalRepairCost: number;
  expiringDocuments: number;
  recentActivity: Array<{
    _id: string;
    action: string;
    module: string;
    userName: string;
    createdAt: string;
  }>;
  totalCashSales: number;
  totalInstallments: number;
  activeRentals: number;
  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  monthlyExpenses: number;
  cashRevenue: number;
  installmentPaid: number;
  rentalRevenue: number;
  pendingInstallments: number;
  overdueInstallments: number;
  overdueInstallmentsAmount: number;
  upcomingInstallments: number;
  upcomingInstallmentsAmount: number;
  salesByMonth: Array<{ month: string; total: number; count: number }>;
}

const statColors: Record<string, { background: string; border: string; color: string }> = {
  primary: { background: '#28aaa9', border: '#28aaa9', color: '#ffffff' },
  secondary: { background: '#2b2d5d', border: '#2b2d5d', color: '#ffffff' },
  success: { background: '#42ca7f', border: '#42ca7f', color: '#ffffff' },
  warning: { background: '#f8b425', border: '#f8b425', color: '#ffffff' },
  danger: { background: '#ec4561', border: '#ec4561', color: '#ffffff' },
  info: { background: '#38a4f8', border: '#38a4f8', color: '#ffffff' },
};

function StatCard({
  label,
  value,
  colorKey,
  href,
  prefix = '',
  suffix = '',
  icon,
}: {
  label: string;
  value: number | string;
  colorKey: string;
  href?: string;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
}) {
  const colors = statColors[colorKey] || statColors.primary;
  const displayValue = value !== undefined && value !== null ? String(value) : '0';

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    padding: '30px',
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    textAlign: 'center',
    boxShadow: '0px 0px 13px 0px rgba(236,236,241,0.44)',
    marginBottom: '24px',
    color: colors.color,
    textDecoration: 'none',
    display: 'block',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
  };

  const card = (
    <div style={cardStyle} className="stat-card">
      {icon && (
        <span
          style={{
            position: 'absolute',
            left: '-15px',
            top: '-15px',
            fontSize: '110px',
            opacity: 0.1,
            transform: 'rotate(-10deg)',
          }}
        >
          {icon}
        </span>
      )}
      <p style={{ fontSize: '14px', fontWeight: 500, opacity: 0.9, margin: 0, position: 'relative' }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', position: 'relative' }}>
        {prefix}{displayValue}{suffix}
      </p>
    </div>
  );

  return href ? (
    <Link href={href} style={{ textDecoration: 'none' }}>
      {card}
    </Link>
  ) : card;
}

function FinancialCard({
  label,
  value,
  subValue,
  colorKey,
  icon,
}: {
  label: string;
  value: number | string;
  subValue?: string;
  colorKey: string;
  icon: string;
}) {
  const colors = statColors[colorKey] || statColors.primary;
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div
      className="card"
      style={{
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
      }}
    >
      <div
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: colors.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d={icon} />
        </svg>
      </div>
      <div>
        <p style={{ fontSize: '14px', color: '#9ca8b3', margin: 0 }}>{label}</p>
        <p style={{ fontSize: '24px', fontWeight: 700, color: colors.background, margin: '4px 0' }}>
          ${displayValue}
        </p>
        {subValue && <p style={{ fontSize: '12px', color: '#9ca8b3', margin: 0 }}>{subValue}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => res.ok ? res.json() : Promise.reject('API Error'))
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        console.error('Failed to load dashboard:', err);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!stats?.salesByMonth || !chartRef.current) return;

    const initChart = async () => {
      const Chart = (await import('chart.js/auto')).default;

      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const labels = stats.salesByMonth.map((s) => {
        const [year, month] = s.month.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' });
      });

      const data = stats.salesByMonth.map((s) => s.total);

      chartInstanceRef.current = new Chart(chartRef.current!, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Revenue',
              data,
              backgroundColor: '#28aaa9',
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: number | string) => '$' + Number(value).toLocaleString(),
              },
            },
          },
        },
      });
    };

    initChart();

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [stats?.salesByMonth]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9ca8b3' }}>Loading dashboard...</div>;
  }

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9ca8b3' }}>
        Failed to load dashboard data. Make sure the database is connected.
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h2 className="page-title" style={{ marginBottom: '24px' }}>Dashboard Overview</h2>

        {stats.expiringDocuments > 0 && (
        <div
          style={{
            background: '#fff3cd',
            border: '1px solid #f8b425',
            borderRadius: '3px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#856404', margin: 0 }}>
            <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', background: '#ffc107', marginRight: '6px' }}></span>
            {stats.expiringDocuments} document{stats.expiringDocuments !== 1 ? 's' : ''} expiring within 30 days.{' '}
            <Link href="/dashboard/documents" style={{ color: '#28aaa9', fontWeight: 600, textDecoration: 'underline' }}>
              View Documents
            </Link>
          </p>
        </div>
      )}

      {/* Inventory Stats */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px', fontFamily: '"Sarabun", sans-serif' }}>
          Inventory Status
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          <StatCard 
            label="Total Cars" 
            value={stats.totalCars} 
            colorKey="primary" 
            href="/dashboard/cars"
            icon={<svg width="110" height="110" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>}
          />
          <StatCard 
            label="In Stock" 
            value={stats.carsInStock} 
            colorKey="success" 
            href="/dashboard/cars?status=In+Stock"
            icon={<svg width="110" height="110" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z"/></svg>}
          />
          <StatCard 
            label="Under Repair" 
            value={stats.carsUnderRepair} 
            colorKey="warning" 
            href="/dashboard/cars?status=Under+Repair"
            icon={<svg width="110" height="110" viewBox="0 0 24 24" fill="currentColor"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>}
          />
          <StatCard 
            label="Sold" 
            value={stats.carsSold} 
            colorKey="secondary" 
            href="/dashboard/cars?status=Sold"
            icon={<svg width="110" height="110" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.35 3.98 3.93V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>}
          />
          <StatCard 
            label="Rented" 
            value={stats.carsRented} 
            colorKey="info" 
            href="/dashboard/cars?status=Rented"
            icon={<svg width="110" height="110" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/><path d="M7 7h2v2H7zm0 4h2v2H7zm0 4h2v2H7z" opacity="0.5"/></svg>}
          />
          <StatCard 
            label="Reserved" 
            value={stats.carsReserved} 
            colorKey="info" 
            href="/dashboard/cars?status=Reserved"
            icon={<svg width="110" height="110" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>}
          />
          <StatCard 
            label="Expiring Docs (30d)" 
            value={stats.expiringDocuments} 
            colorKey={stats.expiringDocuments > 0 ? 'danger' : 'success'} 
            href="/dashboard/documents"
            icon={<svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>}
          />
        </div>
      </div>

      {/* Financial Stats - All Time */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px', fontFamily: '"Sarabun", sans-serif' }}>
          Financial Overview (All Time)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          <FinancialCard label="Total Revenue" value={stats.totalRevenue} subValue={`Cash: $${stats.cashRevenue.toLocaleString()} | Install: $${stats.installmentPaid.toLocaleString()} | Rental: $${stats.rentalRevenue.toLocaleString()}`} colorKey="primary" icon="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
          <FinancialCard label="Total Expenses" value={stats.totalExpenses} subValue="Repair costs + Salaries" colorKey="danger" icon="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          <FinancialCard label="Total Profit" value={stats.totalProfit} subValue="Revenue - Expenses" colorKey={stats.totalProfit >= 0 ? 'success' : 'danger'} icon="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.35 3.98 3.93V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
          <FinancialCard label="Pending Installments" value={stats.pendingInstallments} subValue="Remaining amount to collect" colorKey="warning" icon="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </div>
      </div>

      {/* Financial Stats - This Month */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px', fontFamily: '"Sarabun", sans-serif' }}>
          This Month Performance
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          <StatCard 
            label="Revenue" 
            value={stats.monthlyRevenue} 
            colorKey="primary" 
            prefix="$"
            icon={<svg width="110" height="110" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.35 3.98 3.93V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>}
          />
          <StatCard 
            label="Expenses" 
            value={stats.monthlyExpenses} 
            colorKey="danger" 
            prefix="$"
            icon={<svg width="110" height="110" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>}
          />
          <StatCard 
            label="Profit" 
            value={stats.monthlyProfit} 
            colorKey={stats.monthlyProfit >= 0 ? 'success' : 'danger'} 
            prefix="$"
            icon={<svg width="110" height="110" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>}
          />
        </div>
      </div>

      {/* Installment Tracking */}
      {(stats.overdueInstallments > 0 || stats.upcomingInstallments > 0) && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px', fontFamily: '"Sarabun", sans-serif' }}>
            Installment Alerts
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {stats.overdueInstallments > 0 && (
              <div
                onClick={() => setShowAlertsModal(true)}
                className="card"
                style={{
                  padding: '20px',
                  borderLeft: '4px solid #ec4561',
                  background: '#fff5f5',
                  cursor: 'pointer',
                }}
              >
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#ec4561', margin: 0 }}>
                  ⚠️ {stats.overdueInstallments} Overdue Payment{stats.overdueInstallments !== 1 ? 's' : ''}
                </p>
                <p style={{ fontSize: '24px', fontWeight: 700, color: '#2a3142', margin: '8px 0 0' }}>
                  ${stats.overdueInstallmentsAmount.toLocaleString()}
                </p>
              </div>
            )}
            {stats.upcomingInstallments > 0 && (
              <div
                onClick={() => setShowAlertsModal(true)}
                className="card"
                style={{
                  padding: '20px',
                  borderLeft: '4px solid #f8b425',
                  background: '#fffbf0',
                  cursor: 'pointer',
                }}
              >
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#f8b425', margin: 0 }}>
                  📅 {stats.upcomingInstallments} Upcoming (7 days)
                </p>
                <p style={{ fontSize: '24px', fontWeight: 700, color: '#2a3142', margin: '8px 0 0' }}>
                  ${stats.upcomingInstallmentsAmount.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sales Chart */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px', fontFamily: '"Sarabun", sans-serif' }}>
          Monthly Revenue
        </h3>
        <div style={{ height: '300px', position: 'relative' }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2a3142', marginBottom: '16px', fontFamily: '"Sarabun", sans-serif' }}>
          Recent Activity
        </h3>
        {stats.recentActivity.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#9ca8b3' }}>No activity yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {stats.recentActivity.map((log) => (
              <li
                key={log._id}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#28aaa9',
                    marginTop: '6px',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', color: '#2a3142', margin: 0 }}>{log.action}</p>
                  <p style={{ fontSize: '12px', color: '#9ca8b3', marginTop: '4px' }}>
                    {log.userName} · {log.module} · {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          )}
        </div>
      </div>

      <InstallmentAlertsModal
        isOpen={showAlertsModal}
        onClose={() => setShowAlertsModal(false)}
        onPaymentPaid={() => {
          fetch('/api/dashboard/stats')
            .then((res) => res.ok ? res.json() : null)
            .then((data) => setStats(data));
        }}
      />
    </>
  );
}