import { EGS, EGSUnitInfo, ZATCAInvoice, ZATCAInvoiceTypes, ZATCAPaymentMethods } from 'zatca-xml-ts';
import { IZatcaConfigDocument } from '@/models/ZatcaConfig';
import { 
  ZatcaInvoiceData, 
  ZatcaProcessResult, 
  ZATCA_INITIAL_PIH 
} from './types';

interface ExtendedConfig extends IZatcaConfigDocument {
    egsUuid?: string;
    egsCustomId?: string;
    egsModel?: string;
    crnNumber?: string;
}

export class ZatcaClient {
  private egs: EGS;
  private config: IZatcaConfigDocument;

  constructor(config: IZatcaConfigDocument) {
    this.config = config;
    const extConfig = config as ExtendedConfig;
    const egsUnit: EGSUnitInfo = {
      uuid: extConfig.egsUuid || '12345678-1234-1234-1234-123456789012',
      custom_id: extConfig.egsCustomId || 'EGS-1',
      model: extConfig.egsModel || 'Model-1',
      CRN_number: extConfig.crnNumber || '1234567890',
      VAT_name: config.sellerName,
      VAT_number: config.trn,
      branch_name: 'Main',
      branch_industry: 'Automotive',
      location: {
        city: config.address.city,
        street: config.address.streetName,
        building: config.address.buildingNumber,
        plot_identification: '1234',
        postal_zone: config.address.postalCode,
      },
      private_key: config.privateKey,
      csr: config.csr,
      compliance_certificate: config.certificate, 
      compliance_api_secret: config.complianceCsidSecret,
      production_certificate: config.productionCsid,
      production_api_secret: config.productionCsidSecret,
    };

    const env = config.environment === 'production' ? 'production' : 'simulation';
    this.egs = new EGS(egsUnit, env);
  }

  /**
   * Step 1 & 2: Generate Keys and CSR
   */
  async generateKeysAndCSR(solutionName: string = 'CarDealership'): Promise<{ privateKey: string; csr: string }> {
    const isProduction = this.config.environment === 'production';
    await this.egs.generateNewKeysAndCSR(isProduction, solutionName);
    const info = this.egs.get();
    return {
      privateKey: info.private_key || '',
      csr: info.csr || '',
    };
  }

  /**
   * Step 3: Issue Compliance CSID
   */
  async issueComplianceCertificate(otp: string): Promise<string> {
    return await this.egs.issueComplianceCertificate(otp);
  }

  /**
   * Step 4: Issue Production CSID
   */
  async issueProductionCertificate(complianceRequestId: string): Promise<string> {
    return await this.egs.issueProductionCertificate(complianceRequestId);
  }

  /**
   * Process (Sign & Submit) an invoice
   */
  async processInvoice(data: ZatcaInvoiceData): Promise<ZatcaProcessResult> {
    const isStandard = data.invoiceType === 'Standard';
    const invoiceType = ZATCAInvoiceTypes.INVOICE; 
    const invoiceCode = isStandard ? '0100000' : '0200000';

    const invoice = new ZATCAInvoice({
      props: {
        egs_info: this.egs.get(),
        invoice_type: invoiceType,
        invoice_code: invoiceCode as "0100000" | "0200000",
        invoice_counter_number: 1, 
        invoice_serial_number: data.invoiceNumber || data.uuid.substring(0, 8),
        issue_date: data.issueDate.toISOString().split('T')[0],
        issue_time: data.issueDate.toISOString().split('T')[1].split('.')[0],
        previous_invoice_hash: data.pih || ZATCA_INITIAL_PIH,
        payment_method: ZATCAPaymentMethods.CASH,
        line_items: data.lineItems.map((item, index) => ({
          id: String(index + 1),
          name: item.name,
          quantity: item.quantity,
          tax_exclusive_price: item.unitPrice,
          VAT_percent: (item.vatRate / 100) as 0.15 | 0.05,
        })),
      },
    });

    // Sign the invoice
    const isProduction = !!this.config.productionCsid;
    const { signed_invoice_string, invoice_hash, qr } = this.egs.signInvoice(invoice, isProduction);

    let status: ZatcaProcessResult['status'] = 'Pending';
    let zatcaResponse: Record<string, unknown>;
    let clearedXml: string | undefined;

    try {
      if (isStandard) {
        zatcaResponse = await this.egs.clearanceInvoice(signed_invoice_string, invoice_hash);
        status = 'Cleared';
        if (zatcaResponse && typeof zatcaResponse === 'object' && 'clearedInvoice' in zatcaResponse) {
            clearedXml = Buffer.from(zatcaResponse.clearedInvoice as string, 'base64').toString('utf8');
        }
      } else {
        zatcaResponse = await this.egs.reportInvoice(signed_invoice_string, invoice_hash);
        status = 'Reported';
      }
    } catch (error) {
      status = 'Failed';
      throw error;
    }

    return {
      uuid: data.uuid,
      qrCode: qr,
      xml: clearedXml || signed_invoice_string,
      xmlHash: invoice_hash,
      status,
      zatcaResponse,
      newPih: invoice_hash,
    };
  }

  /**
   * Check compliance (Step 3 verification)
   */
  async checkCompliance(data: ZatcaInvoiceData): Promise<Record<string, unknown>> {
    const invoice = new ZATCAInvoice({
        props: {
          egs_info: this.egs.get(),
          invoice_type: ZATCAInvoiceTypes.INVOICE,
          invoice_code: '0200000',
          invoice_counter_number: 1,
          invoice_serial_number: 'TEST-COMPLIANCE',
          issue_date: data.issueDate.toISOString().split('T')[0],
          issue_time: data.issueDate.toISOString().split('T')[1].split('.')[0],
          previous_invoice_hash: data.pih || ZATCA_INITIAL_PIH,
          payment_method: ZATCAPaymentMethods.CASH,
          line_items: data.lineItems.map((item, index) => ({
            id: String(index + 1),
            name: item.name,
            quantity: item.quantity,
            tax_exclusive_price: item.unitPrice,
            VAT_percent: (item.vatRate / 100) as 0.15 | 0.05,
          })),
        },
      });

      const { signed_invoice_string, invoice_hash } = this.egs.signInvoice(invoice, false);
      return await this.egs.checkInvoiceCompliance(signed_invoice_string, invoice_hash);
  }

  /**
   * Report an existing signed invoice
   */
  async reportExistingInvoice(xml: string, hash: string): Promise<Record<string, unknown>> {
      return await this.egs.reportInvoice(xml, hash);
  }

  /**
   * Clear an existing signed invoice
   */
  async clearanceExistingInvoice(xml: string, hash: string): Promise<Record<string, unknown>> {
      return await this.egs.clearanceInvoice(xml, hash);
  }

  getEgsInfo() {
      return this.egs.get();
  }
}
