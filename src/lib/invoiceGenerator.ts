import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
// @ts-expect-error - No type definitions for arabic-reshaper
import arabicReshaper from 'arabic-reshaper';

import { ensureVisualQRCode } from '@/lib/zatca/invoiceService';

function processArabic(text: string): string {
  if (!text) return '';
  // Check if text contains Arabic characters
  if (!/[\u0600-\u06FF]/.test(text)) return text;
  
  // Robust detection for CJS/ESM interop
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
    // 1. Reshape first to handle joining
    const reshaped = reshapeFn ? reshapeFn(text) : text;
    
    // 2. Surgically reverse ONLY segments that contain Arabic/reshaped characters.
    // This regex targets Arabic characters (original and reshaped forms).
    // \u0600-\u06FF (Standard Arabic)
    // \uFE70-\uFEFF (Arabic Presentation Forms-B / Reshaped)
    // \uFB50-\uFDFF (Arabic Presentation Forms-A / Reshaped)
    return reshaped.replace(/[\u0600-\u06FF\uFE70-\uFEFF\uFB50-\uFDFF]+/g, (match: string) => {
      return match.split('').reverse().join('');
    });
  } catch (e) {
    console.error('Arabic processing error:', e);
    return text;
  }
}

interface InvoiceData {
  saleId: string;
  saleDate: string;
  carId: string;
  carBrand?: string;
  carModel?: string;
  carYear?: number;
  carPlate?: string;
  carVin?: string;
  carEngineNumber?: string;
  carSequenceNumber?: string;
  carColor?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerId?: string;
  salePrice: number;
  discountType?: 'flat' | 'percentage';
  discountValue?: number;
  discountAmount: number;
  finalPrice: number;
  vatRate?: number;
  vatAmount?: number;
  finalPriceWithVat?: number;
  downPayment?: number;
  loanAmount?: number;
  monthlyPayment?: number;
  tenureMonths?: number;
  startDate?: string;
  endDate?: string;
  agentName?: string;
  agentCommission?: number;
  zatcaQRCode?: string;    // base64 QR image data URL
  zatcaUUID?: string;
  invoiceType?: string;    // 'Standard' | 'Simplified'
}

