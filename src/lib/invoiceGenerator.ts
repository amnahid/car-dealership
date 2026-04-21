import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

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
  discountAmount: number;
  finalPrice: number;
  agentName?: string;
  agentCommission?: number;
}

export async function generateInvoice(data: InvoiceData): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'invoices');
  
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

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  doc.setFontSize(24);
  doc.setTextColor(40, 170, 169);
  doc.text('CAR DEALERSHIP', pageWidth / 2, y, { align: 'center' });
  
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);
  doc.text('Car Sales & Rental Management System', pageWidth / 2, y, { align: 'center' });

  y += 15;
  doc.setFontSize(18);
  doc.setTextColor(51, 51, 51);
  doc.text('INVOICE', pageWidth / 2, y, { align: 'center' });

  y += 8;
  doc.setFontSize(10);
  doc.text(`Invoice No: ${data.saleId}`, pageWidth / 2, y, { align: 'center' });

  y += 15;
  doc.setFontSize(10);
  doc.setTextColor(51, 51, 51);
  doc.text(`Date: ${new Date(data.saleDate).toLocaleDateString()}`, margin, y);

  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Details:', margin, y);
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${data.customerName}`, margin, y);
  
  y += 5;
  doc.text(`Phone: ${data.customerPhone}`, margin, y);
  
  if (data.customerAddress) {
    y += 5;
    doc.text(`Address: ${data.customerAddress}`, margin, y);
  }

  y += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle Details:', margin, y);
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Car ID: ${data.carId}`, margin, y);
  
  if (data.carBrand || data.carModel) {
    y += 5;
    doc.text(`Vehicle: ${data.carBrand || ''} ${data.carModel || ''}`.trim(), margin, y);
  }

  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Details:', margin, y);

  y += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', margin, y);
  doc.text('Amount (BDT)', pageWidth - margin - 40, y, { align: 'right' });

  y += 5;
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Sale Price', margin, y);
  doc.text(data.salePrice.toLocaleString(), pageWidth - margin - 40, y, { align: 'right' });

  y += 7;
  doc.text('Discount', margin, y);
  doc.setTextColor(236, 69, 97);
  doc.text(`-${data.discountAmount.toLocaleString()}`, pageWidth - margin - 40, y, { align: 'right' });

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(40, 170, 169);
  doc.text('Total Amount', margin, y);
  doc.text(data.finalPrice.toLocaleString(), pageWidth - margin - 40, y, { align: 'right' });

  y += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);

  if (data.agentName && data.agentCommission) {
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    doc.text(`Agent: ${data.agentName}`, margin, y);
    doc.text(`Commission: ${data.agentCommission.toLocaleString()}`, pageWidth - margin - 40, y, { align: 'right' });
  }

  y += 30;
  doc.setFontSize(8);
  doc.setTextColor(136, 136, 136);
  doc.text('Thank you for your business!', pageWidth / 2, y, { align: 'center' });
  
  y += 5;
  doc.text('This is a computer generated invoice.', pageWidth / 2, y, { align: 'center' });

  const pdfBuffer = doc.output('arraybuffer');
  fs.writeFileSync(filePath, Buffer.from(pdfBuffer));

  return `/invoices/${fileName}`;
}