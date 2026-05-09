import { GET } from '@/app/api/activity-logs/route';
import { NextRequest } from 'next/server';
import ActivityLog from '@/models/ActivityLog';
import { getAuthPayload } from '@/lib/apiAuth';

jest.mock('@/lib/db');
jest.mock('@/models/ActivityLog', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));
jest.mock('@/lib/apiAuth');
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

const mockActivityLog = ActivityLog as jest.Mocked<any>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;

describe('Activity Logs API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/activity-logs', () => {
    it('returns logs list on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin', normalizedRoles: ['Admin'] } as any);
      mockActivityLog.countDocuments.mockResolvedValue(1);
      
      const queryMock: any = {};
      queryMock.sort = jest.fn().mockReturnValue(queryMock);
      queryMock.skip = jest.fn().mockReturnValue(queryMock);
      queryMock.limit = jest.fn().mockReturnValue(queryMock);
      queryMock.populate = jest.fn().mockResolvedValue([{ action: 'Login' }]);
      
      mockActivityLog.find.mockReturnValue(queryMock);

      const req = new NextRequest('http://localhost/api/activity-logs');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.logs).toHaveLength(1);
    });
  });
});
