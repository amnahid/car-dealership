import { GET, POST } from '@/app/api/cars/route';
import { NextRequest } from 'next/server';
import Car from '@/models/Car';
import { connectDB, runInTransaction } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

jest.mock('@/lib/db');
jest.mock('@/models/Car', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    distinct: jest.fn(),
    findById: jest.fn(),
  },
}));
jest.mock('@/models/CarPurchase');
jest.mock('@/models/Transaction');
jest.mock('@/lib/apiAuth');
jest.mock('@/lib/activityLogger');
jest.mock('@/lib/tafweed', () => ({
  getTafweedStatus: jest.fn().mockReturnValue('None'),
}));
jest.mock('@/lib/syncDocuments', () => ({
  syncPurchaseDocuments: jest.fn(),
}));
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

const mockCar = Car as jest.Mocked<any>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockRunInTransaction = runInTransaction as jest.MockedFunction<typeof runInTransaction>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;
const mockLogActivity = logActivity as jest.MockedFunction<typeof logActivity>;

describe('Cars API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/cars', () => {
    it('returns 401 if unauthorized', async () => {
      mockGetAuthPayload.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/cars');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns 403 if role not allowed', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Invalid' } as any);
      const req = new NextRequest('http://localhost/api/cars');
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it('returns cars list on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin' } as any);
      mockCar.countDocuments.mockResolvedValue(1);
      mockCar.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                      lean: jest.fn().mockResolvedValue([{ carId: 'CAR-001', brand: 'Toyota' }]),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      const req = new NextRequest('http://localhost/api/cars');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.cars).toHaveLength(1);
      expect(data.pagination.total).toBe(1);
    });
  });

  describe('POST /api/cars', () => {
    it('creates a car without purchase', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', userId: 'adminid', name: 'Admin' } as any);
      const carData = { brand: 'Toyota', model: 'Camry', year: 2023, chassisNumber: 'CH123' };
      
      mockRunInTransaction.mockImplementation(async (callback) => {
        return callback({});
      });

      mockCar.create.mockResolvedValue([ { ...carData, _id: 'carid', carId: 'CAR-001' } ]);

      const req = new NextRequest('http://localhost/api/cars', {
        method: 'POST',
        body: JSON.stringify(carData),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(mockLogActivity).toHaveBeenCalled();
    });
  });
});
