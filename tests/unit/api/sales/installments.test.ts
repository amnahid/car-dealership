jest.mock('@/lib/db');
jest.mock('@/models/InstallmentSale', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn(),
  },
}));
jest.mock('@/models/Car', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));
jest.mock('@/models/Customer', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));
jest.mock('@/models/Transaction');
jest.mock('@/lib/apiAuth');
jest.mock('@/lib/activityLogger');
jest.mock('@/lib/invoiceGenerator');
jest.mock('@/lib/agreementGenerator');
jest.mock('@/lib/saleNotifications');
jest.mock('@/lib/zatca/invoiceService', () => ({
  processZatcaInvoice: jest.fn(),
  calculateVat: jest.fn(),
  ZATCA_VAT_RATE: 15,
}));
jest.mock('@/lib/tafweed', () => ({
  validateTafweedAuthorization: jest.fn(),
}));
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

import { GET, POST } from '@/app/api/sales/installments/route';
import { NextRequest } from 'next/server';
import InstallmentSale from '@/models/InstallmentSale';
import Car from '@/models/Car';
import Customer from '@/models/Customer';
import { connectDB, runInTransaction } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import { processZatcaInvoice } from '@/lib/zatca/invoiceService';
import { generateInvoice } from '@/lib/invoiceGenerator';
import { generateInstallmentAgreement } from '@/lib/agreementGenerator';
import { validateTafweedAuthorization } from '@/lib/tafweed';
import mongoose from 'mongoose';

const mockInstallmentSale = InstallmentSale as jest.Mocked<any>;
const mockCar = Car as jest.Mocked<any>;
const mockCustomer = Customer as jest.Mocked<any>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockRunInTransaction = runInTransaction as jest.MockedFunction<typeof runInTransaction>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;
const mockProcessZatcaInvoice = processZatcaInvoice as jest.MockedFunction<typeof processZatcaInvoice>;
const mockGenerateInvoice = generateInvoice as jest.MockedFunction<typeof generateInvoice>;
const mockGenerateAgreement = generateInstallmentAgreement as jest.MockedFunction<typeof generateInstallmentAgreement>;

describe('Installment Sales API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/sales/installments', () => {
    it('returns 401 if unauthorized', async () => {
      mockGetAuthPayload.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/sales/installments');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns sales list on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', normalizedRoles: ['Admin'] } as any);
      mockInstallmentSale.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([{ saleId: 'INS-0001', totalPrice: 100000, totalPaid: 30000 }]),
                }),
              }),
            }),
          }),
        }),
      } as any);
      mockInstallmentSale.countDocuments.mockResolvedValue(1);
      mockInstallmentSale.aggregate.mockResolvedValue([{ totalValue: 100000, totalPaid: 30000, totalRemaining: 70000 }]);

      const req = new NextRequest('http://localhost/api/sales/installments');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sales).toHaveLength(1);
      expect(data.totalValue).toBe(100000);
    });
  });

  describe('POST /api/sales/installments', () => {
    it('creates an installment sale on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ 
        userId: 'adminid', 
        name: 'Admin',
        role: 'Admin',
        normalizedRole: 'Admin', 
        normalizedRoles: ['Admin'] 
      } as any);
      
      const { calculateVat } = require('@/lib/zatca/invoiceService');
      (calculateVat as jest.Mock).mockReturnValue({ subtotal: 100000, vatAmount: 15000, totalWithVat: 115000 });

      const { validateTafweedAuthorization } = require('@/lib/tafweed');
      (validateTafweedAuthorization as jest.Mock).mockReturnValue({
        status: 'Active',
        authorizedTo: 'John Doe',
        driverIqama: '123',
        expiryDate: new Date(),
        durationMonths: 12
      });

      const saleData = {
        carId: 'CAR-001',
        car: new mongoose.Types.ObjectId().toString(),
        customer: new mongoose.Types.ObjectId().toString(),
        customerName: 'John Doe',
        customerPhone: '123456789',
        totalPrice: 100000,
        downPayment: 20000,
        tenureMonths: 24,
        startDate: new Date().toISOString(),
        otherFees: 500,
      };

      mockRunInTransaction.mockImplementation(async (callback) => {
        return callback({});
      });

      const mockResult = { status: 'In Stock', brand: 'Toyota', carModel: 'Camry', carId: 'CAR-001' };
      const sessionMock = jest.fn().mockImplementation(() => {
          const p: any = Promise.resolve(mockResult);
          p.lean = jest.fn().mockResolvedValue(mockResult);
          return p;
      });
      mockCar.findById.mockImplementation(() => ({
        session: sessionMock
      }));

      mockCustomer.findById.mockImplementation(() => ({
        session: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ fullName: 'John Doe', licenseExpiryDate: new Date() })
        })
      }));
      
      const mockCreatedSale = {
        _id: new mongoose.Types.ObjectId(),
        saleId: 'INS-0001',
        startDate: new Date(),
        customerName: 'John Doe',
        customerPhone: '123456789',
        carId: 'CAR-001',
        totalPrice: 100000,
        otherFees: 500,
        save: jest.fn().mockResolvedValue(true),
      };
      mockInstallmentSale.create.mockImplementation((args: any) => {
        expect(args[0].otherFees).toBe(500);
        return Promise.resolve([mockCreatedSale]);
      });
      mockInstallmentSale.findById.mockResolvedValue(mockCreatedSale);

      mockProcessZatcaInvoice.mockResolvedValue({
        uuid: 'uuid',
        qrCode: 'qr',
        status: 'Cleared',
        xmlHash: 'hash',
        zatcaResponse: {},
      } as any);

      mockGenerateInvoice.mockResolvedValue('http://invoice.url');
      mockGenerateAgreement.mockResolvedValue('http://agreement.url');

      const req = new NextRequest('http://localhost/api/sales/installments', {
        method: 'POST',
        body: JSON.stringify(saleData),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.sale.saleId).toBe('INS-0001');
      expect(data.sale.otherFees).toBe(500);
    });
  });
});
