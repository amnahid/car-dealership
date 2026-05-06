import { GET, POST } from '@/app/api/suppliers/route';
import { NextRequest } from 'next/server';
import Supplier from '@/models/Supplier';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import mongoose from 'mongoose';

jest.mock('@/lib/db');
jest.mock('@/models/Supplier', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));
jest.mock('@/models/CarPurchase', () => ({
  __esModule: true,
  default: {
    aggregate: jest.fn().mockResolvedValue([]),
  },
}));
jest.mock('@/lib/apiAuth');
jest.mock('@/lib/activityLogger');
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

const mockSupplier = Supplier as jest.Mocked<any>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;
const mockLogActivity = logActivity as jest.MockedFunction<typeof logActivity>;

describe('Suppliers API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/suppliers', () => {
    it('returns suppliers list on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin' } as any);
      
      const mockResult = [{ companyName: 'Test Supplier', _id: new mongoose.Types.ObjectId() }];
      
      const queryMock: any = {};
      queryMock.select = jest.fn().mockReturnValue(queryMock);
      queryMock.sort = jest.fn().mockReturnValue(queryMock);
      queryMock.limit = jest.fn().mockReturnValue(queryMock);
      queryMock.lean = jest.fn().mockResolvedValue(mockResult);
      
      mockSupplier.find.mockReturnValue(queryMock);

      const req = new NextRequest('http://localhost/api/suppliers?list=true');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.suppliers).toHaveLength(1);
    });
  });

  describe('POST /api/suppliers', () => {
    it('creates a supplier on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', userId: 'adminid', name: 'Admin' } as any);
      const supplierData = { companyName: 'Test Supplier', companyNumber: '123', phone: '123456' };
      mockSupplier.findOne.mockResolvedValue(null);
      mockSupplier.create.mockResolvedValue({ _id: 'supid', ...supplierData });

      const req = new NextRequest('http://localhost/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplierData),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(mockLogActivity).toHaveBeenCalled();
    });
  });
});
