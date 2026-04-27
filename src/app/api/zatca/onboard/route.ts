import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ZatcaConfig from '@/models/ZatcaConfig';
import { getAuthPayload } from '@/lib/apiAuth';
import { generateZatcaXML, getZatcaTimestamp } from '@/lib/zatca/xmlGenerator';
import { hashInvoiceXML, generateInvoiceUUID } from '@/lib/zatca/invoiceHash';
import { embedSignatureInXML, parseCertificate } from '@/lib/zatca/cryptoSigning';
import { buildTLVBase64, buildTLVBase64Phase2 } from '@/lib/zatca/qrCode';
import { ZATCA_INITIAL_PIH } from '@/lib/zatca/types';
import { generateZatcaKeyPair, ZatcaCsrOptions, getOpensslCsrConfig } from '@/lib/zatca/onboarding';
import { requestComplianceCsid, checkInvoiceCompliance, requestProductionCsid } from '@/lib/zatca/zatcaApi';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

    if (action === 'generate_keys') {
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

    if (action === 'generate_csr') {
      if (!config.privateKey) {
        return NextResponse.json({ error: 'No private key found. Run Step 1 first.' }, { status: 400 });
      }
      const csrB64 = generateCsr({
        privateKey: config.privateKey!,
        sellerName: config.sellerName,
        trn: config.trn,
        address: config.address,
        environment: config.environment,
      });
      return NextResponse.json({
        message: 'CSR generated successfully.',
        csrB64,
      });
    }

    if (action === 'auto_onboard') {
      const { otp } = body;
      if (!otp) return NextResponse.json({ error: 'OTP is required' }, { status: 400 });

      const { privateKey, publicKey } = generateZatcaKeyPair({
        commonName: config.sellerName,
        organizationName: config.sellerName,
        organizationUnit: config.trn,
        countryCode: 'SA',
        trn: config.trn,
        invoiceType: '1100',
        address: `${config.address?.streetName ?? ''}, ${config.address?.city ?? ''}`,
        businessCategory: 'Motor Vehicle Dealers',
        environment: config.environment,
      });
      await ZatcaConfig.updateOne({ _id: config._id }, { $set: { privateKey, publicKey } });

      const csrB64 = generateCsr({
        privateKey,
        sellerName: config.sellerName,
        trn: config.trn,
        address: config.address,
        environment: config.environment,
      });

      const result = await requestComplianceCsid(csrB64, config.environment, otp);
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
        message: 'Auto-onboarding complete.',
        requestId: result.requestId,
        csid: result.csid,
        dispositionMessage: result.dispositionMessage,
      });
    }

    if (action === 'request_compliance_csid') {
      const { csr, otp } = body;
      if (!csr || !otp) return NextResponse.json({ error: 'CSR and OTP required' }, { status: 400 });

      const result = await requestComplianceCsid(csr, config.environment, otp);

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
        dispositionMessage: result.dispositionMessage,
      });
    }

    if (action === 'compliance_check') {
      if (!config.complianceCsid || !config.privateKey || !config.certificate) {
        return NextResponse.json({ error: 'Configuration incomplete — run onboarding first.' }, { status: 400 });
      }

      const uuid = generateInvoiceUUID();
      const now = new Date();
      const issueTimestamp = getZatcaTimestamp(now);
      
      const qrData = {
        sellerName: config.sellerNameAr || config.sellerName,
        sellerTrn: config.trn,
        issueTimestamp,
        totalWithVat: '115.00',
        vatTotal: '15.00',
      };

      // Step 1: generate XML with basic 5-tag QR placeholder
      const tlvBasic = buildTLVBase64(qrData);
      const rawXml = generateZatcaXML({
        uuid,
        invoiceNumber: 'INV-14',
        invoiceType: 'Simplified',
        issueDate: now,
        seller: {
          name: config.sellerName,
          nameAr: config.sellerNameAr || config.sellerName,
          trn: config.trn,
          buildingNumber: config.address?.buildingNumber || '1234',
          streetName: config.address?.streetName || 'Street',
          district: config.address?.district || 'District',
          city: config.address?.city || 'Riyadh',
          postalCode: config.address?.postalCode || '12345',
          countryCode: 'SA',
        },
        buyer: { name: 'Test Buyer' },
        lineItems: [{
          name: 'Test Item',
          quantity: 1,
          unitPrice: 100,
          vatRate: 15,
          vatAmount: 15,
          totalAmount: 115,
        }],
        subtotal: 100,
        vatTotal: 15,
        totalWithVat: 115,
        currency: 'SAR',
        pih: ZATCA_INITIAL_PIH,
      }, tlvBasic);

      // Step 2: compute hash
      const xmlHash = hashInvoiceXML(rawXml);

      // Step 3: Embed signature and get raw signature bytes for QR
      const { signedXml: xmlWithoutFinalQR, signatureValueRaw } = embedSignatureInXML(
        rawXml,
        config.privateKey,
        config.certificate,
        xmlHash
      );

      // Step 4: build Phase 2 QR (tags 1-9)
      const certInfo = parseCertificate(config.certificate);
      const tlvFull = buildTLVBase64Phase2({
        ...qrData,
        xmlHashBytes: Buffer.from(xmlHash, 'base64'),
        ecdsaSigBytes: signatureValueRaw,
        publicKeyBytes: certInfo.publicKeyRaw,
        certSignatureBytes: certInfo.certSignatureRaw,
      });

      // Step 5: replace QR placeholder with full Phase 2 QR
      const xml = xmlWithoutFinalQR.replace(
        /(<cbc:ID>QR<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>)[^<]*(<\/cbc:EmbeddedDocumentBinaryObject>)/,
        `$1${tlvFull}$2`
      );

      let result: unknown;
      try {
        result = await checkInvoiceCompliance(xml, xmlHash, uuid, {
          csid: config.complianceCsid || '',
          csidSecret: config.complianceCsidSecret || '',
          environment: config.environment,
        });
      } catch (err) {
        return NextResponse.json({
          message: 'Compliance check failed.',
          error: err instanceof Error ? err.message : String(err),
          debug: { submittedHash: xmlHash },
        });
      }

      return NextResponse.json({
        message: 'Compliance check completed.',
        result,
        debug: { submittedHash: xmlHash },
      });
    }

    if (action === 'request_production_csid') {
      const { complianceRequestId } = body;
      if (!complianceRequestId) return NextResponse.json({ error: 'complianceRequestId required' }, { status: 400 });

      const result = await requestProductionCsid(
        config.complianceCsid!,
        config.complianceCsidSecret!,
        complianceRequestId,
        config.environment
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
        message: 'Production CSID obtained.',
        csid: result.csid,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('ZATCA onboarding error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type CsrConfig = { privateKey: string; sellerName: string; trn: string; address: { streetName: string; city: string }; environment: 'sandbox' | 'production' };

function generateCsr(config: CsrConfig): string {
  const tmpDir = os.tmpdir();
  const ts = Date.now();
  const keyPath = path.join(tmpDir, `zatca_key_${ts}.pem`);
  const confPath = path.join(tmpDir, `zatca_csr_${ts}.conf`);
  const csrPath = path.join(tmpDir, `zatca_csr_${ts}.pem`);
  try {
    fs.writeFileSync(keyPath, config.privateKey, { mode: 0o600 });
    const csrConfig = getOpensslCsrConfig({
      commonName: config.sellerName,
      organizationName: config.sellerName,
      organizationUnit: config.trn,
      countryCode: 'SA',
      trn: config.trn,
      invoiceType: '1100',
      address: `${config.address?.streetName ?? ''}, ${config.address?.city ?? ''}`,
      businessCategory: 'Motor Vehicle Dealers',
      environment: config.environment,
    });
    fs.writeFileSync(confPath, csrConfig);
    execSync(`openssl req -new -key "${keyPath}" -out "${csrPath}" -config "${confPath}" -extensions req_ext`, { encoding: 'utf8' });
    return execSync(`base64 -w 0 "${csrPath}"`, { encoding: 'utf8' }).trim();
  } finally {
    [keyPath, confPath, csrPath].forEach(f => { try { fs.unlinkSync(f); } catch { /* ignore */ } });
  }
}