function drawBarcode(doc: jsPDF, text: string, x: number, y: number, width: number, height: number) {
  if (!text) return;
  const safeText = String(text).toUpperCase();
  const code39: Record<string, string> = {
    '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
    '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
    '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
    'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
    'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
    'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
    'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
    'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
    'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
    '-': '100101011011', '.': '110010101101', ' ': '100110101101', '*': '100101101101',
    '$': '100100100101', '/': '100100101001', '+': '100101001001', '%': '101001001001'
  };

  const fullText = `*${safeText}*`;
  let totalModules = 0;
  for (const char of fullText) {
    if (code39[char]) totalModules += code39[char].length + 1;
  }
  
  const moduleWidth = width / totalModules;
  let currentX = x;

  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(0, 0, 0);

  for (const char of fullText) {
    const pattern = code39[char] || code39[' '];
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === '1') {
        doc.rect(currentX, y, moduleWidth, height, 'F');
      }
      currentX += moduleWidth;
    }
    currentX += moduleWidth; // Inter-character gap
  }
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
  doc.text(`${processArabic('Invoice No / رقم الفاتورة')}:`, margin, y);
  doc.setFont('Cairo', 'normal');
  doc.text(data.saleId, margin + 35, y);
  doc.setFont('Cairo', 'bold');
  doc.text(`${processArabic('Date / التاريخ')}:`, pageWidth / 2 + 5, y);
  doc.setFont('Cairo', 'normal');
  doc.text(new Date(data.saleDate).toLocaleDateString('en-SA'), pageWidth / 2 + 25, y);

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
  doc.text(`${processArabic('Name / الاسم')}: ${processArabic(data.customerName || 'Cash Customer')}`, margin, y);

  if (data.customerId) {
    y += 5;
    doc.text(`${processArabic('ID/Iqama / الهوية/الإقامة')}: ${data.customerId}`, margin, y);
  }

  if (data.customerPhone) {
    y += 5;
    doc.text(`${processArabic('Phone / الهاتف')}: ${data.customerPhone}`, margin, y);
  }

  if (data.customerAddress) {
    y += 5;
    doc.text(`${processArabic('Address / العنوان')}: ${processArabic(data.customerAddress)}`, margin, y);
  }

  if (data.agentName) {
    y += 5;
    doc.setFont('Cairo', 'bold');
    doc.text(`${processArabic('Agent / المندوب')}: ${processArabic(data.agentName)}`, margin, y);
    doc.setFont('Cairo', 'normal');
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
  doc.text(`${processArabic('Car ID / رقم المركبة')}: ${data.carId}`, margin, y);
  
  if (data.carPlate) {
    doc.text(`${processArabic('Plate / رقم اللوحة')}: ${data.carPlate}`, pageWidth / 2 + 5, y);
  }

  if (data.carBrand || data.carModel) {
    y += 5;
    doc.text(`${processArabic('Vehicle / المركبة')}: ${processArabic((data.carBrand || '') + ' ' + (data.carModel || ''))}`.trim(), margin, y);
    if (data.carYear) {
      doc.text(`${processArabic('Year / سنة الصنع')}: ${data.carYear}`, pageWidth / 2 + 5, y);
    }
  }

  if (data.carVin) {
    y += 5;
    doc.text(`${processArabic('VIN / رقم الهيكل')}: ${data.carVin}`, margin, y);
    if (data.carEngineNumber) {
      doc.text(`${processArabic('Engine / رقم المحرك')}: ${data.carEngineNumber}`, pageWidth / 2 + 5, y);
    }
  }

  if (data.carSequenceNumber) {
    y += 5;
    doc.text(`${processArabic('Sequence / رقم التسلسل')}: ${data.carSequenceNumber}`, margin, y);
  }

  if (data.carColor) {
    y += 5;
    doc.text(`${processArabic('Color / اللون')}: ${processArabic(data.carColor)}`, margin, y);
  }

  // Financial / Rental Details (if applicable)
  if (data.downPayment !== undefined || data.tenureMonths || data.startDate) {
    y += 12;
    doc.setFontSize(10);
    doc.setFont('Cairo', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(processArabic('Financial & Contract Details / التفاصيل المالية والتعاقدية'), margin, y);

    y += 6;
    doc.setFont('Cairo', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    if (data.startDate) {
      const dates = data.endDate ? `${new Date(data.startDate).toLocaleDateString('en-SA')} - ${new Date(data.endDate).toLocaleDateString('en-SA')}` : new Date(data.startDate).toLocaleDateString('en-SA');
      doc.text(`${processArabic('Period / الفترة')}: ${dates}`, margin, y);
    }

    if (data.tenureMonths) {
      doc.text(`${processArabic('Tenure / المدة')}: ${data.tenureMonths} ${processArabic('Months / شهر')}`, pageWidth / 2 + 5, y);
    }

    if (data.downPayment !== undefined) {
      y += 5;
      doc.text(`${processArabic('Down Payment / الدفعة الأولى')}: ${fmt(data.downPayment)}`, margin, y);
      if (data.monthlyPayment) {
        doc.text(`${processArabic('Monthly Payment / القسط الشهري')}: ${fmt(data.monthlyPayment)}`, pageWidth / 2 + 5, y);
      }
    }
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
  doc.text(processArabic('Description / الوصف'), margin, y);
  doc.text(processArabic(`Amount (${currency}) / المبلغ (${currency})`), pageWidth - margin, y, { align: 'right' });

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

  // QR code and Barcode Section
  const visualQR = await ensureVisualQRCode(data.zatcaQRCode || '');
  const qrSize = 32;
  const qrX = margin;
  const qrY = pageHeight - margin - qrSize - 15; // Raised slightly

  if (visualQR && visualQR !== 'N/A') {
    try {
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(processArabic('ZATCA QR Code / رمز الاستجابة السريعة'), qrX, qrY - 2);
      
      const format = visualQR.includes('jpeg') || visualQR.includes('jpg') ? 'JPEG' : 'PNG';
      const base64Data = visualQR.includes(';base64,') 
        ? visualQR.split(';base64,').pop() || ''
        : visualQR;
      
      if (base64Data && base64Data.length > 50) {
        console.log(`PDF: Embedding QR Code (${format}, length: ${base64Data.length})`);
        doc.addImage(base64Data, format, qrX, qrY, qrSize, qrSize);
      } else {
        console.warn('PDF: QR Code data too short or invalid, skipping image');
      }

      // 1D Barcode on the right
      const barcodeWidth = 50;
      const barcodeHeight = 10;
      const barcodeX = pageWidth - margin - barcodeWidth;
      const barcodeY = qrY + (qrSize / 2) - (barcodeHeight / 2);
      
      drawBarcode(doc, data.saleId, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
      doc.setFontSize(7);
      doc.text(`${processArabic('Invoice ID / رقم الفاتورة')}: ${data.saleId}`, barcodeX + barcodeWidth / 2, barcodeY + barcodeHeight + 4, { align: 'center' });

    } catch (qrError) {
      console.error('Failed to embed QR Code in PDF:', qrError);
    }
  } else {
    // Fallback: 1D Barcode only if no ZATCA QR
    const barcodeWidth = 60;
    const barcodeHeight = 12;
    const barcodeX = (pageWidth - barcodeWidth) / 2;
    const barcodeY = pageHeight - margin - 35;
    
    drawBarcode(doc, data.saleId, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`${processArabic('Invoice ID / رقم الفاتورة')}: ${data.saleId}`, pageWidth / 2, barcodeY + barcodeHeight + 5, { align: 'center' });
  }

  // Footer
  const footerY = pageHeight - margin - 10;
  doc.setFontSize(7.5);
  doc.setTextColor(136, 136, 136);
  doc.setFont('Cairo', 'normal');
  doc.text(processArabic('Thank you for your business! / شكراً لتعاملكم معنا'), pageWidth / 2, footerY, { align: 'center' });
  doc.text(processArabic('This is a computer-generated tax invoice. / هذه الفاتورة تم إنشاؤها آلياً.'), pageWidth / 2, footerY + 5, { align: 'center' });

  const pdfBuffer = doc.output('arraybuffer');
  fs.writeFileSync(filePath, Buffer.from(pdfBuffer));

  return `/uploads/invoices/${fileName}`;
}