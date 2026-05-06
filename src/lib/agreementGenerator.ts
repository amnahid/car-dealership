import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
// @ts-expect-error
import arabicReshaper from 'arabic-reshaper';
// @ts-expect-error
import bidiFactoryImport from 'bidi-js';

// Robust detection for CJS/ESM interop in Turbopack/Next.js
const bidiFactory = typeof bidiFactoryImport === 'function' 
  ? bidiFactoryImport 
  : (bidiFactoryImport as any).default;

const bidi = typeof bidiFactory === 'function' 
  ? bidiFactory() 
  : { 
      getReorderedString: (s: string) => s,
      getEmbeddingLevels: (s: string) => ({ paragraphs: [] })
    };

function processArabic(text: string): string {
  if (!text) return '';
  if (!/[\u0600-\u06FF]/.test(text)) return text;
  
  let reshaper: any = arabicReshaper;
  const findReshape = (obj: any): Function | null => {
    if (!obj) return null;
    if (typeof obj.convertArabic === 'function') return obj.convertArabic.bind(obj);
    if (typeof obj.reshape === 'function') return obj.reshape.bind(obj);
    if (obj.default) {
      const d = obj.default;
      if (typeof d.convertArabic === 'function') return d.convertArabic.bind(d);
      if (typeof d.reshape === 'function') return d.reshape.bind(d);
      if (d.default) {
        const dd = d.default;
        if (typeof dd.convertArabic === 'function') return dd.convertArabic.bind(dd);
        if (typeof dd.reshape === 'function') return dd.reshape.bind(dd);
      }
    }
    return null;
  };

  const reshapeFn = findReshape(reshaper);
  
  try {
    let reshaped = reshapeFn ? reshapeFn(text) : text;
    return reshaped.replace(/[\u0600-\u06FF\uFE70-\uFEFF]+/g, (match: string) => {
      return match.split('').reverse().join('');
    });
  } catch (e) {
    console.error('Arabic processing error:', e);
    return text;
  }
}

interface CommonData {
  saleId: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerNationalId?: string;
  carId: string;
  carBrand: string;
  carModel: string;
  carYear: number;
  carPlate: string;
  carVin: string;
  carEngineNumber?: string;
  carSequenceNumber?: string;
  carColor?: string;
}

interface InstallmentData extends CommonData {
  totalPrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  tenureMonths: number;
}

interface RentalData extends CommonData {
  startDate: string;
  endDate: string;
  dailyRate: number;
  totalAmount: number;
  securityDeposit: number;
}

async function setupDoc() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

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
  return doc;
}

