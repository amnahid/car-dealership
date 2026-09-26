'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import DataTransferButtons from '@/components/DataTransferButtons';
import { PrintColumn, SummaryStatItem } from '@/lib/printUtils';

function formatCurrency(value: number | undefined | null, locale: string): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}

interface CollectionRecord {
  type: string;
  saleId: string;
  customerName: string;
  customerPhone: string;
  carId: string;
  amount: number;
  cashAmount?: number;
  bankAmount?: number;
  voucherNumber?: string;
  paidDate?: string;
}

export default function InstallmentCollectionsPage() {
  const t = useTranslations('InstallmentCollections');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [data, setData] = useState<CollectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData(month);
  }, [month]);

  const fetchData = async (selectedMonth: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/installment-collections${selectedMonth ? '?month=' + selectedMonth : ''}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        console.error('Failed to fetch collections');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Apply frontend filters
  const filteredData = data.filter(row => {
    if (search) {
      const q = search.toLowerCase();
      return (
        (row.customerName || '').toLowerCase().includes(q) ||
        (row.saleId || '').toLowerCase().includes(q) ||
        (row.carId || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalExpected = filteredData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalCash = filteredData.reduce((acc, curr) => acc + (curr.cashAmount || 0), 0);
  const totalBank = filteredData.reduce((acc, curr) => acc + (curr.bankAmount || 0), 0);
  const totalCollected = totalCash + totalBank;
  const totalRemaining = Math.max(0, totalExpected - totalCollected);

  const printSummaryStats: SummaryStatItem[] = [
    { label: t('totalExpected'), value: formatCurrency(totalExpected, locale) },
    { label: t('totalCollected'), value: formatCurrency(totalCollected, locale) },
    { label: t('totalCash'), value: formatCurrency(totalCash, locale) },
    { label: t('totalBank'), value: formatCurrency(totalBank, locale) },
    { label: t('totalRemaining'), value: formatCurrency(totalRemaining, locale) },
  ];

  const printColumns: PrintColumn[] = [
    { header: t('slNo'), getter: (r, i) => String(i + 1), align: 'center' },
    { header: t('sysId'), key: 'saleId' },
    { header: t('customer'), key: 'customerName' },
    { header: t('phone'), key: 'customerPhone' },
    { header: t('carInfo'), key: 'carId' },
    { header: t('instal'), getter: (r) => formatCurrency(r.amount, locale) },
    { header: t('cash'), getter: (r) => r.cashAmount ? formatCurrency(r.cashAmount, locale) : '-' },
    { header: t('bank'), getter: (r) => r.bankAmount ? formatCurrency(r.bankAmount, locale) : '-' },
    { header: t('voucherNo'), key: 'voucherNumber' },
    { header: t('date'), getter: (r) => r.paidDate ? new Date(r.paidDate).toLocaleDateString(locale) : '' },
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className={isRtl ? 'text-right' : 'text-left'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <h2 className="page-title">{t('title')}</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <input 
            type="text" 
            placeholder={commonT('search') + '...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-control"
            style={{ width: '200px' }}
          />
          <input 
            type="month" 
            value={month} 
            onChange={(e) => setMonth(e.target.value)} 
            className="form-control"
            style={{ width: 'auto' }}
          />
          <button onClick={() => setMonth('')} style={{ height: '40px', padding: '0 16px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '3px', background: '#fff', cursor: 'pointer', color: '#525f80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{commonT('clearAll') || 'Clear Month'}</button>
          <DataTransferButtons 
            entityType="collections" 
            title={`${t('subtitle')} ${month ? '- ' + month : ''}`}
            showImport={false}
            columns={printColumns}
            data={filteredData}
            filters={{ month, search }}
            summaryStats={printSummaryStats}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #28aaa9', borderRight: isRtl ? '4px solid #28aaa9' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase', marginBottom: '6px' }}>{t('totalExpected')}</p>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#28aaa9', margin: 0 }}>{formatCurrency(totalExpected, locale)}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #42ca7f', borderRight: isRtl ? '4px solid #42ca7f' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase', marginBottom: '6px' }}>{t('totalCollected')}</p>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#42ca7f', margin: 0 }}>{formatCurrency(totalCollected, locale)}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #38a4f8', borderRight: isRtl ? '4px solid #38a4f8' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase', marginBottom: '6px' }}>{t('totalCash')}</p>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#38a4f8', margin: 0 }}>{formatCurrency(totalCash, locale)}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #f8b425', borderRight: isRtl ? '4px solid #f8b425' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase', marginBottom: '6px' }}>{t('totalBank')}</p>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#f8b425', margin: 0 }}>{formatCurrency(totalBank, locale)}</p>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: isRtl ? 'none' : '4px solid #ec4561', borderRight: isRtl ? '4px solid #ec4561' : 'none' }}>
          <p style={{ fontSize: '12px', color: '#9ca8b3', textTransform: 'uppercase', marginBottom: '6px' }}>{t('totalRemaining')}</p>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#ec4561', margin: 0 }}>{formatCurrency(totalRemaining, locale)}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>{commonT('loading')}...</div>
          ) : filteredData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>{t('noData')}</div>
          ) : (
            <table className="table" style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }} dir={isRtl ? 'rtl' : 'ltr'}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#28aaa9', fontSize: '13px' }}>
                  <th style={{ padding: '12px 8px', width: '60px' }}>{t('slNo')}</th>
                  <th style={{ padding: '12px 8px', width: '100px' }}>{t('sysId')}</th>
                  <th style={{ padding: '12px 8px', width: '180px' }}>{t('customer')}</th>
                  <th style={{ padding: '12px 8px', width: '120px' }}>{t('phone')}</th>
                  <th style={{ padding: '12px 8px', width: '130px' }}>{t('carInfo')}</th>
                  <th style={{ padding: '12px 8px', width: '110px' }}>{t('instal')}</th>
                  <th style={{ padding: '12px 8px', width: '110px' }}>{t('cash')}</th>
                  <th style={{ padding: '12px 8px', width: '110px' }}>{t('bank')}</th>
                  <th style={{ padding: '12px 8px', width: '120px' }}>{t('voucherNo')}</th>
                  <th style={{ padding: '12px 8px', width: '110px' }}>{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr key={`${row.saleId}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <td style={{ padding: '12px 8px' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 8px' }}>{row.saleId}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>{row.customerName}</td>
                    <td style={{ padding: '12px 8px' }}>{row.customerPhone}</td>
                    <td style={{ padding: '12px 8px' }}>{row.carId}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>{formatCurrency(row.amount, locale)}</td>
                    <td style={{ padding: '12px 8px' }}>{row.cashAmount ? formatCurrency(row.cashAmount, locale) : '-'}</td>
                    <td style={{ padding: '12px 8px' }}>{row.bankAmount ? formatCurrency(row.bankAmount, locale) : '-'}</td>
                    <td style={{ padding: '12px 8px' }}>{row.voucherNumber || '-'}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {row.paidDate ? new Date(row.paidDate).toLocaleDateString(locale) : '-'}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                  <td colSpan={5} style={{ padding: '12px 8px', textAlign: isRtl ? 'left' : 'right' }}>{commonT('total')}</td>
                  <td style={{ padding: '12px 8px' }}>{formatCurrency(totalExpected, locale)}</td>
                  <td style={{ padding: '12px 8px' }}>{formatCurrency(totalCash, locale)}</td>
                  <td style={{ padding: '12px 8px' }}>{formatCurrency(totalBank, locale)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
