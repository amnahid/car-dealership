import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import ZatcaInvoice from '@/models/ZatcaInvoice';
import CashSale from '@/models/CashSale';
import InstallmentSale from '@/models/InstallmentSale';
import Rental from '@/models/Rental';
import { getAuthPayload } from '@/lib/apiAuth';
import { clearInvoice, reportInvoice } from '@/lib/zatca/zatcaApi';
import ZatcaConfig from '@/models/ZatcaConfig';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user || user.normalizedRole !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { uuid } = body;

    const config = await ZatcaConfig.findOne({ isActive: true }).lean();
    if (!config) {
      return NextResponse.json({ error: 'ZATCA config not found' }, { status: 400 });
    }

    // Clearance/reporting endpoints require the production CSID.
    // The compliance CSID only works with /compliance/invoices (Step 3 in onboarding).
    if (!config.productionCsid) {
      return NextResponse.json({
        error: 'Production CSID not yet configured. Complete ZATCA onboarding Steps 3 and 4 first, then retry.',
      }, { status: 400 });
    }
    if (!config.privateKey) {
      return NextResponse.json({ error: 'Private key missing from ZATCA config.' }, { status: 400 });
    }

    const csid = config.productionCsid;
    const csidSecret = config.productionCsidSecret || '';

    const credentials = { csid, csidSecret, environment: config.environment };

    // Build query — retry all failed if no UUID, else specific one
    const query = uuid ? { uuid } : { status: 'Failed' };
    const invoices = await ZatcaInvoice.find(query).lean();

    if (invoices.length === 0) {
      return NextResponse.json({ message: 'No failed invoices found.' });
    }

    const results = [];

    for (const invoice of invoices) {
      try {
        let status: string;
        let zatcaResponse;
        let clearedXml: string | undefined;

        if (invoice.invoiceType === 'Standard') {
          const result = await clearInvoice(invoice.xml, invoice.xmlHash, invoice.uuid, credentials);
          status = 'Cleared';
          zatcaResponse = result.validationResults;
          clearedXml = result.clearedInvoice;
        } else {
          const result = await reportInvoice(invoice.xml, invoice.xmlHash, invoice.uuid, credentials);
          status = 'Reported';
          zatcaResponse = result;
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
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
