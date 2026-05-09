import { GET, POST } from '@/app/api/documents/route';
import { NextRequest } from 'next/server';
import VehicleDocument from '@/models/Document';
import { getAuthPayload } from '@/lib/apiAuth';
import { logActivity } from '@/lib/activityLogger';

jest.mock('@/lib/db');
jest.mock('@/models/Document', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    insertMany: jest.fn(),
  },
}));
jest.mock('@/lib/apiAuth');
jest.mock('@/lib/activityLogger');
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

const mockDocument = VehicleDocument as jest.Mocked<any>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;
const mockLogActivity = logActivity as jest.MockedFunction<typeof logActivity>;

describe('Documents API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/documents', () => {
    it('returns 401 if unauthorized', async () => {
      mockGetAuthPayload.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/documents');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns documents list on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', normalizedRoles: ['Admin'] } as any);
      mockDocument.countDocuments.mockResolvedValue(1);
      mockDocument.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([{ documentType: 'Insurance' }]),
                }),
              }),
            }),
          }),
        }),
      } as any);

      const req = new NextRequest('http://localhost/api/documents');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.documents).toHaveLength(1);
    });
  });

  describe('POST /api/documents', () => {
    it('creates a document on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', normalizedRoles: ['Admin'], userId: 'adminid', name: 'Admin' } as any);
      const docData = { car: 'carid', carId: 'CAR-001', documentType: 'Insurance', issueDate: '2024-01-01', expiryDate: '2025-01-01' };
      mockDocument.create.mockResolvedValue({ _id: 'docid', ...docData });

      const req = new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(docData),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(mockLogActivity).toHaveBeenCalled();
    });
  });
});
