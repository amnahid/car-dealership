import mongoose from 'mongoose';

// Define mocks BEFORE importing the route handler
jest.mock('@/lib/db');
jest.mock('@/models/InstallmentSale', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));
jest.mock('@/models/Car', () => ({
  __esModule: true,
  default: {
    findByIdAndUpdate: jest.fn(),
  },
}));
jest.mock('@/models/Transaction', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));
jest.mock('@/models/User', () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
    }
}));
jest.mock('@/lib/apiAuth');
jest.mock('@/lib/activityLogger');
jest.mock('@/lib/installmentUtils', () => ({
  calculateAccruedLateFee: jest.fn(),
}));
jest.mock('jose', () => ({
    jwtVerify: jest.fn(),
}));

import { POST } from '@/app/api/sales/installments/[id]/payments/route';
import { NextRequest } from 'next/server';
import InstallmentSale from '@/models/InstallmentSale';
import Transaction from '@/models/Transaction';
import { runInTransaction } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';

const mockInstallmentSale = InstallmentSale as jest.Mocked<any>;
const mockTransaction = Transaction as unknown as { create: jest.Mock };
const mockRunInTransaction = runInTransaction as jest.MockedFunction<typeof runInTransaction>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;

describe('Installment Payments API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/sales/installments/[id]/payments', () => {
    it('successfully records payment with late fee and ordered:true', async () => {
      const saleId = new mongoose.Types.ObjectId().toString();
      mockGetAuthPayload.mockResolvedValue({ 
        userId: 'user1', 
        name: 'Test User', 
        normalizedRoles: ['Admin'] 
      } as any);

      // Mock transaction wrapper to just call the function
      mockRunInTransaction.mockImplementation(async (callback) => {
        return callback({ session: 'dummy-session' });
      });

      const mockSale = {
        _id: saleId,
        saleId: 'INS-0001',
        carId: 'CAR-001',
        car: 'car-obj-id',
        paymentSchedule: [
          { installmentNumber: 1, status: 'Pending', dueDate: new Date(), amount: 1000 }
        ],
        monthlyLateFee: 100,
        totalPaid: 0,
        remainingAmount: 1000,
        lateFeeCharged: 0,
        markModified: jest.fn(),
        set: jest.fn(function(path, value) {
          // Simple mock for .set() to support the route's usage
          const parts = path.split('.');
          if (parts.length === 3 && parts[0] === 'paymentSchedule') {
            const idx = parseInt(parts[1]);
            const field = parts[2];
            if (this.paymentSchedule[idx]) {
              this.paymentSchedule[idx][field] = value;
            }
          } else {
            this[path] = value;
          }
        }),
        save: jest.fn().mockResolvedValue(true),
      };

      mockInstallmentSale.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockSale)
      });

      mockInstallmentSale.findByIdAndUpdate.mockResolvedValue({
        ...mockSale,
        paymentSchedule: [
          { installmentNumber: 1, status: 'Paid', amount: 1000 }
        ]
      });

      const paymentData = {
        installmentNumber: 1,
        amount: 1000,
        lateFeeAmount: 50, // Triggers multi-document transaction creation
        paymentDate: new Date().toISOString(),
        notes: 'Monthly payment'
      };

      const req = new NextRequest(`http://localhost/api/sales/installments/${saleId}/payments`, {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });

      // The key check: ensure ordered: true is passed to create()
      mockTransaction.create.mockImplementation((docs, options) => {
          if (Array.isArray(docs) && docs.length > 1 && options.session && !options.ordered) {
              throw new Error('MongooseError: Cannot call create() with a session and multiple documents unless ordered: true is set');
          }
          return Promise.resolve(docs);
      });

      const res = await POST(req, { params: Promise.resolve({ id: saleId }) });
      
      expect(res.status).toBe(200);
      
      // Verify that Transaction.create was called twice (base payment + late fee)
      expect(mockTransaction.create).toHaveBeenCalledTimes(2);
      
      // First call: base payment
      expect(mockTransaction.create).toHaveBeenNthCalledWith(
        1,
        expect.arrayContaining([expect.objectContaining({ category: 'Installment Payment' })]),
        expect.objectContaining({ session: expect.anything() })
      );

      // Second call: late fee
      expect(mockTransaction.create).toHaveBeenNthCalledWith(
        2,
        expect.arrayContaining([expect.objectContaining({ category: 'Fee' })]),
        expect.objectContaining({ session: expect.anything() })
      );
    });

    it('returns 403 if user lacks required role', async () => {
        const saleId = new mongoose.Types.ObjectId().toString();
        mockGetAuthPayload.mockResolvedValue({ 
          normalizedRoles: ['Car Manager']
        } as any);

        const req = new NextRequest(`http://localhost/api/sales/installments/${saleId}/payments`, {
          method: 'POST',
          body: JSON.stringify({}),
        });

        const res = await POST(req, { params: Promise.resolve({ id: saleId }) });
        expect(res.status).toBe(403);
    });
  });
});
