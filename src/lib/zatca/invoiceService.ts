import { connectDB } from '@/lib/db';
import ZatcaConfig from '@/models/ZatcaConfig';
import ZatcaInvoice from '@/models/ZatcaInvoice';
import { buildTLVBase64, buildTLVBase64Phase2, generateZatcaQRCodeFromTLV, ZatcaQRData } from './qrCode';
import { generateZatcaXML } from './xmlGenerator';
import { hashInvoiceXML, generateInvoiceUUID } from './invoiceHash';
import { signInvoiceHash, embedSignatureInXML, parseCertificate } from './cryptoSigning';
import { clearInvoice, reportInvoice } from './zatcaApi';
import {
  ZatcaInvoiceData,
  ZatcaProcessResult,
  ZatcaInvoiceType,
  ZatcaSellerInfo,
  ZatcaBuyerInfo,
  ZatcaLineItem,
  ZATCA_VAT_RATE,
} from './types';

export type {
  ZatcaInvoiceType,
  ZatcaInvoiceData,
  ZatcaSellerInfo,
  ZatcaBuyerInfo,
  ZatcaLineItem,
};
export { ZATCA_VAT_RATE };

export interface ZatcaSaleInput {
  referenceId: string;
  referenceType: 'CashSale' | 'InstallmentSale' | 'Rental';
  saleId: string;
  invoiceType: ZatcaInvoiceType;
  issueDate: Date;
  buyer: ZatcaBuyerInfo;
  lineItems: ZatcaLineItem[];
  subtotal: number;
  vatTotal: number;
  totalWithVat: number;
  discountAmount?: number;
  notes?: string;
  createdBy: string;
}

/**
 * Main ZATCA invoice processing function.
 * Orchestrates: UUID → XML → hash → QR → sign → submit → update PIH
 */
