import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
// @ts-expect-error - No type definitions for arabic-reshaper
import arabicReshaper from 'arabic-reshaper';

function processArabic(text: string): string {
  if (!text) return '';
  if (!/[\u0600-\u06FF]/.test(text)) return text;
  
  interface ReshaperObj {
    convertArabic?: (s: string) => string;
    reshape?: (s: string) => string;
    default?: ReshaperObj;
  }
  const reshaper = arabicReshaper as ReshaperObj;
  const findReshape = (obj: ReshaperObj): ((t: string) => string) | null => {
    if (!obj) return null;
    if (typeof obj.convertArabic === 'function') return obj.convertArabic.bind(obj);
    if (typeof obj.reshape === 'function') return obj.reshape.bind(obj);
    if (obj.default) {
      const d = obj.default;
      if (typeof d.convertArabic === 'function') return d.convertArabic.bind(d);
      if (typeof d.reshape === 'function') return d.reshape.bind(d);
    }
    return null;
  };

  const reshapeFn = findReshape(reshaper);
  
  try {
    const reshaped = reshapeFn ? reshapeFn(text) : text;
    return reshaped.replace(/[\u0600-\u06FF\uFE70-\uFEFF\uFB50-\uFDFF]+/g, (match: string) => {
      return match.split('').reverse().join('');
    });
  } catch (e) {
    console.error('Arabic processing error:', e);
    return text;
  }
}

interface ReportData {
  reportId: string;
  reportDate: string;
  type: 'Rental' | 'Installment';
  customer: {
    name: string;
    phone: string;
    id?: string;
  };
  car: {
    carId: string;
    brand: string;
    model: string;
    year: number;
    plateNumber?: string;
    chassisNumber?: string;
  };
  agreement: {
    startDate: string;
    endDate?: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: string;
    rate?: number;
    rateType?: string;
  };
  payments: Array<{
    date: string;
    amount: number;
    method: string;
    reference?: string;
    note?: string;
    status?: string;
  }>;
}

