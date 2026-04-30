import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import arabicReshaper from 'arabic-reshaper';
// @ts-ignore
import bidiFactory from 'bidi-js';
const bidi = bidiFactory();

function processArabic(text: string): string {
  if (!text) return '';
  // Check if text contains Arabic characters
  if (!/[\u0600-\u06FF]/.test(text)) return text;
  
  const reshaped = arabicReshaper.reshape(text);
  return bidi.getReorderedString(reshaped);
}

interface InvoiceData {
  saleId: string;
  saleDate: string;
  carId: string;
  carBrand?: string;
  carModel?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  salePrice: number;
  discountType?: 'flat' | 'percentage';
  discountValue?: number;
  discountAmount: number;
  finalPrice: number;
  vatRate?: number;
  vatAmount?: number;
  finalPriceWithVat?: number;
  agentName?: string;
  agentCommission?: number;
  zatcaQRCode?: string;    // base64 QR image data URL
  zatcaUUID?: string;
  invoiceType?: string;    // 'Standard' | 'Simplified'
}

export async function generateInvoice(data: InvoiceData): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'invoices');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `invoice-${data.saleId}.pdf`;
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

  const isSimplified = data.invoiceType !== 'Standard';
  const invoiceLabel = isSimplified ? 'Simplified Tax Invoice' : 'Tax Invoice';
  const invoiceLabelAr = isSimplified ? 'فاتورة ضريبية مبسطة' : 'فاتورة ضريبية';
  const currency = 'SAR';
  const fmt = (n: number) => `${n.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 170, 169);
  doc.setFont('Cairo', 'bold');
  doc.text('CAR DEALERSHIP', pageWidth / 2, y, { align: 'center' });

  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  doc.setFont('Cairo', 'normal');
  doc.text(processArabic('مركز بيع وتأجير السيارات'), pageWidth / 2, y, { align: 'center' });

  y += 12;
  doc.setFontSize(16);
  doc.setTextColor(51, 51, 51);
  doc.setFont('Cairo', 'bold');
  doc.text(invoiceLabel, pageWidth / 2, y, { align: 'center' });

  y += 6;
  doc.setFontSize(11);
  doc.setFont('Cairo', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(processArabic(invoiceLabelAr), pageWidth / 2, y, { align: 'center' });

  y += 10;
  doc.setDrawColor(40, 170, 169);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // Invoice meta
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(51, 51, 51);
  doc.setFont('Cairo', 'bold');
  doc.text('Invoice No:', margin, y);
  doc.setFont('Cairo', 'normal');
  doc.text(data.saleId, margin + 22, y);
  doc.setFont('Cairo', 'bold');
  doc.text('Date:', pageWidth / 2 + 5, y);
  doc.setFont('Cairo', 'normal');
  doc.text(new Date(data.saleDate).toLocaleDateString('en-SA'), pageWidth / 2 + 18, y);

  if (data.zatcaUUID) {
    y += 5;
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(`UUID: ${data.zatcaUUID}`, margin, y);
  }

  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  // Customer details
  y += 8;
  doc.setFontSize(10);
  doc.setFont('Cairo', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(processArabic('Customer Details / بيانات العميل'), margin, y);

  y += 6;
  doc.setFont('Cairo', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Name: ${processArabic(data.customerName)}`, margin, y);

  y += 5;
  doc.text(`Phone: ${data.customerPhone}`, margin, y);

  if (data.customerAddress) {
    y += 5;
    doc.text(`Address: ${processArabic(data.customerAddress)}`, margin, y);
  }

  // Vehicle details
  y += 12;
  doc.setFontSize(10);
  doc.setFont('Cairo', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(processArabic('Vehicle Details / بيانات المركبة'), margin, y);

  y += 6;
  doc.setFont('Cairo', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Car ID: ${data.carId}`, margin, y);

  if (data.carBrand || data.carModel) {
    y += 5;
    doc.text(`Vehicle: ${processArabic((data.carBrand || '') + ' ' + (data.carModel || ''))}`.trim(), margin, y);
  }

  // Payment table
  y += 12;
  doc.setFontSize(10);
  doc.setFont('Cairo', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(processArabic('Payment Details / تفاصيل الدفع'), margin, y);

  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;
  doc.setFont('Cairo', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Description', margin, y);
  doc.text(`Amount (${currency})`, pageWidth - margin, y, { align: 'right' });

  y += 4;
  doc.line(margin, y, pageWidth - margin, y);

  // Sale Price row
  y += 7;
  doc.setFont('Cairo', 'normal');
  doc.text(processArabic('Sale Price / سعر البيع'), margin, y);
  doc.text(fmt(data.salePrice), pageWidth - margin, y, { align: 'right' });

  // Discount row
  if (data.discountAmount > 0) {
    y += 6;
    const discountLabel = data.discountType === 'percentage' && data.discountValue
      ? `Discount (${data.discountValue}%) / خصم`
      : 'Discount / خصم';
    doc.text(processArabic(discountLabel), margin, y);
    doc.setTextColor(200, 60, 60);
    doc.text(`-${fmt(data.discountAmount)}`, pageWidth - margin, y, { align: 'right' });
    doc.setTextColor(60, 60, 60);
  }

  // Subtotal (excl VAT)
  const subtotal = data.finalPrice;
  y += 6;
  doc.setFont('Cairo', 'bold');
  doc.text(processArabic('Subtotal (Excl. VAT) / المجموع قبل الضريبة'), margin, y);
  doc.text(fmt(subtotal), pageWidth - margin, y, { align: 'right' });

  // VAT row
  const vatRate = data.vatRate || 15;
  const vatAmount = data.vatAmount || Math.round(subtotal * (vatRate / 100) * 100) / 100;
  y += 6;
  doc.setFont('Cairo', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(processArabic(`VAT ${vatRate}% / ضريبة القيمة المضافة ${vatRate}%`), margin, y);
  doc.text(fmt(vatAmount), pageWidth - margin, y, { align: 'right' });

  // Total with VAT
  const totalWithVat = data.finalPriceWithVat || (subtotal + vatAmount);
  y += 8;
  doc.setDrawColor(40, 170, 169);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;
  doc.setFont('Cairo', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(40, 170, 169);
  doc.text(processArabic('TOTAL (Incl. VAT) / الإجمالي شامل الضريبة'), margin, y);
  doc.text(fmt(totalWithVat), pageWidth - margin, y, { align: 'right' });

  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  // Agent commission
  if (data.agentName && data.agentCommission) {
    y += 8;
    doc.setFont('Cairo', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`Agent: ${processArabic(data.agentName)}`, margin, y);
    doc.text(`Commission: ${fmt(data.agentCommission)}`, pageWidth - margin, y, { align: 'right' });
  }

  // QR code (ZATCA compliant — mandatory for simplified invoices)
  if (data.zatcaQRCode) {
    const qrSize = 35;
    const qrY = pageHeight - margin - qrSize - 20;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(processArabic('ZATCA QR Code / رمز الاستجابة السريعة'), margin, qrY - 2);
    doc.addImage(data.zatcaQRCode, 'PNG', margin, qrY, qrSize, qrSize);
  }

  // Footer
  const footerY = pageHeight - margin - 10;
  doc.setFontSize(7.5);
  doc.setTextColor(136, 136, 136);
  doc.setFont('Cairo', 'normal');
  doc.text(processArabic('Thank you for your business! / شكراً لتعاملكم معنا'), pageWidth / 2, footerY, { align: 'center' });
  doc.text('This is a computer-generated tax invoice.', pageWidth / 2, footerY + 5, { align: 'center' });

  const pdfBuffer = doc.output('arraybuffer');
  fs.writeFileSync(filePath, Buffer.from(pdfBuffer));

  return `/uploads/invoices/${fileName}`;
}