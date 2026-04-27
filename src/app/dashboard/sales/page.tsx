'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

interface SalesStats {
  cash: { count: number; revenue: number };
  installments: { count: number; totalValue: number; totalPaid: number };
  rentals: { count: number; revenue: number };
  returns: { count: number; totalRefunds: number };
}

export default function SalesHubPage() {
  const t = useTranslations('Sales');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [stats, setStats] = useState<SalesStats>({
    cash: { count: 0, revenue: 0 },
    installments: { count: 0, totalValue: 0, totalPaid: 0 },
    rentals: { count: 0, revenue: 0 },
    returns: { count: 0, totalRefunds: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const [cashRes, installRes, rentalRes, returnRes] = await Promise.all([
          fetch('/api/sales/cash?limit=15'),
          fetch('/api/sales/installments?limit=15'),
          fetch('/api/sales/rentals?limit=15'),
          fetch('/api/sales/returns?limit=15'),
        ]);

        const [cashData, installData, rentalData, returnData] = await Promise.all([
          cashRes.json(),
          installRes.json(),
          rentalRes.json(),
          returnRes.json(),
        ]);

        setStats({
          cash: { 
            count: cashData.sales?.length || 0, 
            revenue: cashData.totalRevenue || 0 
          },
          installments: { 
            count: installData.sales?.length || 0, 
            totalValue: installData.totalValue || 0,
            totalPaid: installData.totalPaid || 0
          },
          rentals: { 
            count: rentalData.sales?.length || 0, 
            revenue: rentalData.totalRevenue || 0 
          },
          returns: { 
            count: returnData.returns?.length || 0, 
            totalRefunds: returnData.stats?.totalRefunds || 0 
          },
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, []);

  const formatCurrency = (val: number | undefined | null) => `SAR ${(val || 0).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}`;

  const salesTypes = [
    {
      title: t('cashSales'),
      description: t('cashSalesDesc'),
      href: '/dashboard/sales/cash',
      icon: '💵',
      color: '#28aaa9',
      stats: t('salesCount', { count: stats.cash.count }),
      amount: formatCurrency(stats.cash.revenue),
    },
    {
      title: t('installmentSales'),
      description: t('installmentSalesDesc'),
      href: '/dashboard/sales/installments',
      icon: '📅',
      color: '#42ca7f',
      stats: t('salesCount', { count: stats.installments.count }),
      amount: `${formatCurrency(stats.installments.totalPaid || 0)} ${t('paid')}`,
      sub: `${t('of')} ${formatCurrency(stats.installments.totalValue)}`,
    },
    {
      title: t('rentals'),
      description: t('rentalsDesc'),
      href: '/dashboard/sales/rentals',
      icon: '🚗',
      color: '#f5a623',
      stats: t('rentalsCount', { count: stats.rentals.count }),
      amount: formatCurrency(stats.rentals.revenue),
    },
    {
      title: t('purchaseReturns'),
      description: t('purchaseReturnsDesc'),
      href: '/dashboard/sales/returns',
      icon: '↩️',
      color: '#ec4561',
      stats: t('returnsCount', { count: stats.returns.count }),
      amount: `${formatCurrency(stats.returns.totalRefunds)} ${t('refunded')}`,
    },
  ];

  return (
    <div>
      <h2 className="page-title" style={{ textAlign: isRtl ? 'right' : 'left' }}>{t('overview')}</h2>

      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#9ca8b3' }}>{commonT('loading')}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', direction: isRtl ? 'rtl' : 'ltr' }}>
          {salesTypes.map((type) => (
            <Link
              key={type.href}
              href={type.href}
              style={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                className="card"
                style={{
                  padding: '24px',
                  borderTop: `4px solid ${type.color}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                  textAlign: isRtl ? 'right' : 'left'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <div>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>{type.icon}</div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{type.title}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#9ca8b3' }}>{type.description}</p>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginTop: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase' }}>{type.stats}</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: type.color, marginTop: '4px' }}>{type.amount}</div>
                  {type.sub && (
                    <div style={{ fontSize: '12px', color: '#9ca8b3', marginTop: '2px' }}>{type.sub}</div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: '24px', padding: '24px', textAlign: isRtl ? 'right' : 'left' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>{t('quickLinks')}</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <Link href="/dashboard/sales/cash" style={{ 
            background: '#28aaa9', 
            color: '#fff', 
            padding: '10px 16px', 
            borderRadius: '3px', 
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {t('viewCashSales')}
          </Link>
          <Link href="/dashboard/sales/installments" style={{ 
            background: '#42ca7f', 
            color: '#fff', 
            padding: '10px 16px', 
            borderRadius: '3px', 
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {t('viewInstallmentSales')}
          </Link>
          <Link href="/dashboard/sales/rentals" style={{ 
            background: '#f5a623', 
            color: '#fff', 
            padding: '10px 16px', 
            borderRadius: '3px', 
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {t('viewRentals')}
          </Link>
          <Link href="/dashboard/sales/returns" style={{ 
            background: '#ec4561', 
            color: '#fff', 
            padding: '10px 16px', 
            borderRadius: '3px', 
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {t('viewReturns')}
          </Link>
        </div>
      </div>
    </div>
  );
}
