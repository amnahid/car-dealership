jest.mock('@/lib/db');
jest.mock('@/models/Rental', () => ({
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

import { GET, POST } from '@/app/api/sales/rentals/route';
import { NextRequest } from 'next/server';
import Rental from '@/models/Rental';
import Car from '@/models/Car';
import Customer from '@/models/Customer';
import { connectDB, runInTransaction } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import { processZatcaInvoice } from '@/lib/zatca/invoiceService';
import { generateInvoice } from '@/lib/invoiceGenerator';
import { generateRentalAgreement } from '@/lib/agreementGenerator';
import { validateTafweedAuthorization } from '@/lib/tafweed';
import mongoose from 'mongoose';

const mockRental = Rental as jest.Mocked<any>;
const mockCar = Car as jest.Mocked<any>;
const mockCustomer = Customer as jest.Mocked<any>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockRunInTransaction = runInTransaction as jest.MockedFunction<typeof runInTransaction>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;
const mockProcessZatcaInvoice = processZatcaInvoice as jest.MockedFunction<typeof processZatcaInvoice>;
const mockGenerateInvoice = generateInvoice as jest.MockedFunction<typeof generateInvoice>;
const mockGenerateAgreement = generateRentalAgreement as jest.MockedFunction<typeof generateRentalAgreement>;

describe('Rentals API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/sales/rentals', () => {
    it('returns 401 if unauthorized', async () => {
      mockGetAuthPayload.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/sales/rentals');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns rentals list on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', normalizedRoles: ['Admin'] } as any);
      mockRental.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([{ rentalId: 'RNT-0001', totalAmount: 500 }]),
                }),
              }),
            }),
          }),
        }),
      } as any);
      mockRental.countDocuments.mockResolvedValue(1);
      mockRental.aggregate.mockResolvedValue([{ total: 500 }]);

      const req = new NextRequest('http://localhost/api/sales/rentals');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.rentals).toHaveLength(1);
      expect(data.totalRevenue).toBe(500);
    });
  });

  describe('POST /api/sales/rentals', () => {
    it('creates a rental on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ 
        userId: 'adminid', 
        name: 'Admin',
        role: 'Admin',
        normalizedRole: 'Admin', 
        normalizedRoles: ['Admin'] 
      } as any);
      
      const { calculateVat } = require('@/lib/zatca/invoiceService');
      (calculateVat as jest.Mock).mockReturnValue({ subtotal: 500, vatAmount: 75, totalWithVat: 575 });

      const { validateTafweedAuthorization } = require('@/lib/tafweed');
      (validateTafweedAuthorization as jest.Mock).mockReturnValue({
        status: 'Active',
        authorizedTo: 'John Doe',
        driverIqama: '123',
        expiryDate: new Date(),
        durationMonths: 1
      });

      const rentalData = {
        carId: 'CAR-001',
        car: new mongoose.Types.ObjectId().toString(),
        customer: new mongoose.Types.ObjectId().toString(),
        customerName: 'John Doe',
        customerPhone: '123456789',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        dailyRate: 100,
      };

      mockRunInTransaction.mockImplementation(async (callback) => {
        return callback({});
      });

      const mockResult = { status: 'In Stock', brand: 'Toyota', model: 'Camry', carId: 'CAR-001' };
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
      
      const mockCreatedRental = {
        _id: new mongoose.Types.ObjectId(),
        rentalId: 'RNT-0001',
        startDate: new Date(),
        customerName: 'John Doe',
        customerPhone: '123456789',
        carId: 'CAR-001',
        totalAmount: 500,
        save: jest.fn().mockResolvedValue(true),
      };
      mockRental.create.mockResolvedValue([mockCreatedRental]);
      mockRental.findById.mockResolvedValue(mockCreatedRental);

      mockProcessZatcaInvoice.mockResolvedValue({
        uuid: 'uuid',
        qrCode: 'qr',
        status: 'Cleared',
        xmlHash: 'hash',
        zatcaResponse: {},
      } as any);

      mockGenerateInvoice.mockResolvedValue('http://invoice.url');
      mockGenerateAgreement.mockResolvedValue('http://agreement.url');

      const req = new NextRequest('http://localhost/api/sales/rentals', {
        method: 'POST',
        body: JSON.stringify(rentalData),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.rental.rentalId).toBe('RNT-0001');
    });
  });
});