const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'agreements');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function drawBarcode(doc: any, text: string, x: number, y: number, width: number, height: number) {
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

  const fullText = `*${text.toUpperCase()}*`;
  let totalModules = 0;
  for (const char of fullText) {
    if (code39[char]) totalModules += code39[char].length + 1;
  }
  
  const moduleWidth = width / totalModules;
  let currentX = x;

  doc.setDrawColor(0);
  doc.setFillColor(0);

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

export async function generateInstallmentAgreement(data: InstallmentData): Promise<string> {
  const doc = await setupDoc();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setTextColor(40, 170, 169);
  doc.setFont('Cairo', 'bold');
  doc.text('CAR INSTALLMENT AGREEMENT', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(14);
  doc.text(processArabic('عقد بيع سيارة بالتقسيط'), pageWidth / 2, y, { align: 'center' });

  y += 15;
  doc.setFontSize(10);
  doc.setTextColor(51, 51, 51);
  doc.text(`Date: ${new Date(data.date).toLocaleDateString('en-SA')}`, margin, y);
  doc.text(`Agreement No: ${data.saleId}`, pageWidth - margin, y, { align: 'right' });

  y += 10;
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // Parties
  y += 10;
  doc.setFont('Cairo', 'bold');
  doc.text('Parties / الأطراف', margin, y);
  y += 6;
  doc.setFont('Cairo', 'normal');
  doc.text(`Seller (First Party): AMYAL CAR TRADING`, margin, y);
  y += 5;
  doc.text(`Buyer (Second Party): ${processArabic(data.customerName)}`, margin, y);
  y += 5;
  doc.text(`Phone: ${data.customerPhone}`, margin, y);

  // Vehicle
  y += 12;
  doc.setFont('Cairo', 'bold');
  doc.text('Vehicle Details / بيانات المركبة', margin, y);
  y += 6;
  doc.setFont('Cairo', 'normal');
  doc.text(`Vehicle: ${processArabic(data.carBrand + ' ' + data.carModel)} (${data.carYear})`, margin, y);
  y += 5;
  doc.text(`Plate No: ${data.carPlate}`, margin, y);
  doc.text(`VIN (Chassis): ${data.carVin}`, pageWidth - margin, y, { align: 'right' });
  
  if (data.carEngineNumber || data.carSequenceNumber) {
    y += 5;
    if (data.carEngineNumber) {
      doc.text(`Engine No: ${data.carEngineNumber}`, margin, y);
    }
    if (data.carSequenceNumber) {
      doc.text(`Sequence No: ${data.carSequenceNumber}`, pageWidth - margin, y, { align: 'right' });
    }
  }

  if (data.carColor) {
    y += 5;
    doc.text(`Color: ${processArabic(data.carColor)}`, margin, y);
  }

  // Payment
  y += 12;
  doc.setFont('Cairo', 'bold');
  doc.text('Price & Payment / السعر والدفع', margin, y);
  y += 6;
  doc.setFont('Cairo', 'normal');
  doc.text(`Total Price: SAR ${data.totalPrice.toLocaleString()}`, margin, y);
  doc.text(`Down Payment: SAR ${data.downPayment.toLocaleString()}`, pageWidth - margin, y, { align: 'right' });
  y += 5;
  doc.text(`Monthly Installment: SAR ${data.monthlyPayment.toLocaleString()}`, margin, y);
  doc.text(`Tenure: ${data.tenureMonths} Months`, pageWidth - margin, y, { align: 'right' });

  // Terms
  y += 15;
  doc.setFont('Cairo', 'bold');
  doc.text('Terms & Conditions / الشروط والأحكام', margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont('Cairo', 'normal');
  const terms = [
    '1. Ownership remains with the Seller until the full amount is paid. / تبقى ملكية السيارة للبائع حتى يتم سداد كامل المبلغ.',
    '2. The Buyer is responsible for maintenance, insurance, and traffic fines. / يلتزم المشتري بالصيانة والتأمين والمخالفات المرورية.',
    '3. Late payment may result in penalty charges or vehicle repossession. / قد يؤدي التأخر في السداد إلى فرض غرامات أو استرداد السيارة.',
    '4. This agreement is governed by the laws of Saudi Arabia. / يخضع هذا العقد لقوانين المملكة العربية السعودية.'
  ];
  terms.forEach(term => {
    const lines = doc.splitTextToSize(processArabic(term), pageWidth - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * 5;
  });

  // Barcode
  const barcodeWidth = 50;
  const barcodeHeight = 10;
  const barcodeX = (pageWidth - barcodeWidth) / 2;
  const barcodeY = pageHeight - margin - 35;
  drawBarcode(doc, data.saleId, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
  doc.setFontSize(7);
  doc.text(`Agreement ID: ${data.saleId}`, pageWidth / 2, barcodeY + barcodeHeight + 4, { align: 'center' });

  // Signatures
  y = 250;
  doc.setFontSize(10);
  doc.text('Seller Signature / توقيع البائع', margin, y);
  doc.text('Buyer Signature / توقيع المشتري', pageWidth - margin, y, { align: 'right' });
  y += 15;
  doc.line(margin, y, margin + 40, y);
  doc.line(pageWidth - margin - 40, y, pageWidth - margin, y);

  const fileName = `agreement-${data.saleId}.pdf`;
  const filePath = path.join(uploadsDir, fileName);
  const pdfBuffer = doc.output('arraybuffer');
  fs.writeFileSync(filePath, Buffer.from(pdfBuffer));

  return `/uploads/agreements/${fileName}`;
}

export async function generateRentalAgreement(data: RentalData): Promise<string> {
  const doc = await setupDoc();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setTextColor(40, 170, 169);
  doc.setFont('Cairo', 'bold');
  doc.text('CAR RENTAL AGREEMENT', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(14);
  doc.text(processArabic('عقد تأجير سيارة'), pageWidth / 2, y, { align: 'center' });

  y += 15;
  doc.setFontSize(10);
  doc.setTextColor(51, 51, 51);
  doc.text(`Date: ${new Date(data.date).toLocaleDateString('en-SA')}`, margin, y);
  doc.text(`Rental No: ${data.saleId}`, pageWidth - margin, y, { align: 'right' });

  y += 10;
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // Parties
  y += 10;
  doc.setFont('Cairo', 'bold');
  doc.text('Parties / الأطراف', margin, y);
  y += 6;
  doc.setFont('Cairo', 'normal');
  doc.text(`Lessor: AMYAL CAR RENTAL`, margin, y);
  y += 5;
  doc.text(`Lessee: ${processArabic(data.customerName)}`, margin, y);
  y += 5;
  doc.text(`Phone: ${data.customerPhone}`, margin, y);

  // Vehicle
  y += 12;
  doc.setFont('Cairo', 'bold');
  doc.text('Vehicle Details / بيانات المركبة', margin, y);
  y += 6;
  doc.setFont('Cairo', 'normal');
  doc.text(`Vehicle: ${processArabic(data.carBrand + ' ' + data.carModel)} (${data.carYear})`, margin, y);
  y += 5;
  doc.text(`Plate No: ${data.carPlate}`, margin, y);
  doc.text(`VIN (Chassis): ${data.carVin}`, pageWidth - margin, y, { align: 'right' });
  
  if (data.carEngineNumber || data.carSequenceNumber) {
    y += 5;
    if (data.carEngineNumber) {
      doc.text(`Engine No: ${data.carEngineNumber}`, margin, y);
    }
    if (data.carSequenceNumber) {
      doc.text(`Sequence No: ${data.carSequenceNumber}`, pageWidth - margin, y, { align: 'right' });
    }
  }

  if (data.carColor) {
    y += 5;
    doc.text(`Color: ${processArabic(data.carColor)}`, margin, y);
  }

  // Rental Details
  y += 12;
  doc.setFont('Cairo', 'bold');
  doc.text('Rental Details / تفاصيل التأجير', margin, y);
  y += 6;
  doc.setFont('Cairo', 'normal');
  doc.text(`Period: ${new Date(data.startDate).toLocaleDateString('en-SA')} to ${new Date(data.endDate).toLocaleDateString('en-SA')}`, margin, y);
  y += 5;
  doc.text(`Daily Rate: SAR ${data.dailyRate.toLocaleString()}`, margin, y);
  doc.text(`Security Deposit: SAR ${data.securityDeposit.toLocaleString()}`, pageWidth - margin, y, { align: 'right' });
  y += 5;
  doc.text(`Total Amount: SAR ${data.totalAmount.toLocaleString()}`, margin, y);

  // Terms
  y += 15;
  doc.setFont('Cairo', 'bold');
  doc.text('Terms & Conditions / الشروط والأحكام', margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont('Cairo', 'normal');
  const terms = [
    '1. Vehicle must be used legally within Saudi Arabia. / يجب استخدام المركبة بشكل قانوني داخل المملكة.',
    '2. Renter is responsible for fuel and traffic fines. / المستأجر مسؤول عن الوقود والمخالفات المرورية.',
    '3. No subleasing or unauthorized drivers allowed. / لا يسمح بالتأجير من الباطن أو سائق غير مفوض.',
    '4. Late return will result in extra charges. / التأخر في الإعادة سيؤدي لرسوم إضافية.'
  ];
  terms.forEach(term => {
    const lines = doc.splitTextToSize(processArabic(term), pageWidth - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * 5;
  });

  // Barcode
  const barcodeWidth = 50;
  const barcodeHeight = 10;
  const barcodeX = (pageWidth - barcodeWidth) / 2;
  const barcodeY = pageHeight - margin - 35;
  drawBarcode(doc, data.saleId, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
  doc.setFontSize(7);
  doc.text(`Rental ID: ${data.saleId}`, pageWidth / 2, barcodeY + barcodeHeight + 4, { align: 'center' });

  // Signatures
  y = 250;
  doc.setFontSize(10);
  doc.text('Lessor Signature / توقيع المؤجر', margin, y);
  doc.text('Lessee Signature / توقيع المستأجر', pageWidth - margin, y, { align: 'right' });
  y += 15;
  doc.line(margin, y, margin + 40, y);
  doc.line(pageWidth - margin - 40, y, pageWidth - margin, y);

  const fileName = `agreement-${data.saleId}.pdf`;
  const filePath = path.join(uploadsDir, fileName);
  const pdfBuffer = doc.output('arraybuffer');
  fs.writeFileSync(filePath, Buffer.from(pdfBuffer));

  return `/uploads/agreements/${fileName}`;
}
