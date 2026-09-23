import { generatePrintReportHtml, PrintColumn, ActiveFilterItem, SummaryStatItem } from '@/lib/printUtils';

describe('printUtils - Excel-like Print Generator', () => {
  const sampleColumns: PrintColumn[] = [
    { header: 'Sale ID', key: 'saleId', align: 'center' },
    { header: 'Customer', key: 'customerName' },
    { header: 'Total Price', getter: (item: any) => `SAR ${item.totalPrice}`, align: 'right' },
  ];

  const sampleData = [
    { saleId: 'SAL-001', customerName: 'Ahmed Ali', totalPrice: 50000 },
    { saleId: 'SAL-002', customerName: 'Sara Salem', totalPrice: 75000 },
  ];

  const sampleFilters: ActiveFilterItem[] = [
    { label: 'Status', value: 'Active' },
    { label: 'Brand', value: 'Toyota' },
  ];

  const sampleStats: SummaryStatItem[] = [
    { label: 'Total Sales', value: 2 },
    { label: 'Total Revenue', value: 'SAR 125,000', color: '#16a34a' },
  ];

  it('generates HTML containing report title, active filter pills, KPI stats, and spreadsheet table', () => {
    const html = generatePrintReportHtml({
      title: 'Installment Sales Report',
      appName: 'AMYAL CAR',
      columns: sampleColumns,
      data: sampleData,
      activeFilters: sampleFilters,
      summaryStats: sampleStats,
      isRtl: false,
    });

    expect(html).toContain('Installment Sales Report');
    expect(html).toContain('AMYAL CAR');
    expect(html).toContain('Status:');
    expect(html).toContain('Active');
    expect(html).toContain('Brand:');
    expect(html).toContain('Toyota');
    expect(html).toContain('Total Sales');
    expect(html).toContain('SAR 125,000');
    expect(html).toContain('SAL-001');
    expect(html).toContain('Ahmed Ali');
    expect(html).toContain('SAR 50000');
    expect(html).toContain('SAL-002');
    expect(html).toContain('excel-table');
    expect(html).toContain('@media print');
  });

  it('handles empty filters gracefully with default message', () => {
    const html = generatePrintReportHtml({
      title: 'Cars Inventory',
      columns: sampleColumns,
      data: [],
      activeFilters: [],
      isRtl: false,
    });

    expect(html).toContain('All Records (No Filters Applied)');
    expect(html).toContain('No records found matching current filters');
  });

  it('supports Arabic RTL correctly', () => {
    const html = generatePrintReportHtml({
      title: 'تقرير مبيعات الأقساط',
      appName: 'أميال للسيارات',
      columns: sampleColumns,
      data: sampleData,
      activeFilters: [{ label: 'الحالة', value: 'نشط' }],
      isRtl: true,
    });

    expect(html).toContain('dir="rtl"');
    expect(html).toContain('تقرير مبيعات الأقساط');
    expect(html).toContain('أميال للسيارات');
    expect(html).toContain('الفلاتر النشطة:');
  });
});
