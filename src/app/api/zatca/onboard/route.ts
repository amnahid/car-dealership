import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import ZatcaConfig from '@/models/ZatcaConfig';
import ZatcaInvoice from '@/models/ZatcaInvoice';
import { getAuthPayload } from '@/lib/apiAuth';
import { generateZatcaKeyPair, ZatcaCsrOptions } from '@/lib/zatca/onboarding';
import { requestComplianceCsid, checkInvoiceCompliance, requestProductionCsid } from '@/lib/zatca/zatcaApi';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const config = await ZatcaConfig.findOne({ isActive: true });
    if (!config) {
      return NextResponse.json({ error: 'ZATCA config not found. Create config first.' }, { status: 400 });
    }

    if (action === 'generate_keys') {
      // Step 1: Generate EC key pair + get openssl command for CSR
      const csrOptions: ZatcaCsrOptions = {
        commonName: config.sellerName,
        organizationName: config.sellerName,
        organizationUnit: 'Main Branch',
        countryCode: 'SA',
        trn: config.trn,
        invoiceType: '1100',
        address: `${config.address.streetName}, ${config.address.city}`,
        businessCategory: 'Motor Vehicle Dealers',
        environment: config.environment,
      };

      const result = generateZatcaKeyPair(csrOptions);

      // Save keys to config (privateKey is sensitive — store securely)
      await ZatcaConfig.updateOne(
        { _id: config._id },
        { $set: { privateKey: result.privateKey, publicKey: result.publicKey } }
      );

      return NextResponse.json({
        message: 'Key pair generated successfully.',
        publicKey: result.publicKey,
        opensslCommand: result.opensslCommand,
        note: 'Use the openssl command above to generate a ZATCA-compliant CSR, then submit it to the ZATCA sandbox portal.',
      });
    }

    if (action === 'request_compliance_csid') {
      // Step 2: Submit CSR to ZATCA and get compliance CSID
      const { csr } = body;
      if (!csr) {
        return NextResponse.json({ error: 'CSR is required' }, { status: 400 });
      }

      const result = await requestComplianceCsid(csr, config.environment);

      await ZatcaConfig.updateOne(
        { _id: config._id },
        {
          $set: {
            complianceCsid: result.csid,
            complianceCsidSecret: result.secret,
            certificate: result.binarySecurityToken,
          },
        }
      );

      return NextResponse.json({
        message: 'Compliance CSID obtained.',
        requestId: result.requestId,
        csid: result.csid,
      });
    }

    if (action === 'compliance_check') {
      // Step 3: Run compliance check with a test invoice
      if (!config.complianceCsid || !config.complianceCsidSecret) {
        return NextResponse.json({ error: 'Compliance CSID not yet obtained.' }, { status: 400 });
      }

      // Find the latest invoice for testing
      const testInvoice = await ZatcaInvoice.findOne().sort({ createdAt: -1 }).lean();
      if (!testInvoice) {
        return NextResponse.json({ error: 'No invoices found for compliance check. Create a test invoice first.' }, { status: 400 });
      }

      const result = await checkInvoiceCompliance(
        testInvoice.xml,
        testInvoice.xmlHash,
        testInvoice.uuid,
        {
          csid: config.complianceCsid,
          csidSecret: config.complianceCsidSecret,
          environment: config.environment,
        }
      );

      return NextResponse.json({
        message: 'Compliance check completed.',
        result,
      });
    }

    if (action === 'request_production_csid') {
      // Step 4: Get production CSID
      if (!config.complianceCsid || !config.complianceCsidSecret) {
        return NextResponse.json({ error: 'Compliance CSID required first.' }, { status: 400 });
      }

      const { complianceRequestId } = body;
      if (!complianceRequestId) {
        return NextResponse.json({ error: 'complianceRequestId is required' }, { status: 400 });
      }

      const result = await requestProductionCsid(
        config.complianceCsid,
        config.complianceCsidSecret,
        complianceRequestId,
        'production'
      );

      await ZatcaConfig.updateOne(
        { _id: config._id },
        {
          $set: {
            productionCsid: result.csid,
            productionCsidSecret: result.secret,
            environment: 'production',
          },
        }
      );

      return NextResponse.json({
        message: 'Production CSID obtained. Environment switched to production.',
        csid: result.csid,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('ZATCA onboarding error:', error);
    if (error instanceof DatabaseConnectionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
