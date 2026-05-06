import { calculateVat, ensureVisualQRCode, processZatcaInvoice } from '@/lib/zatca/invoiceService';
import ZatcaConfig from '@/models/ZatcaConfig';
import ZatcaInvoice from '@/models/ZatcaInvoice';
import { ZatcaClient } from '@/lib/zatca/zatcaClient';
import QRCode from 'qrcode';
import mongoose from 'mongoose';

jest.mock('@/lib/db');
jest.mock('@/models/ZatcaConfig');
jest.mock('@/models/ZatcaInvoice');
jest.mock('@/lib/zatca/zatcaClient');
jest.mock('qrcode');

describe('zatca/invoiceService', () => {
  describe('calculateVat', () => {
    it('calculates VAT correctly (exclusive)', () => {
      const result = calculateVat(100, 15, false);
      expect(result.subtotal).toBe(100);
      expect(result.vatAmount).toBe(15);
      expect(result.totalWithVat).toBe(115);
    });

    it('calculates VAT correctly (inclusive)', () => {
      const result = calculateVat(115, 15, true);
      expect(result.subtotal).toBe(100);
      expect(result.vatAmount).toBe(15);
      expect(result.totalWithVat).toBe(115);
    });

    it('handles zero VAT rate', () => {
      const result = calculateVat(100, 0, false);
      expect(result.subtotal).toBe(100);
      expect(result.vatAmount).toBe(0);
      expect(result.totalWithVat).toBe(100);
    });
  });

  describe('ensureVisualQRCode', () => {
    it('returns data URL as is', async () => {
      const qr = 'data:image/png;base64,abc';
      expect(await ensureVisualQRCode(qr)).toBe(qr);
    });

    it('converts TLV string to data URL using QRCode', async () => {
      (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,qr');
      const result = await ensureVisualQRCode('tlvstring');
      expect(result).toBe('data:image/png;base64,qr');
      expect(QRCode.toDataURL).toHaveBeenCalledWith('tlvstring');
    });

    it('returns original string on failure', async () => {
      (QRCode.toDataURL as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await ensureVisualQRCode('tlvstring');
      expect(result).toBe('tlvstring');
    });
  });

  describe('processZatcaInvoice', () => {
    const mockInput: any = {
      referenceId: 'ref123',
      referenceType: 'CashSale',
      saleId: 'CSH-001',
      invoiceType: 'Simplified',
      issueDate: new Date(),
      supplyDate: new Date(),
      buyer: { name: 'Buyer' },
      lineItems: [],
      subtotal: 100,
      vatTotal: 15,
      totalWithVat: 115,
      createdBy: new mongoose.Types.ObjectId().toString(),
    };

    const mockConfig = {
      _id: 'configid',
      sellerName: 'Seller',
      sellerNameAr: 'بائع',
      trn: '123456789012345',
      address: {
        buildingNumber: '1',
        streetName: 'S',
        district: 'D',
        city: 'C',
        postalCode: '1',
        countryCode: 'SA',
      },
      pih: 'pih',
      productionCsid: 'cert',
      isActive: true,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns failure if config not found', async () => {
      (ZatcaConfig.findOne as jest.Mock).mockResolvedValue(null);
      const result = await processZatcaInvoice(mockInput);
      expect(result.status).toBe('Failed');
      expect(result.errorMessage).toContain('configuration not found');
    });

    it('processes invoice successfully', async () => {
      (ZatcaConfig.findOne as jest.Mock).mockResolvedValue(mockConfig);
      const mockProcessResult = {
        uuid: 'uuid',
        qrCode: 'qr',
        xml: 'xml',
        xmlHash: 'hash',
        status: 'Cleared',
      };
      (ZatcaClient.prototype.processInvoice as jest.Mock).mockResolvedValue(mockProcessResult);
      (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/qr');

      const result = await processZatcaInvoice(mockInput);

      expect(result.status).toBe('Cleared');
      expect(ZatcaInvoice.create).toHaveBeenCalled();
      expect(ZatcaConfig.updateOne).toHaveBeenCalled();
    });
  });
});
