import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import ZatcaInvoice from '@/models/ZatcaInvoice';
import CashSale from '@/models/CashSale';
import InstallmentSale from '@/models/InstallmentSale';
import Rental from '@/models/Rental';
import { getAuthPayload } from '@/lib/apiAuth';
import { ZatcaClient } from '@/lib/zatca/zatcaClient';
import ZatcaConfig from '@/models/ZatcaConfig';
import { processZatcaInvoice, ZATCA_VAT_RATE } from '@/lib/zatca/invoiceService';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user || (user.normalizedRole !== 'Admin' && user.normalizedRole !== 'Finance Manager' && user.normalizedRole !== 'Accountant')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { uuid, referenceId, referenceType } = body;

    // 1. If referenceId (saleId or _id) and referenceType are provided, do a FULL REGENERATE
    if (referenceId && referenceType) {
      let sale: any = null;
      const isObjectId = mongoose.Types.ObjectId.isValid(referenceId);
      const query = isObjectId ? { _id: referenceId } : { saleId: referenceId };

      if (referenceType === 'CashSale') {
        sale = await CashSale.findOne(query).populate('car').populate('customer');
      } else if (referenceType === 'InstallmentSale') {
        sale = await InstallmentSale.findOne(query).populate('car').populate('customer');
      } else if (referenceType === 'Rental') {
        sale = await Rental.findOne(query).populate('car').populate('customer');
      }

      if (!sale) {
        return NextResponse.json({ error: `Sale ${referenceId} not found` }, { status: 404 });
      }

      const carData = sale.car as any;
      const customerData = sale.customer as any;

      // Prepare items and prices based on sale type
      let subtotal = 0;
      let vatAmount = 0;
      let totalWithVat = 0;
      let discountAmount = 0;
      let lineItems: any[] = [];

      if (referenceType === 'CashSale') {
        subtotal = sale.finalPrice;
        vatAmount = sale.vatAmount;
        totalWithVat = sale.finalPriceWithVat;
        discountAmount = sale.discountAmount;
        lineItems = [{
          name: `${carData?.brand || ''} ${carData?.carModel || carData?.model || ''} (${sale.carId})`.trim(),
          quantity: 1,
          unitPrice: subtotal,
          vatRate: ZATCA_VAT_RATE,
          vatAmount: vatAmount,
          totalAmount: totalWithVat,
        }];
      } else if (referenceType === 'InstallmentSale') {
        subtotal = sale.totalPrice;
        vatAmount = sale.vatAmount;
        totalWithVat = sale.finalPriceWithVat;
        lineItems = [{
          name: `${carData?.brand || ''} ${carData?.carModel || carData?.model || ''} (${sale.carId})`.trim(),
          quantity: 1,
          unitPrice: subtotal,
          vatRate: ZATCA_VAT_RATE,
          vatAmount: vatAmount,
          totalAmount: totalWithVat,
        }];
      } else if (referenceType === 'Rental') {
        subtotal = sale.totalAmount;
        vatAmount = sale.vatAmount;
        totalWithVat = sale.finalPriceWithVat;
        lineItems = [{
          name: `Rental: ${carData?.brand || ''} ${carData?.carModel || carData?.model || ''} (${sale.carId})`.trim(),
          quantity: 1,
          unitPrice: subtotal,
          vatRate: ZATCA_VAT_RATE,
          vatAmount: vatAmount,
          totalAmount: totalWithVat,
        }];
      }

      const zatcaResult = await processZatcaInvoice({
        referenceId: sale._id.toString(),
        referenceType: referenceType as any,
        saleId: sale.saleId || sale.rentalId,
        invoiceType: sale.invoiceType || 'Simplified',
        issueDate: sale.saleDate || sale.startDate || new Date(),
        supplyDate: sale.saleDate || sale.startDate || new Date(),
        buyer: {
          name: sale.customerName,
          trn: sale.buyerTrn,
          buildingNumber: customerData?.buildingNumber,
          streetName: customerData?.streetName,
          district: customerData?.district,
          city: customerData?.city,
          postalCode: customerData?.postalCode,
          countryCode: customerData?.countryCode || 'SA',
          otherId: customerData?.otherId ? {
            id: customerData.otherId,
            type: customerData.otherIdType || 'CRN'
          } : undefined
        },
        lineItems,
        subtotal,
        vatTotal: vatAmount,
        totalWithVat,
        discountAmount,
        notes: sale.notes,
        createdBy: user.userId,
      });

      // Update the sale record
      const updateData = {
        zatcaUUID: zatcaResult.uuid,
        zatcaQRCode: zatcaResult.qrCode,
        zatcaStatus: zatcaResult.status as any,
        zatcaHash: zatcaResult.xmlHash,
        zatcaResponse: zatcaResult.zatcaResponse,
        zatcaErrorMessage: zatcaResult.errorMessage,
      };

      if (referenceType === 'CashSale') {
        await CashSale.updateOne({ _id: sale._id }, { $set: updateData });
      } else if (referenceType === 'InstallmentSale') {
        await InstallmentSale.updateOne({ _id: sale._id }, { $set: updateData });
      } else if (referenceType === 'Rental') {
        await Rental.updateOne({ _id: sale._id }, { $set: updateData });
      }

      return NextResponse.json({ results: [{ uuid: zatcaResult.uuid, status: zatcaResult.status, success: zatcaResult.status !== 'Failed', error: zatcaResult.errorMessage }] });
    }

    // 2. Fallback to existing UUID-based retry for previously generated XML
    const config = await ZatcaConfig.findOne({ isActive: true });
    if (!config) {
      return NextResponse.json({ error: 'ZATCA config not found' }, { status: 400 });
    }

    const client = new ZatcaClient(config);

    // Build query — retry all failed if no UUID, else specific one
    const query = uuid ? { uuid } : { status: 'Failed' };
    const invoices = await ZatcaInvoice.find(query);

    if (invoices.length === 0) {
      return NextResponse.json({ message: 'No failed invoices found.' });
    }

    const results = [];

    for (const invoice of invoices) {
      try {
        if (!invoice.xml || invoice.xml.length < 10) {
            throw new Error('Invoice XML missing or empty. Please retry from the specific sale page to regenerate.');
        }

        let status: string;
        let zatcaResponse;
        let clearedXml: string | undefined;

        if (invoice.invoiceType === 'Standard') {
          zatcaResponse = await client.clearanceExistingInvoice(invoice.xml, invoice.xmlHash);
          status = 'Cleared';
          if (zatcaResponse && typeof zatcaResponse === 'object' && 'clearedInvoice' in zatcaResponse) {
            clearedXml = Buffer.from(zatcaResponse.clearedInvoice as string, 'base64').toString('utf8');
          }
        } else {
          zatcaResponse = await client.reportExistingInvoice(invoice.xml, invoice.xmlHash);
          status = 'Reported';
        }

        // Update ZatcaInvoice record
        await ZatcaInvoice.updateOne(
          { _id: invoice._id },
          {
            $set: {
              status,
              zatcaResponse,
              clearedXml,
              errorMessage: undefined,
              submittedAt: new Date(),
            },
          }
        );

        // Update the source sale record — clear any previous error on success
        const statusUpdate = {
          zatcaStatus: status,
          zatcaResponse,
          zatcaErrorMessage: undefined,
        };

        if (invoice.referenceType === 'CashSale') {
          await CashSale.updateOne({ _id: invoice.referenceId }, { $set: statusUpdate });
        } else if (invoice.referenceType === 'InstallmentSale') {
          await InstallmentSale.updateOne({ _id: invoice.referenceId }, { $set: statusUpdate });
        } else if (invoice.referenceType === 'Rental') {
          await Rental.updateOne({ _id: invoice.referenceId }, { $set: statusUpdate });
        }

        results.push({ uuid: invoice.uuid, status, success: true });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        await ZatcaInvoice.updateOne(
          { _id: invoice._id },
          { $set: { errorMessage } }
        );
        // Write error back to the sale so it surfaces in the detail page
        const failUpdate = { zatcaStatus: 'Failed', zatcaErrorMessage: errorMessage };
        if (invoice.referenceType === 'CashSale') {
          await CashSale.updateOne({ _id: invoice.referenceId }, { $set: failUpdate });
        } else if (invoice.referenceType === 'InstallmentSale') {
          await InstallmentSale.updateOne({ _id: invoice.referenceId }, { $set: failUpdate });
        } else if (invoice.referenceType === 'Rental') {
          await Rental.updateOne({ _id: invoice.referenceId }, { $set: failUpdate });
        }
        results.push({ uuid: invoice.uuid, status: 'Failed', success: false, error: errorMessage });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('ZATCA retry error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
