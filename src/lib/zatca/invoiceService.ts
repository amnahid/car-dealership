import { connectDB } from '@/lib/db';
import ZatcaConfig from '@/models/ZatcaConfig';
import ZatcaInvoice from '@/models/ZatcaInvoice';
import { ZatcaClient } from './zatcaClient';
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
  supplyDate: Date;
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

  const config = await ZatcaConfig.findOne({ isActive: true });
  if (!config) {
    return {
      uuid: crypto.randomUUID(),
      qrCode: '',
      xml: '',
      xmlHash: '',
      status: 'Failed',
      errorMessage: 'ZATCA configuration not found. Please configure ZATCA settings.',
      newPih: '',
    };
  }

  const client = new ZatcaClient(config);
  const uuid = crypto.randomUUID();
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
    invoiceNumber: input.saleId,
    invoiceType: input.invoiceType,
    issueDate: input.issueDate,
    supplyDate: input.supplyDate,
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
    let result: ZatcaProcessResult;
    
    // Only auto-submit when the production CSID or compliance CSID is available.
    const canSubmit = !!(config.productionCsid || config.complianceCsid);

    if (canSubmit) {
      result = await client.processInvoice(invoiceData);
      
      // Update PIH chain in config on success
      if (result.status === 'Cleared' || result.status === 'Reported') {
        await ZatcaConfig.updateOne({ _id: config._id }, { $set: { pih: result.xmlHash } });
      }
    } else {
        // Fallback for when we don't have CSIDs yet - just for debug or testing
        // This won't be fully signed correctly without certificate, but we want to avoid crashing
        throw new Error('ZATCA CSID not found. Complete onboarding first.');
    }

    // Save audit record
    await ZatcaInvoice.create({
      uuid: result.uuid,
      invoiceType: input.invoiceType,
      referenceId: input.referenceId,
      referenceType: input.referenceType,
      saleId: input.saleId,
      issueDate: input.issueDate,
      xml: result.xml,
      xmlHash: result.xmlHash,
      pih,
      qrCode: result.qrCode,
      status: result.status,
      zatcaResponse: result.zatcaResponse,
      errorMessage: result.errorMessage,
      clearedXml: result.clearedXml,
      submittedAt: new Date(),
      createdBy: input.createdBy,
    });

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown ZATCA error';
    
    // Create a failed record
    const failedResult: ZatcaProcessResult = {
      uuid,
      qrCode: 'N/A',
      xml: 'N/A',
      xmlHash: 'N/A',
      status: 'Failed',
      errorMessage: errorMsg,
      newPih: pih || '0',
    };

    try {
      await ZatcaInvoice.create({
        uuid,
        invoiceType: input.invoiceType,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
        saleId: input.saleId,
        issueDate: input.issueDate,
        xml: 'N/A',
        xmlHash: 'N/A',
        pih: pih || '0', // fallback to prevent validation errors if pih is undefined
        qrCode: 'N/A',
        status: 'Failed',
        errorMessage: errorMsg,
        createdBy: input.createdBy,
      });
    } catch (auditError) {
      console.error('Failed to create ZatcaInvoice audit record:', auditError);
    }

    return failedResult;
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
