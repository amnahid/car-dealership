import { GET, POST } from '@/app/api/repairs/route';
import { NextRequest } from 'next/server';
import Repair from '@/models/Repair';
import Car from '@/models/Car';
import { connectDB, runInTransaction } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';
import mongoose from 'mongoose';

jest.mock('@/lib/db');
jest.mock('@/models/Repair', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
  },
}));
jest.mock('@/models/Car', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));
jest.mock('@/models/Transaction');
jest.mock('@/lib/apiAuth');
jest.mock('@/lib/activityLogger');
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

const mockRepair = Repair as jest.Mocked<any>;
const mockCar = Car as jest.Mocked<any>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;
const mockLogActivity = logActivity as jest.MockedFunction<typeof logActivity>;
const mockRunInTransaction = runInTransaction as jest.MockedFunction<typeof runInTransaction>;

describe('Repairs API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/repairs', () => {
    it('returns 401 if unauthorized', async () => {
      mockGetAuthPayload.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/repairs');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns repairs list on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin' } as any);
      mockRepair.countDocuments.mockResolvedValue(1);
      mockRepair.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([{ repairDescription: 'Oil Change' }]),
                }),
              }),
            }),
          }),
        }),
      } as any);

      const req = new NextRequest('http://localhost/api/repairs');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.repairs).toHaveLength(1);
    });
  });

  describe('POST /api/repairs', () => {
    it('creates a repair on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', userId: 'adminid', name: 'Admin' } as any);
      const validCarId = new mongoose.Types.ObjectId().toString();
      const repairData = { car: validCarId, carId: 'CAR-001', repairDescription: 'Oil change', repairDate: '2024-01-01', totalCost: 100 };
      
      mockRunInTransaction.mockImplementation(async (callback) => {
        return callback({});
      });

      mockCar.findById.mockReturnValue({ session: jest.fn().mockResolvedValue({ status: 'In Stock' }) } as any);
      mockRepair.create.mockResolvedValue([{ _id: 'repaid', ...repairData }]);
      mockRepair.aggregate.mockReturnValue({ session: jest.fn().mockResolvedValue([{ total: 100 }]) } as any);
      mockRepair.countDocuments.mockReturnValue({ session: jest.fn().mockResolvedValue(0) } as any);

      const req = new NextRequest('http://localhost/api/repairs', {
        method: 'POST',
        body: JSON.stringify(repairData),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(mockLogActivity).toHaveBeenCalled();
    });
  });
});
