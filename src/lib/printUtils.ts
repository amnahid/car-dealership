/**
 * Professional Excel-like Printable Report Generator
 * Supports full RTL (Arabic) / LTR (English), Active Filters Banner, KPI Stats,
 * Repeating Table Headers, Page Break Optimization, and Print Stylesheets.
 */

export interface PrintColumn {
  header: string;
  key?: string;
  getter?: (item: any, index: number) => string | number;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

export interface ActiveFilterItem {
  label: string;
  value: string | number;
}

export interface SummaryStatItem {
  label: string;
  value: string | number;
  color?: string;
}

export interface PrintReportOptions {
  title: string;
  subtitle?: string;
  appName?: string;
  isRtl?: boolean;
  activeFilters?: ActiveFilterItem[];
  summaryStats?: SummaryStatItem[];
  columns: PrintColumn[];
  data: any[];
  footerNote?: string;
}

export function generatePrintReportHtml(options: PrintReportOptions): string {
  const {
    title,
    subtitle = '',
    appName = 'AMYAL CAR | أميال للسيارات',
    isRtl = false,
    activeFilters = [],
    summaryStats = [],
    columns,
    data,
    footerNote
  } = options;

  const now = new Date();
  const dateStr = now.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const dir = isRtl ? 'rtl' : 'ltr';
  const defaultAlign = isRtl ? 'right' : 'left';

  // Build filter pills
  const filtersHtml = activeFilters.length > 0
    ? activeFilters
        .map(
          f => `
          <div class="filter-pill">
            <span class="filter-label">${escapeHtml(String(f.label))}:</span>
            <span class="filter-val">${escapeHtml(String(f.value))}</span>
          </div>`
        )
        .join('')
    : `<div class="no-filter-pill">${isRtl ? 'جميع السجلات (بدون فلاتر)' : 'All Records (No Filters Applied)'}</div>`;

  // Build KPI Stats cards
  const statsHtml = summaryStats.length > 0
    ? `
      <div class="stats-grid">
        ${summaryStats
          .map(
            s => `
            <div class="stat-card">
              <div class="stat-label">${escapeHtml(String(s.label))}</div>
              <div class="stat-value" style="${s.color ? `color: ${s.color};` : ''}">${escapeHtml(String(s.value))}</div>
            </div>`
          )
          .join('')}
      </div>`
    : '';

  // Build table headers
  const thsHtml = columns
    .map(col => {
      const align = col.align || defaultAlign;
      const width = col.width ? `style="width: ${col.width}; text-align: ${align};"` : `style="text-align: ${align};"`;
      return `<th ${width}>${escapeHtml(col.header)}</th>`;
    })
    .join('');

  // Build table rows
  const trsHtml = data.length > 0
    ? data
        .map((row, rowIdx) => {
          const tdsHtml = columns
            .map(col => {
              const align = col.align || defaultAlign;
              let rawVal: any = '';
              if (col.getter) {
                rawVal = col.getter(row, rowIdx);
              } else if (col.key) {
                rawVal = row[col.key];
              }
              const displayVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : '-';
              return `<td style="text-align: ${align};">${escapeHtml(displayVal)}</td>`;
            })
            .join('');
          return `<tr>${tdsHtml}</tr>`;
        })
        .join('')
    : `<tr><td colspan="${columns.length}" style="text-align: center; padding: 24px; color: #64748b;">${isRtl ? 'لا توجد بيانات متاحة' : 'No records found matching current filters'}</td></tr>`;

  return `<!DOCTYPE html>
<html lang="${isRtl ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} - ${escapeHtml(appName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: ${isRtl ? "'Cairo', Tahoma, Arial, sans-serif" : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
      color: #1e293b;
      background: #f8fafc;
      font-size: 12px;
      line-height: 1.4;
      padding: 20px;
    }

    .report-container {
      max-width: 1200px;
      margin: 0 auto;
      background: #ffffff;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
    }

    /* Top Action Bar (hidden in print) */
    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .btn-primary {
      background: #28aaa9;
      color: #ffffff;
    }

    .btn-primary:hover {
      background: #238f8e;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    /* Report Header */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
    }

    .header-main h1 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .header-main .subtitle {
      font-size: 13px;
      color: #64748b;
    }

    .header-meta {
      text-align: ${isRtl ? 'left' : 'right'};
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }

    .header-meta .app-name {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }

    /* Filter Summary Box */
    .filter-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .filter-title {
      font-weight: 700;
      font-size: 11px;
      color: #475569;
      margin-${isRtl ? 'left' : 'right'}: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .filter-pill {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      display: inline-flex;
      gap: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }

    .filter-label {
      color: #64748b;
      font-weight: 500;
    }

    .filter-val {
      color: #0f172a;
      font-weight: 600;
    }

    .no-filter-pill {
      color: #64748b;
      font-style: italic;
      font-size: 11px;
    }

    /* KPI Summary Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }

    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
    }

    .stat-label {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 500;
    }

    .stat-value {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }

    /* Excel-like Table */
    .table-container {
      width: 100%;
      overflow-x: auto;
      margin-bottom: 16px;
    }

    table.excel-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      background: #ffffff;
    }

    table.excel-table th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      white-space: nowrap;
      text-transform: uppercase;
      font-size: 10.5px;
      letter-spacing: 0.3px;
    }

    table.excel-table td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: middle;
    }

    table.excel-table tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }

    table.excel-table tbody tr:hover {
      background-color: #f1f5f9;
    }

    /* Footer Note & Print Pagination */
    .report-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
    }

    /* PRINT SPECIFIC STYLES */
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
        font-size: 10.5px !important;
      }

      .report-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }

      .action-bar {
        display: none !important;
      }

      .filter-section {
        background: #fafafa !important;
        border: 1px solid #ddd !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .stat-card {
        background: #fafafa !important;
        border: 1px solid #ddd !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      table.excel-table th {
        background: #f1f5f9 !important;
        color: #000000 !important;
        border: 1px solid #94a3b8 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      table.excel-table td {
        border: 1px solid #cbd5e1 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      table.excel-table tbody tr:nth-child(even) {
        background-color: #f8fafc !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      thead {
        display: table-header-group;
      }

      tr {
        page-break-inside: avoid;
      }

      @page {
        size: landscape;
        margin: 10mm;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="action-bar no-print">
      <div style="font-weight: 600; font-size: 14px; color: #475569;">
        ${isRtl ? 'معاينة التقرير للطباعة' : 'Printable Report Preview'}
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-primary" onclick="window.print()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          ${isRtl ? 'طباعة التقرير' : 'Print Report'}
        </button>
        <button class="btn btn-secondary" onclick="window.close()">
          ${isRtl ? 'إغلاق' : 'Close'}
        </button>
      </div>
    </div>

    <div class="report-header">
      <div class="header-main">
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ''}
      </div>
      <div class="header-meta">
        <div class="app-name">${escapeHtml(appName)}</div>
        <div>${isRtl ? 'تاريخ الطباعة:' : 'Date:'} ${dateStr} ${timeStr}</div>
        <div>${isRtl ? 'إجمالي السجلات:' : 'Total Records:'} <strong>${data.length}</strong></div>
      </div>
    </div>

    <div class="filter-section">
      <div class="filter-title">${isRtl ? 'الفلاتر النشطة:' : 'Applied Filters:'}</div>
      ${filtersHtml}
    </div>

    ${statsHtml}

    <div class="table-container">
      <table class="excel-table">
        <thead>
          <tr>
            ${thsHtml}
          </tr>
        </thead>
        <tbody>
          ${trsHtml}
        </tbody>
      </table>
    </div>

    <div class="report-footer">
      <div>${footerNote ? escapeHtml(footerNote) : `${escapeHtml(appName)} - ${escapeHtml(title)}`}</div>
      <div>${isRtl ? 'تم التوليد آلياً من النظام' : 'Generated automatically by Car Dealership System'}</div>
    </div>
  </div>

  <script>
    // Auto trigger print dialog after loading styles and fonts
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;
}

export function openPrintReportWindow(options: PrintReportOptions): void {
  const html = generatePrintReportHtml(options);
  const printWindow = window.open('', '_blank', 'width=1150,height=800,menubar=no,toolbar=no,location=no,status=no');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  } else {
    // If popup blocked, create invisible iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2000);
      }, 500);
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
