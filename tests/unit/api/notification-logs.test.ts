import { GET } from '@/app/api/notifications/logs/route';
import { NextRequest } from 'next/server';
import { getAuthPayload } from '@/lib/apiAuth';
import { getNotificationLogs } from '@/lib/notificationLogger';

jest.mock('@/lib/db');
jest.mock('@/lib/apiAuth');
jest.mock('@/lib/notificationLogger');
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;
const mockGetNotificationLogs = getNotificationLogs as jest.MockedFunction<typeof getNotificationLogs>;

describe('Notification Logs API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notifications/logs', () => {
    it('returns logs list on success', async () => {
      mockGetAuthPayload.mockResolvedValue({ normalizedRole: 'Admin' } as any);
      mockGetNotificationLogs.mockResolvedValue({
        logs: [{ subject: 'Test' } as any],
        pagination: { total: 1, page: 1, limit: 20, pages: 1 },
      });

      const req = new NextRequest('http://localhost/api/notifications/logs');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.logs).toHaveLength(1);
    });
  });
});
