import { GET, POST } from '@/app/api/salary-payments/route';
import { NextRequest } from 'next/server';
import SalaryPayment from '@/models/SalaryPayment';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import mongoose from 'mongoose';

jest.mock('@/lib/db');
jest.mock('@/models/SalaryPayment', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn().mockResolvedValue([]),
  },
}));
jest.mock('@/models/Employee', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));
jest.mock('@/models/Transaction');
jest.mock('@/lib/apiAuth');
jest.mock('@/lib/activityLogger');
jest.mock('@/lib/salaryNotifications');
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

const mockSalaryPayment = SalaryPayment as jest.Mocked<any>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;
const mockLogActivity = logActivity as jest.MockedFunction<typeof logActivity>;
const mockRunInTransaction = require('@/lib/db').runInTransaction as jest.MockedFunction<any>;

describe('Salary Payments API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/salary-payments', () => {
    it('returns salary payments list on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin' } as any);
      mockSalaryPayment.countDocuments.mockResolvedValue(1);
      
      const queryMock: any = {};
      queryMock.sort = jest.fn().mockReturnValue(queryMock);
      queryMock.skip = jest.fn().mockReturnValue(queryMock);
      queryMock.limit = jest.fn().mockReturnValue(queryMock);
      queryMock.lean = jest.fn().mockResolvedValue([{ employeeName: 'John Staff', amount: 3000 }]);
      
      mockSalaryPayment.find.mockReturnValue(queryMock);
      mockSalaryPayment.aggregate.mockResolvedValue([{ total: 3000 }]);

      const req = new NextRequest('http://localhost/api/salary-payments');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.payments).toHaveLength(1);
    });
  });

  describe('POST /api/salary-payments', () => {
    it('creates a salary payment on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', userId: 'adminid', name: 'Admin' } as any);
      const paymentData = { employee: new mongoose.Types.ObjectId().toString(), employeeId: 'EMP-001', employeeName: 'John Staff', amount: 3000, paymentDate: '2024-05-01', month: 5, year: 2024 };
      
      mockRunInTransaction.mockImplementation(async (callback: any) => {
        return callback({});
      });

      mockSalaryPayment.create.mockResolvedValue([{ _id: 'payid', ...paymentData }]);

      const req = new NextRequest('http://localhost/api/salary-payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(mockLogActivity).toHaveBeenCalled();
    });
  });
});
