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
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateMany: jest.fn(),
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
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

import { POST, PUT, DELETE } from '@/app/api/sales/installments/[id]/payments/route';
import { NextRequest } from 'next/server';
import InstallmentSale from '@/models/InstallmentSale';
import Transaction from '@/models/Transaction';
import { runInTransaction } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';

const mockInstallmentSale = InstallmentSale as jest.Mocked<any>;
const mockTransaction = Transaction as unknown as {
  create: jest.Mock;
  findOne: jest.Mock;
  findOneAndUpdate: jest.Mock;
  updateMany: jest.Mock;
};
const mockRunInTransaction = runInTransaction as jest.MockedFunction<typeof runInTransaction>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;

describe('Installment Payments API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockSale = (saleId: string, overrides: any = {}) => ({
    _id: saleId,
    saleId: 'INS-0001',
    carId: 'CAR-001',
    car: 'car-obj-id',
    loanAmount: 6000,
    paymentSchedule: [
      { installmentNumber: 1, status: 'Pending', dueDate: new Date('2026-07-01'), amount: 2000 },
      { installmentNumber: 2, status: 'Pending', dueDate: new Date('2026-08-01'), amount: 2000 },
      { installmentNumber: 3, status: 'Pending', dueDate: new Date('2026-09-01'), amount: 2000 },
    ],
    monthlyLateFee: 100,
    totalPaid: 0,
    remainingAmount: 6000,
    lateFeeCharged: 0,
    status: 'Active',
    markModified: jest.fn(),
    set: jest.fn(function(path, value) {
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
    ...overrides,
  });

  describe('POST /api/sales/installments/[id]/payments', () => {
    it('successfully records payment with late fee and recalculates totals', async () => {
      const saleId = new mongoose.Types.ObjectId().toString();
      mockGetAuthPayload.mockResolvedValue({ 
        userId: 'user1', 
        name: 'Test User', 
        normalizedRoles: ['Admin'] 
      } as any);

      mockRunInTransaction.mockImplementation(async (callback) => {
        return callback({ hasEnded: false } as any);
      });

      const mockSale = createMockSale(saleId);

      mockInstallmentSale.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockSale)
      });

      mockTransaction.findOneAndUpdate.mockResolvedValue(null);
      mockTransaction.create.mockResolvedValue([]);

      const paymentData = {
        installmentNumber: 1,
        amount: 2000,
        lateFeeAmount: 50,
        paymentDate: '2026-07-05',
        notes: 'Monthly payment'
      };

      const req = new NextRequest(`http://localhost/api/sales/installments/${saleId}/payments`, {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });

      const res = await POST(req, { params: Promise.resolve({ id: saleId }) });
      expect(res.status).toBe(200);

      // Verify recalculations
      expect(mockSale.totalPaid).toBe(2050);
      expect(mockSale.lateFeeCharged).toBe(50);
      expect(mockSale.remainingAmount).toBe(4000);
      expect(mockSale.paymentSchedule[0].status).toBe('Paid');

      // Transactions created
      expect(mockTransaction.create).toHaveBeenCalledTimes(2);
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

  describe('PUT /api/sales/installments/[id]/payments', () => {
    it('successfully edits a paid installment and updates existing transactions', async () => {
      const saleId = new mongoose.Types.ObjectId().toString();
      mockGetAuthPayload.mockResolvedValue({ 
        userId: 'user1', 
        name: 'Test Admin', 
        normalizedRoles: ['Admin'] 
      } as any);

      mockRunInTransaction.mockImplementation(async (callback) => {
        return callback({ hasEnded: false } as any);
      });

      const mockSale = createMockSale(saleId, {
        totalPaid: 2050,
        remainingAmount: 4000,
        lateFeeCharged: 50,
        paymentSchedule: [
          { installmentNumber: 1, status: 'Paid', dueDate: new Date('2026-07-01'), amount: 2000, paidAmount: 2050, lateFee: 50, paidDate: new Date('2026-07-05') },
          { installmentNumber: 2, status: 'Pending', dueDate: new Date('2026-08-01'), amount: 2000 },
          { installmentNumber: 3, status: 'Pending', dueDate: new Date('2026-09-01'), amount: 2000 },
        ]
      });

      mockInstallmentSale.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockSale)
      });

      const existingBaseTx = { amount: 2000, isDeleted: false };
      mockTransaction.findOneAndUpdate.mockResolvedValueOnce(existingBaseTx);
      mockTransaction.updateMany.mockResolvedValue({ modifiedCount: 1 });

      // Edit payment #1 to base 2100 and late fee 0
      const req = new NextRequest(`http://localhost/api/sales/installments/${saleId}/payments`, {
        method: 'PUT',
        body: JSON.stringify({
          installmentNumber: 1,
          action: 'edit',
          amount: 2100,
          lateFeeAmount: 0,
          paymentDate: '2026-07-06',
          notes: 'Corrected payment amount',
        }),
      });

      const res = await PUT(req, { params: Promise.resolve({ id: saleId }) });
      expect(res.status).toBe(200);

      // Verify recalculated totals
      expect(mockSale.totalPaid).toBe(2100);
      expect(mockSale.lateFeeCharged).toBe(0);
      expect(mockSale.remainingAmount).toBe(3900); // 6000 - 2100 = 3900

      // Verify transaction updates
      expect(mockTransaction.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ referenceId: saleId, category: 'Installment Payment' }),
        expect.objectContaining({ $set: expect.objectContaining({ amount: 2100, isDeleted: false }) }),
        expect.anything()
      );
      expect(mockTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ referenceId: saleId, category: 'Fee' }),
        expect.objectContaining({ $set: { isDeleted: true } }),
        expect.anything()
      );
    });

    it('successfully reverts a paid payment, soft-deletes transactions, and updates sale status', async () => {
      const saleId = new mongoose.Types.ObjectId().toString();
      mockGetAuthPayload.mockResolvedValue({ 
        userId: 'user1', 
        name: 'Test Admin', 
        normalizedRoles: ['Admin'] 
      } as any);

      mockRunInTransaction.mockImplementation(async (callback) => {
        return callback({ hasEnded: false } as any);
      });

      const mockSale = createMockSale(saleId, {
        totalPaid: 2000,
        remainingAmount: 4000,
        paymentSchedule: [
          { installmentNumber: 1, status: 'Paid', dueDate: new Date('2026-07-01'), amount: 2000, paidAmount: 2000, lateFee: 0 },
          { installmentNumber: 2, status: 'Pending', dueDate: new Date('2026-08-01'), amount: 2000 },
          { installmentNumber: 3, status: 'Pending', dueDate: new Date('2026-09-01'), amount: 2000 },
        ]
      });

      mockInstallmentSale.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockSale)
      });

      mockTransaction.updateMany.mockResolvedValue({ modifiedCount: 1 });

      const req = new NextRequest(`http://localhost/api/sales/installments/${saleId}/payments`, {
        method: 'PUT',
        body: JSON.stringify({
          installmentNumber: 1,
          action: 'revert',
          notes: 'Reverting accidental entry',
        }),
      });

      const res = await PUT(req, { params: Promise.resolve({ id: saleId }) });
      expect(res.status).toBe(200);

      // Verify reverted status and recalculations
      expect(mockSale.totalPaid).toBe(0);
      expect(mockSale.remainingAmount).toBe(6000);
      expect(mockSale.paymentSchedule[0].paidAmount).toBeUndefined();

      // Verify soft deletion of transactions
      expect(mockTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ referenceId: saleId }),
        { $set: { isDeleted: true } },
        expect.anything()
      );
    });

    it('successfully edits an unpaid scheduled installment', async () => {
      const saleId = new mongoose.Types.ObjectId().toString();
      mockGetAuthPayload.mockResolvedValue({ 
        userId: 'user1', 
        name: 'Test Admin', 
        normalizedRoles: ['Admin'] 
      } as any);

      mockRunInTransaction.mockImplementation(async (callback) => {
        return callback({ hasEnded: false } as any);
      });

      const mockSale = createMockSale(saleId);

      mockInstallmentSale.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockSale)
      });

      const req = new NextRequest(`http://localhost/api/sales/installments/${saleId}/payments`, {
        method: 'PUT',
        body: JSON.stringify({
          installmentNumber: 2,
          action: 'edit',
          amount: 2500,
          dueDate: '2026-08-15',
          notes: 'Adjusted schedule',
        }),
      });

      const res = await PUT(req, { params: Promise.resolve({ id: saleId }) });
      expect(res.status).toBe(200);
      expect(mockSale.paymentSchedule[1].amount).toBe(2500);
    });
  });

  describe('DELETE /api/sales/installments/[id]/payments', () => {
    it('successfully reverts payment via DELETE request', async () => {
      const saleId = new mongoose.Types.ObjectId().toString();
      mockGetAuthPayload.mockResolvedValue({ 
        userId: 'user1', 
        name: 'Test Admin', 
        normalizedRoles: ['Admin'] 
      } as any);

      mockRunInTransaction.mockImplementation(async (callback) => {
        return callback({ hasEnded: false } as any);
      });

      const mockSale = createMockSale(saleId, {
        totalPaid: 2000,
        remainingAmount: 4000,
        paymentSchedule: [
          { installmentNumber: 1, status: 'Paid', dueDate: new Date('2026-07-01'), amount: 2000, paidAmount: 2000, lateFee: 0 },
          { installmentNumber: 2, status: 'Pending', dueDate: new Date('2026-08-01'), amount: 2000 },
        ]
      });

      mockInstallmentSale.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockSale)
      });

      mockTransaction.updateMany.mockResolvedValue({ modifiedCount: 1 });

      const req = new NextRequest(`http://localhost/api/sales/installments/${saleId}/payments?installmentNumber=1`, {
        method: 'DELETE',
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: saleId }) });
      expect(res.status).toBe(200);
      expect(mockSale.totalPaid).toBe(0);
      expect(mockSale.remainingAmount).toBe(6000);
      expect(mockTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ referenceId: saleId }),
        { $set: { isDeleted: true } },
        expect.anything()
      );
    });
  });
});

