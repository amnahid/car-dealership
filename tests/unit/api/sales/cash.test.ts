import { GET, POST } from '@/app/api/sales/cash/route';
import { NextRequest } from 'next/server';
import CashSale from '@/models/CashSale';
import Car from '@/models/Car';
import Customer from '@/models/Customer';
import { connectDB, runInTransaction } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import { processZatcaInvoice } from '@/lib/zatca/invoiceService';
import { generateInvoice } from '@/lib/invoiceGenerator';
import mongoose from 'mongoose';

jest.mock('@/lib/db');
jest.mock('@/models/CashSale', () => ({
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
jest.mock('@/lib/saleNotifications');
jest.mock('@/lib/zatca/invoiceService', () => ({
  processZatcaInvoice: jest.fn(),
  calculateVat: jest.fn().mockReturnValue({ subtotal: 10000, vatAmount: 1500, totalWithVat: 11500 }),
  ZATCA_VAT_RATE: 15,
}));
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

const mockCashSale = CashSale as jest.Mocked<any>;
const mockCar = Car as jest.Mocked<any>;
const mockCustomer = Customer as jest.Mocked<any>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockRunInTransaction = runInTransaction as jest.MockedFunction<typeof runInTransaction>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;
const mockProcessZatcaInvoice = processZatcaInvoice as jest.MockedFunction<typeof processZatcaInvoice>;
const mockGenerateInvoice = generateInvoice as jest.MockedFunction<typeof generateInvoice>;

describe('Cash Sales API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/sales/cash', () => {
    it('returns 401 if unauthorized', async () => {
      mockGetAuthPayload.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/sales/cash');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns sales list on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin' } as any);
      mockCashSale.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([{ saleId: 'CSH-0001', finalPrice: 10000 }]),
                }),
              }),
            }),
          }),
        }),
      } as any);
      mockCashSale.countDocuments.mockResolvedValue(1);
      mockCashSale.aggregate.mockResolvedValue([{ total: 10000 }]);

      const req = new NextRequest('http://localhost/api/sales/cash');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.sales).toHaveLength(1);
      expect(data.totalRevenue).toBe(10000);
    });
  });

  describe('POST /api/sales/cash', () => {
    it('creates a cash sale on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', userId: 'adminid', name: 'Admin' } as any);
      
      const { calculateVat } = require('@/lib/zatca/invoiceService');
      (calculateVat as jest.Mock).mockReturnValue({ subtotal: 10000, vatAmount: 1500, totalWithVat: 11500 });

      const saleData = {
        carId: 'CAR-001',
        car: new mongoose.Types.ObjectId().toString(),
        customer: new mongoose.Types.ObjectId().toString(),
        customerName: 'John Doe',
        customerPhone: '123456789',
        salePrice: 10000,
        saleDate: new Date().toISOString(),
      };

      mockRunInTransaction.mockImplementation(async (callback) => {
        return callback({});
      });

      mockCar.findById.mockReturnValue({
        session: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ status: 'In Stock', brand: 'Toyota', model: 'Camry', carId: 'CAR-001' }),
          mockResolvedValue: jest.fn().mockResolvedValue({ status: 'In Stock' }), // for the first call
        }),
      } as any);

      // Re-mocking findById to handle the two different calls if necessary, 
      // but let's try a more robust chain first.
      const carMockChain = {
        session: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ status: 'In Stock', brand: 'Toyota', model: 'Camry', carId: 'CAR-001' }),
        exec: jest.fn().mockResolvedValue({ status: 'In Stock' }),
      };
      (carMockChain as any).then = jest.fn().mockImplementation((onSuccess) => {
          return Promise.resolve({ status: 'In Stock' }).then(onSuccess);
      });
      mockCar.findById.mockReturnValue(carMockChain);
      mockCustomer.findById.mockReturnValue({ session: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ fullName: 'John Doe' }) }) } as any);
      
      const mockCreatedSale = {
        _id: new mongoose.Types.ObjectId(),
        saleId: 'CSH-0001',
        saleDate: new Date(),
        customerName: 'John Doe',
        customerPhone: '123456789',
        carId: 'CAR-001',
        save: jest.fn().mockResolvedValue(true),
      };
      mockCashSale.create.mockResolvedValue([mockCreatedSale]);
      mockCashSale.findById.mockResolvedValue(mockCreatedSale);

      mockProcessZatcaInvoice.mockResolvedValue({
        uuid: 'uuid',
        qrCode: 'qr',
        status: 'Cleared',
        xmlHash: 'hash',
        zatcaResponse: {},
      } as any);

      mockGenerateInvoice.mockResolvedValue('http://invoice.url');

      const req = new NextRequest('http://localhost/api/sales/cash', {
        method: 'POST',
        body: JSON.stringify(saleData),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.sale.saleId).toBe('CSH-0001');
      expect(data.invoiceUrl).toBe('http://invoice.url');
    });
  });
});
