import { NextRequest, NextResponse } from 'next/server';
import { connectDB, DatabaseConnectionError } from '@/lib/db';
import ZatcaConfig from '@/models/ZatcaConfig';
import { getAuthPayload } from '@/lib/apiAuth';
import { generateZatcaXML } from '@/lib/zatca/xmlGenerator';
import { hashInvoiceXML, hashInvoiceXMLString, hashInvoiceXMLVariant, getCanonicalForm, stripForHash, stripForHashVariant, generateInvoiceUUID } from '@/lib/zatca/invoiceHash';
import { signInvoiceHash, embedSignatureInXML, parseCertificate } from '@/lib/zatca/cryptoSigning';
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

    if (action === 'generate_csr') {
      if (!config.privateKey) {
        return NextResponse.json(
          { error: 'No private key found. Run Step 1 first.' },
          { status: 400 }
        );
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
        note: 'Use the csrB64 value in Step 2: Request Compliance CSID.',
      });
    }

    if (action === 'auto_onboard') {
      // One-shot: generate keys → CSR → compliance CSID. Only requires OTP.
      const { otp } = body;
      if (!otp) {
        return NextResponse.json(
          { error: 'OTP is required (get it from the ZATCA Fatoora portal → "Onboard new solution unit/device")' },
          { status: 400 }
        );
      }
      if (!config.sellerName || !config.trn) {
        return NextResponse.json(
          { error: 'Company name and TRN are required. Fill in the Config tab first.' },
          { status: 400 }
        );
      }
      if (!config.address?.streetName || !config.address?.city) {
        return NextResponse.json(
          { error: 'Street name and city are required. Fill in the address fields in the Config tab first.' },
          { status: 400 }
        );
      }

      // Step 1: generate EC key pair
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
      await ZatcaConfig.updateOne(
        { _id: config._id },
        { $set: { privateKey, publicKey } }
      );

      // Step 1.5: generate CSR using the fresh private key
      const csrB64 = generateCsr({
        privateKey,
        sellerName: config.sellerName,
        trn: config.trn,
        address: config.address,
        environment: config.environment,
      });

      // Step 2: request compliance CSID
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
        message: 'Auto-onboarding complete. Compliance CSID obtained.',
        requestId: result.requestId,
        csid: result.csid,
      });
    }

    if (action === 'request_compliance_csid') {
      const { csr, otp } = body;
      if (!csr) {
        return NextResponse.json({ error: 'CSR is required' }, { status: 400 });
      }
      if (!otp) {
        return NextResponse.json(
          { error: 'OTP is required (get it from the ZATCA Fatoora portal — "Onboard new solution unit/device")' },
          { status: 400 }
        );
      }

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
      });
    }

    if (action === 'compliance_check') {
      if (!config.complianceCsid || !config.complianceCsidSecret) {
        return NextResponse.json({ error: 'Compliance CSID not yet obtained.' }, { status: 400 });
      }
      if (!config.privateKey || !config.certificate) {
        return NextResponse.json({ error: 'Private key or certificate missing — re-run Auto-Onboard.' }, { status: 400 });
      }

      // Always generate a fresh synthetic invoice so the hash is computed with
      // the current algorithm (stale DB records may have hashes from an older approach).
      const uuid = generateInvoiceUUID();
      const issueTimestamp = new Date().toISOString();
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
        invoiceType: 'Simplified',
        issueDate: new Date(),
        seller: {
          name: config.sellerName,
          nameAr: config.sellerNameAr || config.sellerName,
          trn: config.trn,
          buildingNumber: config.address?.buildingNumber || '1234',
          streetName: config.address?.streetName || 'Test Street',
          district: config.address?.district || 'Test District',
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

      // Step 2: compute hash per ZATCA spec (C14N11, remove entire QR element)
      const c14nHash    = hashInvoiceXML(rawXml);
      const stringHash  = hashInvoiceXMLString(rawXml);
      const variantHash = hashInvoiceXMLVariant(rawXml);
      const canonicalForm = getCanonicalForm(rawXml);
      const strippedForm  = stripForHash(rawXml);
      const variantForm   = stripForHashVariant(rawXml);

      // Primary: C14N hash (spec-compliant — no decl, no xmlns:ext, entire QR element removed)
      const xmlHash = c14nHash;

      // Step 3: sign
      const signature = signInvoiceHash(xmlHash, config.privateKey);

      // Step 4: build Phase 2 QR (tags 1-8 with binary hash, sig, pubkey)
      const certInfo = parseCertificate(config.certificate);
      const tlvFull = buildTLVBase64Phase2({
        ...qrData,
        xmlHashBytes: Buffer.from(xmlHash, 'base64'),
        ecdsaSigBytes: Buffer.from(signature, 'base64'),
        publicKeyBytes: certInfo.publicKeyDer,
      });

      // Step 5: replace QR placeholder in XML with full Phase 2 QR
      const xmlWithQR = rawXml.replace(
        /(<cbc:ID>QR<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>)[^<]*(<\/cbc:EmbeddedDocumentBinaryObject>)/,
        `$1${tlvFull}$2`
      );

      // Step 6: embed signature into UBLExtensions
      const xml = embedSignatureInXML(xmlWithQR, signature, config.certificate, xmlHash);

      let result;
      try {
        result = await checkInvoiceCompliance(xml, xmlHash, uuid, {
          csid: config.complianceCsid,
          csidSecret: config.complianceCsidSecret,
          environment: config.environment,
        });
      } catch (err) {
        // Return full stripped XML so we can see the ENTIRE document being hashed
        return NextResponse.json({
          message: 'Compliance check failed — see debug.',
          error: err instanceof Error ? err.message : String(err),
          debug: {
            submittedHash: xmlHash,
            c14nHash,
            stringHash,
            variantHash,
            strippedFull: strippedForm,
            variantFull: variantForm,
          },
        });
      }

      return NextResponse.json({
        message: 'Compliance check completed.',
        result,
        debug: { submittedHash: xmlHash, c14nHash, stringHash, variantHash },
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
