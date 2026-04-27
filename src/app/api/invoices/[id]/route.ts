import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import ZatcaInvoice from '@/models/ZatcaInvoice';
import CashSale from '@/models/CashSale';
import InstallmentSale from '@/models/InstallmentSale';
import Rental from '@/models/Rental';
import Customer from '@/models/Customer';
import Car from '@/models/Car';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Admin', 'Sales Person', 'Accountant', 'Finance Manager'].includes(auth.normalizedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const invoice = await ZatcaInvoice.findById(id)
      .populate('createdBy', 'name email')
      .lean();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    let sale = null;
    let customer = null;
    let car = null;

    if (invoice.referenceType === 'CashSale') {
      sale = await CashSale.findOne({ _id: invoice.referenceId }).lean();
      if (sale) {
        customer = await Customer.findOne({ _id: (sale as any).customer }).lean();
        car = await Car.findOne({ _id: (sale as any).car }).lean();
      }
    } else if (invoice.referenceType === 'InstallmentSale') {
      sale = await InstallmentSale.findOne({ _id: invoice.referenceId }).lean();
      if (sale) {
        customer = await Customer.findOne({ _id: (sale as any).customer }).lean();
        car = await Car.findOne({ _id: (sale as any).car }).lean();
      }
    } else if (invoice.referenceType === 'Rental') {
      sale = await Rental.findOne({ _id: invoice.referenceId }).lean();
      if (sale) {
        customer = await Customer.findOne({ _id: (sale as any).customer }).lean();
        car = await Car.findOne({ _id: (sale as any).car }).lean();
      }
    }

    const invoiceUrl = (sale as any)?.invoiceUrl || `/invoices/invoice-${invoice.saleId}.pdf`;

    return NextResponse.json({
      invoice: {
        ...invoice,
        invoiceUrl,
        sale,
        customer,
        car,
      },
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}