export async function processZatcaInvoice(input: ZatcaSaleInput): Promise<ZatcaProcessResult> {
  await connectDB();

  const config = await ZatcaConfig.findOne({ isActive: true }).lean();
  if (!config) {
    return {
      uuid: generateInvoiceUUID(),
      qrCode: '',
      xml: '',
      xmlHash: '',
      status: 'Failed',
      errorMessage: 'ZATCA configuration not found. Please configure ZATCA settings.',
      newPih: '',
    };
  }

  const uuid = generateInvoiceUUID();
  const pih = config.pih;

  const seller: ZatcaSellerInfo = {
    name: config.sellerName,
    nameAr: config.sellerNameAr,
    trn: config.trn,
    buildingNumber: config.address.buildingNumber,
    streetName: config.address.streetName,
    district: config.address.district,
    city: config.address.city,
    postalCode: config.address.postalCode,
    countryCode: config.address.countryCode,
  };

  const invoiceData: ZatcaInvoiceData = {
    uuid,
    invoiceType: input.invoiceType,
    issueDate: input.issueDate,
    seller,
    buyer: input.buyer,
    lineItems: input.lineItems,
    subtotal: input.subtotal,
    vatTotal: input.vatTotal,
    totalWithVat: input.totalWithVat,
    discountAmount: input.discountAmount,
    currency: 'SAR',
    pih,
    notes: input.notes,
  };

  try {
    // Phase 1: Build QR TLV data
    const qrData: ZatcaQRData = {
      sellerName: config.sellerNameAr || config.sellerName,
      sellerTrn: config.trn,
      issueTimestamp: input.issueDate.toISOString(),
      totalWithVat: input.totalWithVat.toFixed(2),
      vatTotal: input.vatTotal.toFixed(2),
    };

    let signedXml = '';
    let xmlHash = '';

    // Only auto-submit when the production CSID is available.
    const hasPhase2 = !!(config.productionCsid && config.privateKey);

    // Step 1: generate XML with a basic 5-tag QR placeholder
    const tlvBase64 = buildTLVBase64(qrData);
    const xml = generateZatcaXML(invoiceData, tlvBase64);

    // Step 2: hash with QR value cleared (ZATCA spec)
    xmlHash = hashInvoiceXML(xml);
    signedXml = xml;

    let qrTlvFull = tlvBase64; // will be replaced with 8-tag version when signing

    if (hasPhase2 && config.privateKey && config.certificate) {
      // Step 3: sign
      const signature = signInvoiceHash(xmlHash, config.privateKey);

      // Step 4: build Phase 2 QR with binary tags 6-8
      const certInfo = parseCertificate(config.certificate);
      qrTlvFull = buildTLVBase64Phase2({
        ...qrData,
        xmlHashBytes: Buffer.from(xmlHash, 'base64'),
        ecdsaSigBytes: Buffer.from(signature, 'base64'),
        publicKeyBytes: certInfo.publicKeyRaw,
        certSignatureBytes: certInfo.certSignatureRaw,
      });

      // Step 5: replace placeholder QR in XML with full Phase 2 QR
      const xmlWithQR = xml.replace(
        /(<cbc:ID>QR<\/cbc:ID>[\s\S]*?<cbc:EmbeddedDocumentBinaryObject[^>]*>)[^<]*(<\/cbc:EmbeddedDocumentBinaryObject>)/,
        `$1${qrTlvFull}$2`
      );

      // Step 6: embed signature
      const signingResult = embedSignatureInXML(xmlWithQR, config.privateKey, config.certificate, xmlHash);
      signedXml = signingResult.signedXml;
    }

    // QR data URL for display — use the full Phase 2 TLV when available
    const qrCode = await generateZatcaQRCodeFromTLV(qrTlvFull);
    const newPih = xmlHash;

    // Default status
    let status: ZatcaProcessResult['status'] = 'Pending';
    let zatcaResponse: object | undefined;
    let errorMessage: string | undefined;
    let clearedXml: string | undefined;

    // Phase 2 API submission
    if (hasPhase2) {
      const csid = config.environment === 'production'
        ? config.productionCsid!
        : config.complianceCsid!;
      const csidSecret = config.environment === 'production'
        ? (config.productionCsidSecret || '')
        : (config.complianceCsidSecret || '');

      const credentials = {
        csid,
        csidSecret,
        environment: config.environment,
      };

      try {
        if (input.invoiceType === 'Standard') {
          const result = await clearInvoice(signedXml, xmlHash, uuid, credentials);
          status = 'Cleared';
          zatcaResponse = result.validationResults as object;
          clearedXml = result.clearedInvoice;
        } else {
          const result = await reportInvoice(signedXml, xmlHash, uuid, credentials);
          status = 'Reported';
          zatcaResponse = result as object;
        }

        // Update PIH chain in config
        await ZatcaConfig.updateOne({ _id: config._id }, { $set: { pih: newPih } });
      } catch (apiError) {
        status = 'Failed';
        errorMessage = apiError instanceof Error ? apiError.message : 'ZATCA API error';
      }
    }

    // Save audit record
    await ZatcaInvoice.create({
      uuid,
      invoiceType: input.invoiceType,
      referenceId: input.referenceId,
      referenceType: input.referenceType,
      saleId: input.saleId,
      issueDate: input.issueDate,
      xml: clearedXml || signedXml,
      xmlHash,
      pih,
      qrCode,
      status,
      zatcaResponse,
      errorMessage,
      clearedXml,
      submittedAt: hasPhase2 ? new Date() : undefined,
      createdBy: input.createdBy,
    });

    return {
      uuid,
      qrCode,
      xml: clearedXml || signedXml,
      xmlHash,
      status,
      zatcaResponse,
      errorMessage,
      newPih,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown ZATCA error';
    return {
      uuid,
      qrCode: '',
      xml: '',
      xmlHash: '',
      status: 'Failed',
      errorMessage: errorMsg,
      newPih: pih,
    };
  }
}

/**
 * Calculate VAT amounts for a given price.
 */
export function calculateVat(
  finalPrice: number,
  vatRate: number = ZATCA_VAT_RATE
): { subtotal: number; vatAmount: number; totalWithVat: number } {
  const subtotal = finalPrice;
  const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const totalWithVat = Math.round((subtotal + vatAmount) * 100) / 100;
  return { subtotal, vatAmount, totalWithVat };
}