export async function generateStatusReport(data: ReportData): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'reports');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `report-${data.reportId}.pdf`;
  const filePath = path.join(uploadsDir, fileName);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Load fonts
  const regularFontPath = path.join(process.cwd(), 'public', 'fonts', 'Cairo-Regular.ttf');
  const boldFontPath = path.join(process.cwd(), 'public', 'fonts', 'Cairo-Bold.ttf');
  
  if (fs.existsSync(regularFontPath)) {
    const regularFont = fs.readFileSync(regularFontPath).toString('base64');
    doc.addFileToVFS('Cairo-Regular.ttf', regularFont);
    doc.addFont('Cairo-Regular.ttf', 'Cairo', 'normal');
  }
  
  if (fs.existsSync(boldFontPath)) {
    const boldFont = fs.readFileSync(boldFontPath).toString('base64');
    doc.addFileToVFS('Cairo-Bold.ttf', boldFont);
    doc.addFont('Cairo-Bold.ttf', 'Cairo', 'bold');
  }

  doc.setFont('Cairo');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 20;

  const currency = 'SAR';
  const fmt = (n: number) => `${n.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 170, 169);
  doc.setFont('Cairo', 'bold');
  doc.text('CAR DEALERSHIP', pageWidth / 2, y, { align: 'center' });

  y += 12;
  doc.setFontSize(16);
  doc.setTextColor(51, 51, 51);
  doc.text(`${data.type} Status Report`, pageWidth / 2, y, { align: 'center' });

  y += 6;
  doc.setFontSize(11);
  doc.setFont('Cairo', 'normal');
  doc.setTextColor(100, 100, 100);
  const reportLabelAr = data.type === 'Rental' ? 'تقرير حالة الإيجار' : 'تقرير حالة الأقساط';
  doc.text(processArabic(reportLabelAr), pageWidth / 2, y, { align: 'center' });

  y += 10;
  doc.setDrawColor(40, 170, 169);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // Meta
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(51, 51, 51);
  doc.setFont('Cairo', 'bold');
  doc.text(`${processArabic('Report ID / رقم التقرير')}:`, margin, y);
  doc.setFont('Cairo', 'normal');
  doc.text(data.reportId, margin + 35, y);
  doc.setFont('Cairo', 'bold');
  doc.text(`${processArabic('Date / التاريخ')}:`, pageWidth / 2 + 5, y);
  doc.setFont('Cairo', 'normal');
  doc.text(new Date(data.reportDate).toLocaleDateString('en-SA'), pageWidth / 2 + 25, y);

  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  // Customer & Vehicle Section
  y += 8;
  doc.setFontSize(10);
  doc.setFont('Cairo', 'bold');
  doc.text(processArabic('Customer & Vehicle / العميل والمركبة'), margin, y);

  y += 6;
  doc.setFont('Cairo', 'normal');
  doc.setFontSize(9);
  doc.text(`${processArabic('Customer / العميل')}: ${processArabic(data.customer.name)}`, margin, y);
  doc.text(`${processArabic('Vehicle / المركبة')}: ${processArabic(data.car.brand + ' ' + data.car.model)} (${data.car.year})`, pageWidth / 2 + 5, y);

  y += 5;
  doc.text(`${processArabic('Phone / الهاتف')}: ${data.customer.phone}`, margin, y);
  doc.text(`${processArabic('Plate No / رقم اللوحة')}: ${data.car.plateNumber || '-'}`, pageWidth / 2 + 5, y);

  // Agreement Details
  y += 12;
  doc.setFont('Cairo', 'bold');
  doc.text(processArabic('Agreement Details / تفاصيل الاتفاقية'), margin, y);

  y += 6;
  doc.setFont('Cairo', 'normal');
  doc.text(`${processArabic('Start Date / تاريخ البدء')}: ${new Date(data.agreement.startDate).toLocaleDateString('en-SA')}`, margin, y);
  if (data.agreement.endDate) {
    doc.text(`${processArabic('End Date / تاريخ الانتهاء')}: ${new Date(data.agreement.endDate).toLocaleDateString('en-SA')}`, pageWidth / 2 + 5, y);
  }

  y += 5;
  doc.text(`${processArabic('Status / الحالة')}: ${data.agreement.status}`, margin, y);
  if (data.agreement.rate) {
    doc.text(`${processArabic('Rate / السعر')}: ${fmt(data.agreement.rate)} (${data.agreement.rateType})`, pageWidth / 2 + 5, y);
  }

  // Financial Summary
  y += 12;
  doc.setFont('Cairo', 'bold');
  doc.text(processArabic('Financial Summary / الخلاصة المالية'), margin, y);

  y += 6;
  doc.setFont('Cairo', 'normal');
  doc.text(`${processArabic('Total Amount / الإجمالي')}:`, margin, y);
  doc.text(fmt(data.agreement.totalAmount), margin + 40, y);

  y += 5;
  doc.text(`${processArabic('Paid Amount / المبلغ المدفوع')}:`, margin, y);
  doc.setTextColor(46, 125, 50);
  doc.text(fmt(data.agreement.paidAmount), margin + 40, y);
  doc.setTextColor(51, 51, 51);

  y += 5;
  doc.setFont('Cairo', 'bold');
  doc.text(`${processArabic('Remaining / المبلغ المتبقي')}:`, margin, y);
  doc.setTextColor(198, 40, 40);
  doc.text(fmt(data.agreement.remainingAmount), margin + 40, y);
  doc.setTextColor(51, 51, 51);

  // Payment History Table
  y += 15;
  doc.setFontSize(10);
  doc.setFont('Cairo', 'bold');
  doc.text(processArabic('Payment History / سجل المدفوعات'), margin, y);

  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;
  doc.setFontSize(8.5);
  doc.text(processArabic('Date / التاريخ'), margin, y);
  doc.text(processArabic('Amount / المبلغ'), margin + 30, y);
  doc.text(processArabic('Method / الطريقة'), margin + 60, y);
  doc.text(processArabic('Ref / المرجع'), margin + 90, y);
  doc.text(processArabic('Notes / ملاحظات'), margin + 120, y);

  y += 4;
  doc.line(margin, y, pageWidth - margin, y);

  doc.setFont('Cairo', 'normal');
  data.payments.forEach((p) => {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }
    y += 7;
    doc.text(new Date(p.date).toLocaleDateString('en-SA'), margin, y);
    doc.text(fmt(p.amount), margin + 30, y);
    doc.text(processArabic(p.method), margin + 60, y);
    doc.text(p.reference || '-', margin + 90, y);
    doc.text(processArabic(p.note || '-'), margin + 120, y, { maxWidth: 50 });
  });

  const pdfBuffer = doc.output('arraybuffer');
  fs.writeFileSync(filePath, Buffer.from(pdfBuffer));

  return `/uploads/reports/${fileName}`;
}
