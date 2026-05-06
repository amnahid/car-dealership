import ZatcaInvoice from '@/models/ZatcaInvoice';
import mongoose from 'mongoose';

describe('ZatcaInvoice Model', () => {
  it('should be invalid if required fields are missing', async () => {
    const invoice = new ZatcaInvoice({});

    let err: any;
    try {
      await invoice.validate();
    } catch (error) {
      err = error;
    }

    expect(err.errors.uuid).toBeDefined();
    expect(err.errors.invoiceType).toBeDefined();
    expect(err.errors.referenceId).toBeDefined();
    expect(err.errors.referenceType).toBeDefined();
    expect(err.errors.saleId).toBeDefined();
    expect(err.errors.issueDate).toBeDefined();
    expect(err.errors.xml).toBeDefined();
    expect(err.errors.xmlHash).toBeDefined();
    expect(err.errors.pih).toBeDefined();
    expect(err.errors.qrCode).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
  });

  it('should have default value for status', () => {
    const invoice = new ZatcaInvoice({
      uuid: 'uuid',
      invoiceType: 'Simplified',
      referenceId: 'refid',
      referenceType: 'CashSale',
      saleId: 'CSH-001',
      issueDate: new Date(),
      xml: 'xml',
      xmlHash: 'hash',
      pih: 'pih',
      qrCode: 'qr',
      createdBy: new mongoose.Types.ObjectId(),
    });

    expect(invoice.status).toBe('Pending');
  });
});
