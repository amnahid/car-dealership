import { NextRequest } from 'next/server';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
import { getAuthPayload } from '@/lib/apiAuth';
import { normalizeRole } from '@/lib/rbac';

jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

jest.mock('@/lib/db');
jest.mock('@/models/User');
jest.mock('@/lib/apiAuth');
jest.mock('@/lib/rbac');

import { GET } from '@/app/api/auth/me/route';

const mockUser = User as jest.Mocked<any>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockGetAuthPayload = getAuthPayload as jest.MockedFunction<typeof getAuthPayload>;
const mockNormalizeRole = normalizeRole as jest.MockedFunction<typeof normalizeRole>;

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if unauthorized', async () => {
    mockGetAuthPayload.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/auth/me');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 if user not found', async () => {
    mockGetAuthPayload.mockResolvedValue({ userId: 'userid' } as any);
    mockUser.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as any);

    const req = new NextRequest('http://localhost/api/auth/me');
    const res = await GET(req);

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('User not found');
  });

  it('returns user data on success', async () => {
    const user = {
      _id: 'userid',
      name: 'Test User',
      email: 'test@example.com',
      role: 'Admin',
      toObject: jest.fn().mockReturnValue({ _id: 'userid', name: 'Test User', email: 'test@example.com', role: 'Admin' }),
    };
    mockGetAuthPayload.mockResolvedValue({ userId: 'userid' } as any);
    mockUser.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    } as any);
    mockNormalizeRole.mockReturnValue('Admin');

    const req = new NextRequest('http://localhost/api/auth/me');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.name).toBe('Test User');
    expect(data.user.role).toBe('Admin');
  });

  it('updates legacy role if necessary', async () => {
    const user = {
      _id: 'userid',
      name: 'Test User',
      email: 'test@example.com',
      role: 'Manager',
      toObject: jest.fn().mockReturnValue({ _id: 'userid', name: 'Test User', email: 'test@example.com', role: 'Manager' }),
    };
    mockGetAuthPayload.mockResolvedValue({ userId: 'userid' } as any);
    mockUser.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    } as any);
    mockNormalizeRole.mockReturnValue('Car Manager');
    mockUser.updateOne.mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/auth/me');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockUser.updateOne).toHaveBeenCalledWith({ _id: 'userid' }, { $set: { role: 'Car Manager' } });
    const data = await res.json();
    expect(data.user.role).toBe('Car Manager');
  });
});
