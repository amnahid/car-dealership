import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import InstallmentSale from '@/models/InstallmentSale';
import Car from '@/models/Car';
import Customer from '@/models/Customer';
import Transaction from '@/models/Transaction';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import { processZatcaInvoice, calculateVat, ZATCA_VAT_RATE } from '@/lib/zatca/invoiceService';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const sale = await InstallmentSale.findById(id).lean();
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json({ sale });
  } catch (error) {
    console.error('Get installment sale error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid sale ID' }, { status: 400 });
    }

    const sale = await InstallmentSale.findById(id);
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    if (sale.status === 'Cancelled') {
      return NextResponse.json({ error: 'Cannot update cancelled sale' }, { status: 400 });
    }

    const body = await request.json();
    const { downPayment, monthlyPayment, interestRate, tenureMonths, notes, invoiceType, buyerTrn, agentName, agentCommission } = body;

    if (downPayment !== undefined) sale.downPayment = downPayment;
    if (monthlyPayment !== undefined) sale.monthlyPayment = monthlyPayment;
    if (interestRate !== undefined) sale.interestRate = interestRate;
    if (tenureMonths !== undefined) sale.tenureMonths = tenureMonths;
    if (notes !== undefined) sale.notes = notes;
    if (agentName !== undefined) (sale as any).agentName = agentName;
    if (agentCommission !== undefined) (sale as any).agentCommission = agentCommission;

    const zatcaFieldChanged = invoiceType !== undefined || buyerTrn !== undefined;
    if (invoiceType !== undefined) sale.invoiceType = invoiceType;
    if (buyerTrn !== undefined) (sale as any).buyerTrn = buyerTrn;

    await sale.save();

    // Re-run ZATCA if invoiceType or buyerTrn changed
    if (zatcaFieldChanged) {
      try {
        const [customerDoc, carDoc] = await Promise.all([
          Customer.findById(sale.customer).lean(),
          Car.findById(sale.car).lean(),
        ]);
        const vatInfo = calculateVat(sale.totalPrice, ZATCA_VAT_RATE);
        const zatcaResult = await processZatcaInvoice({
          referenceId: sale._id.toString(),
          referenceType: 'InstallmentSale',
          saleId: sale.saleId,
          invoiceType: (sale.invoiceType as 'Standard' | 'Simplified') || 'Simplified',
          issueDate: new Date(sale.startDate),
          buyer: {
            name: sale.customerName,
            trn: (sale as any).buyerTrn || '',
            address: customerDoc?.address,
            city: '',
          },
          lineItems: [{
            name: carDoc ? `${carDoc.brand} ${carDoc.model} (${sale.carId})`.trim() : sale.carId,
            quantity: 1,
            unitPrice: vatInfo.subtotal,
            vatRate: ZATCA_VAT_RATE,
            vatAmount: vatInfo.vatAmount,
            totalAmount: vatInfo.totalWithVat,
          }],
          subtotal: vatInfo.subtotal,
          vatTotal: vatInfo.vatAmount,
          totalWithVat: vatInfo.totalWithVat,
          notes: sale.notes,
          createdBy: user.userId,
        });
        await InstallmentSale.findByIdAndUpdate(sale._id, {
          zatcaUUID: zatcaResult.uuid,
          zatcaQRCode: zatcaResult.qrCode,
          zatcaHash: zatcaResult.xmlHash,
          zatcaStatus: zatcaResult.status,
          zatcaResponse: zatcaResult.zatcaResponse,
          vatAmount: vatInfo.vatAmount,
          finalPriceWithVat: vatInfo.totalWithVat,
        });
      } catch (zatcaError) {
        console.error('ZATCA reprocessing failed:', zatcaError);
      }
    }

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Updated installment sale: ${sale.saleId}`,
      module: 'Sales',
      targetId: sale._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ sale });
  } catch (error) {
    console.error('Update installment sale error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthPayload(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid sale ID' }, { status: 400 });
    }

    const sale = await InstallmentSale.findById(id);
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    if (sale.status === 'Cancelled') {
      return NextResponse.json({ error: 'Sale already cancelled' }, { status: 400 });
    }

    // Soft delete - mark as cancelled
    sale.status = 'Cancelled';
    await Promise.all([
      sale.save(),
      Car.findByIdAndUpdate(sale.car, { status: 'In Stock' }),
      Transaction.updateMany(
        { referenceId: sale._id.toString(), referenceType: 'InstallmentSale', isAutoGenerated: true },
        { isDeleted: true }
      ),
    ]);

    await logActivity({
      userId: user.userId,
      userName: user.name,
      action: `Cancelled installment sale: ${sale.saleId}`,
      module: 'Sales',
      targetId: sale._id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ message: 'Sale cancelled successfully' });
  } catch (error) {
    console.error('Delete installment sale error:', error);

    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}