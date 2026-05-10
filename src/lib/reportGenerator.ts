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
    nationalId?: string;
  };
  car: {
    carId: string;
    brand: string;
    model: string;
    year: number;
    plateNumber?: string;
    chassisNumber?: string;
    engineNumber?: string;
    color?: string;
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
    downPayment?: number;
    tenureMonths?: number;
    interestRate?: number;
    voucherNumber?: string;
    totalLateFee?: number;
  };
  payments: Array<{
    date: string;
    amount: number;
    method: string;
    reference?: string;
    note?: string;
    status?: string;
    lateFee?: number;
    voucherNumber?: string;
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

  y += 5;
  if (data.customer.nationalId) {
    doc.text(`${processArabic('National ID / الهوية الوطنية')}: ${data.customer.nationalId}`, margin, y);
  }
  if (data.car.chassisNumber) {
    doc.text(`${processArabic('VIN / رقم الشاصي')}: ${data.car.chassisNumber}`, pageWidth / 2 + 5, y);
  }

  if (data.car.engineNumber || data.car.color) {
    y += 5;
    if (data.car.engineNumber) {
      doc.text(`${processArabic('Engine No / رقم المحرك')}: ${data.car.engineNumber}`, margin, y);
    }
    if (data.car.color) {
      doc.text(`${processArabic('Color / اللون')}: ${processArabic(data.car.color)}`, pageWidth / 2 + 5, y);
    }
  }

  // Agreement Details
  y += 12;
  doc.setFont('Cairo', 'bold');
  doc.text(processArabic('Agreement Details / تفاصيل الاتفاقية'), margin, y);

  y += 6;
  doc.setFont('Cairo', 'normal');
  doc.text(`${processArabic('Start Date / تاريخ البدء')}: ${new Date(data.agreement.startDate).toLocaleDateString('en-SA')}`, margin, y);
  if (data.agreement.endDate) {
    doc.text(`${processArabic('End Date / تاريخ الانتهاء')}: ${new Date(data.agreement.endDate).toLocaleDateString('en-SA')}`, pageWidth / 2 + 5, y);
  } else if (data.agreement.tenureMonths) {
    doc.text(`${processArabic('Tenure / المدة')}: ${data.agreement.tenureMonths} ${processArabic('Months / أشهر')}`, pageWidth / 2 + 5, y);
  }

  y += 5;
  doc.text(`${processArabic('Status / الحالة')}: ${data.agreement.status}`, margin, y);
  if (data.agreement.rate) {
    doc.text(`${processArabic('Rate / السعر')}: ${fmt(data.agreement.rate)} (${data.agreement.rateType})`, pageWidth / 2 + 5, y);
  }

  if (data.agreement.downPayment !== undefined || data.agreement.voucherNumber) {
    y += 5;
    if (data.agreement.downPayment !== undefined) {
      doc.text(`${processArabic('Down Payment / دفعة مقدمة')}: ${fmt(data.agreement.downPayment)}`, margin, y);
    }
    if (data.agreement.voucherNumber) {
      doc.text(`${processArabic('Voucher No / رقم القسيمة')}: ${data.agreement.voucherNumber}`, pageWidth / 2 + 5, y);
    }
  }

  if (data.agreement.interestRate !== undefined) {
    y += 5;
    doc.text(`${processArabic('Interest Rate / نسبة الفائدة')}: ${data.agreement.interestRate}%`, margin, y);
  }

  // Financial Summary
  y += 12;
  doc.setFont('Cairo', 'bold');
  doc.text(processArabic('Financial Summary / الخلاصة المالية'), margin, y);

  y += 6;
  doc.setFont('Cairo', 'normal');
  doc.text(`${processArabic('Total Amount / الإجمالي')}:`, margin, y);
  doc.text(fmt(data.agreement.totalAmount), margin + 45, y);

  y += 5;
  doc.text(`${processArabic('Paid Amount / المبلغ المدفوع')}:`, margin, y);
  doc.setTextColor(46, 125, 50);
  doc.text(fmt(data.agreement.paidAmount), margin + 45, y);
  doc.setTextColor(51, 51, 51);

  y += 5;
  doc.setFont('Cairo', 'bold');
  doc.text(`${processArabic('Remaining / المبلغ المتبقي')}:`, margin, y);
  doc.setTextColor(198, 40, 40);
  doc.text(fmt(data.agreement.remainingAmount), margin + 45, y);
  doc.setTextColor(51, 51, 51);

  if (data.agreement.totalLateFee) {
    y += 5;
    doc.text(`${processArabic('Total Late Fees / إجمالي غرامات التأخير')}:`, margin, y);
    doc.setTextColor(198, 40, 40);
    doc.text(fmt(data.agreement.totalLateFee), margin + 45, y);
    doc.setTextColor(51, 51, 51);
  }

  // Payment History Table
  y += 15;
  doc.setFontSize(10);
  doc.setFont('Cairo', 'bold');
  doc.text(processArabic('Payment History / سجل المدفوعات'), margin, y);

  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;
  doc.setFontSize(8);
  doc.text(processArabic('Date / التاريخ'), margin, y);
  doc.text(processArabic('Amount / المبلغ'), margin + 25, y);
  doc.text(processArabic('Late Fee / غرامة'), margin + 55, y);
  doc.text(processArabic('Method / الطريقة'), margin + 85, y);
  doc.text(processArabic('Voucher / قسيمة'), margin + 115, y);
  doc.text(processArabic('Ref / مرجع'), margin + 145, y);

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
    doc.text(fmt(p.amount), margin + 25, y);
    doc.text(fmt(p.lateFee || 0), margin + 55, y);
    doc.text(processArabic(p.method), margin + 85, y);
    doc.text(p.voucherNumber || '-', margin + 115, y);
    doc.text(p.reference || '-', margin + 145, y);
  });

  const pdfBuffer = doc.output('arraybuffer');
  fs.writeFileSync(filePath, Buffer.from(pdfBuffer));

  return `/uploads/reports/${fileName}`;
}
