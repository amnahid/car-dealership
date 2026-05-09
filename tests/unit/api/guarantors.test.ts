import { GET, POST } from '@/app/api/guarantors/route';
import { NextRequest } from 'next/server';
import Guarantor from '@/models/Guarantor';
import { connectDB } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

jest.mock('@/lib/db');
jest.mock('@/models/Guarantor');
jest.mock('@/lib/apiAuth');
jest.mock('@/lib/activityLogger');
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

const mockGuarantor = Guarantor as jest.Mocked<any>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;
const mockLogActivity = logActivity as jest.MockedFunction<typeof logActivity>;

describe('Guarantors API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/guarantors', () => {
    it('returns 401 if unauthorized', async () => {
      mockGetAuthPayload.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/guarantors');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns 403 if user role is not allowed', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Car Manager', normalizedRoles: ['Car Manager'] } as any);
      const req = new NextRequest('http://localhost/api/guarantors');
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it('returns guarantors list on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', normalizedRoles: ['Admin'] } as any);
      mockGuarantor.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([{ fullName: 'Jane Doe' }]),
            }),
          }),
        }),
      } as any);
      mockGuarantor.countDocuments.mockResolvedValue(1);

      const req = new NextRequest('http://localhost/api/guarantors');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.guarantors).toHaveLength(1);
      expect(data.pagination.total).toBe(1);
    });
  });

  describe('POST /api/guarantors', () => {
    it('returns 400 if required fields are missing', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', normalizedRoles: ['Admin'], userId: 'adminid', name: 'Admin' } as any);
      const req = new NextRequest('http://localhost/api/guarantors', {
        method: 'POST',
        body: JSON.stringify({ fullName: 'Jane Doe' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('creates a new guarantor on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', normalizedRoles: ['Admin'], userId: 'adminid', name: 'Admin' } as any);
      const guarantorData = {
        fullName: 'Jane Doe',
        phone: '987654321',
        nationalId: '0987654321',
        buildingNumber: '10',
        streetName: 'Side St',
        district: 'East',
        city: 'Jeddah',
        postalCode: '54321',
      };
      mockGuarantor.create.mockResolvedValue({ _id: 'guarid', ...guarantorData });

      const req = new NextRequest('http://localhost/api/guarantors', {
        method: 'POST',
        body: JSON.stringify(guarantorData),
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
      expect(mockGuarantor.create).toHaveBeenCalled();
      expect(mockLogActivity).toHaveBeenCalled();
    });
  });
});
