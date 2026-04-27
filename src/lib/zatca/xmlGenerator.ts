import { create } from 'xmlbuilder2';
import { ZatcaInvoiceData } from './types';

/**
 * Generate ZATCA-compliant UBL 2.1 XML invoice.
 */
export function generateZatcaXML(data: ZatcaInvoiceData, tlvBase64: string): string {
  const isSimplified = data.invoiceType === 'Simplified';
  const invoiceSubtype = isSimplified ? '0200000' : '0100000';
  const issueDateStr = formatDate(data.issueDate);
  const issueTimeStr = formatTime(data.issueDate);

  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Invoice', {
      'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
      'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      'xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
    });

  // 1. UBL Extensions placeholder
  root.ele('ext:UBLExtensions')
    .ele('ext:UBLExtension')
      .ele('ext:ExtensionURI').txt('urn:oasis:names:specification:ubl:dsig:enveloped:xades').up()
      .ele('ext:ExtensionContent')
        .ele('sig:UBLDocumentSignatures', {
          'xmlns:sig': 'urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2',
          'xmlns:sac': 'urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2',
          'xmlns:sbc': 'urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2',
        })
          .ele('sac:SignatureInformation')
            .ele('cbc:ID').txt('urn:oasis:names:specification:ubl:signature:1').up()
            .ele('sbc:ReferencedSignatureID').txt('urn:oasis:names:specification:ubl:signature:Invoice').up()
          .up()
        .up()
      .up()
    .up()
  .up();

  // 2-9. Basic Info
  root.ele('cbc:ProfileID').txt('reporting:1.0').up();
  root.ele('cbc:ID').txt(data.invoiceNumber || 'INV-1').up();
  root.ele('cbc:UUID').txt(data.uuid).up();
  root.ele('cbc:IssueDate').txt(issueDateStr).up();
  root.ele('cbc:IssueTime').txt(issueTimeStr).up();
  root.ele('cbc:InvoiceTypeCode', { name: invoiceSubtype }).txt('388').up();
  
  if (data.notes) {
    root.ele('cbc:Note').txt(data.notes).up();
  }

  root.ele('cbc:DocumentCurrencyCode').txt(data.currency).up();
  root.ele('cbc:TaxCurrencyCode').txt('SAR').up();

  // 10. Additional Document References
  root.ele('cac:AdditionalDocumentReference')
    .ele('cbc:ID').txt('ICV').up()
    .ele('cbc:UUID').txt('1').up()
  .up();

  root.ele('cac:AdditionalDocumentReference')
    .ele('cbc:ID').txt('PIH').up()
    .ele('cac:Attachment')
      .ele('cbc:EmbeddedDocumentBinaryObject', { mimeCode: 'text/plain' }).txt(data.pih).up()
    .up()
  .up();

  if (isSimplified && tlvBase64) {
    root.ele('cac:AdditionalDocumentReference')
      .ele('cbc:ID').txt('QR').up()
      .ele('cac:Attachment')
        .ele('cbc:EmbeddedDocumentBinaryObject', { mimeCode: 'text/plain' }).txt(tlvBase64).up()
      .up()
    .up();
  }

  // 11. Signature placeholder
  root.ele('cac:Signature')
    .ele('cbc:ID').txt('urn:oasis:names:specification:ubl:signature:Invoice').up()
    .ele('cbc:SignatureMethod').txt('urn:oasis:names:specification:ubl:dsig:enveloped:xades').up()
  .up();

  // 12. Seller
  const supplier = root.ele('cac:AccountingSupplierParty').ele('cac:Party');
  supplier.ele('cac:PartyIdentification')
    .ele('cbc:ID', { schemeID: 'OTH' }).txt(data.seller.trn).up()
  .up();
  
  supplier.ele('cac:PostalAddress')
    .ele('cbc:StreetName').txt(data.seller.streetName).up()
    .ele('cbc:BuildingNumber').txt(data.seller.buildingNumber).up()
    .ele('cbc:CitySubdivisionName').txt(data.seller.district).up()
    .ele('cbc:CityName').txt(data.seller.city).up()
    .ele('cbc:PostalZone').txt(data.seller.postalCode).up()
    .ele('cac:Country').ele('cbc:IdentificationCode').txt(data.seller.countryCode).up().up()
  .up();
  supplier.ele('cac:PartyTaxScheme')
    .ele('cbc:CompanyID').txt(data.seller.trn).up()
    .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT').up().up()
  .up();
  supplier.ele('cac:PartyLegalEntity')
    .ele('cbc:RegistrationName').txt(data.seller.nameAr).up()
  .up();

  // 13. Buyer
  const customer = root.ele('cac:AccountingCustomerParty').ele('cac:Party');
  if (data.buyer.address) {
    customer.ele('cac:PostalAddress')
      .ele('cbc:StreetName').txt(data.buyer.address).up()
      .ele('cbc:CityName').txt(data.buyer.city || '').up()
      .ele('cac:Country').ele('cbc:IdentificationCode').txt('SA').up().up()
    .up();
  }
  if (data.buyer.trn) {
    customer.ele('cac:PartyTaxScheme')
      .ele('cbc:CompanyID').txt(data.buyer.trn).up()
      .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT').up().up()
    .up();
  }
  customer.ele('cac:PartyLegalEntity')
    .ele('cbc:RegistrationName').txt(data.buyer.name).up()
  .up();

  // 14. Tax Total
  root.ele('cac:TaxTotal')
    .ele('cbc:TaxAmount', { currencyID: data.currency })
      .txt(data.vatTotal.toFixed(2))
    .up()
    .ele('cac:TaxSubtotal')
      .ele('cbc:TaxableAmount', { currencyID: data.currency }).txt(data.subtotal.toFixed(2)).up()
      .ele('cbc:TaxAmount', { currencyID: data.currency }).txt(data.vatTotal.toFixed(2)).up()
      .ele('cac:TaxCategory')
        .ele('cbc:ID', { schemeAgencyID: '6', schemeID: 'UN/ECE 5305' }).txt('S').up()
        .ele('cbc:Percent').txt('15.00').up()
        .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT').up().up()
      .up()
    .up()
  .up();

  root.ele('cac:TaxTotal')
    .ele('cbc:TaxAmount', { currencyID: 'SAR' }).txt(data.vatTotal.toFixed(2)).up()
  .up();

  // 15. Legal Monetary Total
  root.ele('cac:LegalMonetaryTotal')
    .ele('cbc:LineExtensionAmount', { currencyID: data.currency }).txt(data.subtotal.toFixed(2)).up()
    .ele('cbc:TaxExclusiveAmount', { currencyID: data.currency }).txt(data.subtotal.toFixed(2)).up()
    .ele('cbc:TaxInclusiveAmount', { currencyID: data.currency }).txt(data.totalWithVat.toFixed(2)).up()
    .ele('cbc:AllowanceTotalAmount', { currencyID: data.currency }).txt((data.discountAmount || 0).toFixed(2)).up()
    .ele('cbc:PayableAmount', { currencyID: data.currency }).txt(data.totalWithVat.toFixed(2)).up()
  .up();

  // 16. Invoice Lines
  data.lineItems.forEach((item, idx) => {
    root.ele('cac:InvoiceLine')
      .ele('cbc:ID').txt(String(idx + 1)).up()
      .ele('cbc:InvoicedQuantity', { unitCode: 'PCE' }).txt(String(item.quantity)).up()
      .ele('cbc:LineExtensionAmount', { currencyID: data.currency }).txt(item.unitPrice.toFixed(2)).up()
      .ele('cac:TaxTotal')
        .ele('cbc:TaxAmount', { currencyID: data.currency }).txt(item.vatAmount.toFixed(2)).up()
        .ele('cbc:RoundingAmount', { currencyID: data.currency }).txt((item.unitPrice + item.vatAmount).toFixed(2)).up()
      .up()
      .ele('cac:Item')
        .ele('cbc:Name').txt(item.name).up()
        .ele('cac:ClassifiedTaxCategory')
          .ele('cbc:ID').txt('S').up()
          .ele('cbc:Percent').txt(item.vatRate.toFixed(2)).up()
          .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT').up().up()
        .up()
      .up()
      .ele('cac:Price')
        .ele('cbc:PriceAmount', { currencyID: data.currency }).txt(item.unitPrice.toFixed(2)).up()
      .up()
    .up();
  });

  return root.end({ prettyPrint: false });
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatTime(date: Date): string {
  const iso = date.toISOString();
  return iso.split('T')[1].split('.')[0];
}

export function getZatcaTimestamp(date: Date): string {
  const iso = date.toISOString();
  return iso.split('.')[0];
}
// hmr test generator
