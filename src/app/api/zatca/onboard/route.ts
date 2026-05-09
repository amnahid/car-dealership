import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ZatcaConfig from '@/models/ZatcaConfig';
import { getAuthPayload } from '@/lib/apiAuth';
import { ZatcaClient } from '@/lib/zatca/zatcaClient';
import { ZATCA_INITIAL_PIH } from '@/lib/zatca/types';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthPayload(request);
    if (!user || !user.normalizedRoles.includes('Admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const config = await ZatcaConfig.findOne({ isActive: true });
    if (!config) {
      return NextResponse.json({ error: 'ZATCA config not found. Create config first.' }, { status: 400 });
    }

    const client = new ZatcaClient(config);

    if (action === 'generate_keys' || action === 'generate_csr') {
      const { privateKey, csr } = await client.generateKeysAndCSR('Amyal');

      await ZatcaConfig.updateOne(
        { _id: config._id },
        { $set: { privateKey, csr } }
      );

      return NextResponse.json({
        message: 'Keys and CSR generated successfully.',
        privateKey,
        csrB64: Buffer.from(csr).toString('base64'),
      });
    }

    if (action === 'auto_onboard') {
      const { otp } = body;
      if (!otp) return NextResponse.json({ error: 'OTP is required' }, { status: 400 });

      // Always generate a fresh CSR for auto_onboard to ensure it matches the current request
      const { privateKey, csr } = await client.generateKeysAndCSR('Amyal');
      
      // Update config with fresh private key and CSR
      await ZatcaConfig.updateOne({ _id: config._id }, { $set: { privateKey, csr } });

      // Request Compliance CSID (using the same instance that has the NEW CSR in memory)
      const requestId = await client.issueComplianceCertificate(otp);
      const info = client.getEgsInfo();

      await ZatcaConfig.updateOne(
        { _id: config._id },
        {
          $set: {
            complianceCsid: info.compliance_certificate,
            complianceCsidSecret: info.compliance_api_secret,
            certificate: info.compliance_certificate,
          },
        }
      );

      return NextResponse.json({
        message: 'Auto-onboarding complete.',
        requestId,
        csid: info.compliance_certificate,
      });
    }

    if (action === 'request_compliance_csid') {
      const { otp } = body;
      if (!otp) return NextResponse.json({ error: 'OTP required' }, { status: 400 });

      if (!config.csr) {
          return NextResponse.json({ error: 'CSR not found. Generate keys/CSR first.' }, { status: 400 });
      }

      const requestId = await client.issueComplianceCertificate(otp);
      const info = client.getEgsInfo();

      await ZatcaConfig.updateOne(
        { _id: config._id },
        {
          $set: {
            complianceCsid: info.compliance_certificate,
            complianceCsidSecret: info.compliance_api_secret,
            certificate: info.compliance_certificate,
          },
        }
      );

      return NextResponse.json({
        message: 'Compliance CSID obtained.',
        requestId,
        csid: info.compliance_certificate,
      });
    }

    if (action === 'compliance_check') {
      if (!config.complianceCsid || !config.privateKey || !config.certificate) {
        return NextResponse.json({ error: 'Configuration incomplete — run onboarding first.' }, { status: 400 });
      }

      const { ZATCAInvoiceTypes } = await import('zatca-xml-ts');
      
      const commonData: any = {
        issueDate: new Date(),
        pih: ZATCA_INITIAL_PIH,
        buyer: {
          name: 'Test Buyer',
          streetName: 'Test Street',
          buildingNumber: '1234',
          city: 'Riyadh',
          district: 'Test District',
          postalCode: '12345',
          otherId: { id: '1010000001', type: 'CRN' }
        },
        lineItems: [{
            name: 'Test Item',
            quantity: 1,
            unitPrice: 100,
            vatRate: 15,
            vatAmount: 15,
            totalAmount: 115
        }]
      };

      // ZATCA required compliance steps
      const steps = [
          { name: 'Simplified Invoice', type: ZATCAInvoiceTypes.INVOICE, isStandard: false },
          { name: 'Simplified Credit Note', type: ZATCAInvoiceTypes.CREDIT_NOTE, isStandard: false },
          { name: 'Simplified Debit Note', type: ZATCAInvoiceTypes.DEBIT_NOTE, isStandard: false },
          { name: 'Standard Invoice', type: ZATCAInvoiceTypes.INVOICE, isStandard: true },
          { name: 'Standard Credit Note', type: ZATCAInvoiceTypes.CREDIT_NOTE, isStandard: true },
          { name: 'Standard Debit Note', type: ZATCAInvoiceTypes.DEBIT_NOTE, isStandard: true },
      ];

      const results = [];
      for (const step of steps) {
          try {
              const res = await client.checkCompliance(commonData, step.type, step.isStandard);
              results.push({ step: step.name, status: 'Success', result: res });
          } catch (err: any) {
              results.push({ 
                  step: step.name, 
                  status: 'Failed', 
                  error: err.message, 
                  detail: err.response?.data 
              });
          }
      }

      return NextResponse.json({
        message: 'Comprehensive compliance check completed.',
        results
      });
    }

    if (action === 'request_production_csid') {
      const { complianceRequestId } = body;
      if (!complianceRequestId) return NextResponse.json({ error: 'complianceRequestId required' }, { status: 400 });

      // To get a production CSID, we need a CSR with "ZATCA-Code-Signing" instead of "PREZATCA-Code-Signing"
      // We temporarily tell the client we are in production to generate the correct CSR
      (config as any).environment = 'production';
      const productionClient = new ZatcaClient(config);
      
      const { privateKey, csr } = await productionClient.generateKeysAndCSR('Amyal');

      // Update config with the production-ready CSR and Private Key
      // Note: The private key might have changed, and it MUST match the new CSR
      await ZatcaConfig.updateOne(
        { _id: config._id },
        { $set: { privateKey, csr, environment: 'production' } }
      );

      // Now request the production certificate using the compliance credentials
      await productionClient.issueProductionCertificate(complianceRequestId);
      const info = productionClient.getEgsInfo();

      await ZatcaConfig.updateOne(
        { _id: config._id },
        {
          $set: {
            productionCsid: info.production_certificate,
            productionCsidSecret: info.production_api_secret,
            // Also update the main certificate to the production one
            certificate: info.production_certificate,
          },
        }
      );

      return NextResponse.json({
        message: 'Production CSID obtained.',
        csid: info.production_certificate,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('ZATCA onboarding error:', error);
    let status = 500;
    let message = error instanceof Error ? error.message : 'Internal server error';
    const detail = error.response?.data || null;

    if (error.response && error.response.data) {
        console.error('ZATCA API Error Data:', JSON.stringify(error.response.data, null, 2));
        
        // Use ZATCA's status code if available
        if (error.response.status) {
            status = error.response.status;
        }

        // Specifically check for Invalid-OTP to provide a clearer status if not set
        const errors = error.response.data.errors;
        if (Array.isArray(errors) && errors.some((e: any) => e.code === 'Invalid-OTP')) {
            status = 400;
            message = 'Invalid ZATCA OTP. Please generate a new OTP from the Fatoora portal.';
        }
    }

    return NextResponse.json({ error: message, detail }, { status });
  }
}
