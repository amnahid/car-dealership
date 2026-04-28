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
    if (!user || user.normalizedRole !== 'Admin') {
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

      const result = await client.checkCompliance({
          uuid: crypto.randomUUID(),
          invoiceType: 'Simplified',
          issueDate: new Date(),
          seller: {
              name: config.sellerName,
              nameAr: config.sellerNameAr,
              trn: config.trn,
              buildingNumber: config.address.buildingNumber,
              streetName: config.address.streetName,
              district: config.address.district,
              city: config.address.city,
              postalCode: config.address.postalCode,
              countryCode: 'SA'
          },
          buyer: { name: 'Test Buyer' },
          lineItems: [{
              name: 'Test Item',
              quantity: 1,
              unitPrice: 100,
              vatRate: 15,
              vatAmount: 15,
              totalAmount: 115
          }],
          subtotal: 100,
          vatTotal: 15,
          totalWithVat: 115,
          currency: 'SAR',
          pih: ZATCA_INITIAL_PIH
      });

      return NextResponse.json({
        message: 'Compliance check completed.',
        result
      });
    }

    if (action === 'request_production_csid') {
      const { complianceRequestId } = body;
      if (!complianceRequestId) return NextResponse.json({ error: 'complianceRequestId required' }, { status: 400 });

      await client.issueProductionCertificate(complianceRequestId);
      const info = client.getEgsInfo();

      await ZatcaConfig.updateOne(
        { _id: config._id },
        {
          $set: {
            productionCsid: info.production_certificate,
            productionCsidSecret: info.production_api_secret,
            environment: 'production',
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
    if (error.response && error.response.data) {
        console.error('ZATCA API Error Data:', JSON.stringify(error.response.data, null, 2));
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    const detail = error.response?.data || null;
    return NextResponse.json({ error: message, detail }, { status: 500 });
  }
}
