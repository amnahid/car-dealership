import { POST } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger';
import { normalizeRoles } from '@/lib/rbac';

jest.mock('@/lib/db');
jest.mock('@/models/User');
jest.mock('@/lib/auth');
jest.mock('@/lib/activityLogger');
jest.mock('@/lib/rbac');

const mockUser = User as jest.Mocked<any>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;
const mockSignToken = signToken as jest.MockedFunction<typeof signToken>;
const mockLogActivity = logActivity as jest.MockedFunction<typeof logActivity>;
const mockNormalizeRoles = normalizeRoles as jest.MockedFunction<typeof normalizeRoles>;

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 if email or password missing', async () => {
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Email and password are required');
  });

  it('returns 401 for non-existent user', async () => {
    mockUser.findOne.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com', password: 'password' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Invalid credentials');
  });

  it('returns 401 for incorrect password', async () => {
    mockUser.findOne.mockResolvedValue({
      email: 'test@example.com',
      password: 'hashedpassword',
      isActive: true,
    });
    mockComparePassword.mockResolvedValue(false);

    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Invalid credentials');
  });

  it('returns 403 if role is invalid', async () => {
    mockUser.findOne.mockResolvedValue({
      _id: 'userid',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'InvalidRole',
      isActive: true,
    });
    mockComparePassword.mockResolvedValue(true);
    mockNormalizeRoles.mockReturnValue([]);

    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Invalid role configuration');
  });

  it('returns 200 and sets cookie on successful login', async () => {
    const user = {
      _id: 'userid',
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'Test User',
      role: 'Admin',
      passwordVersion: 1,
      isActive: true,
    };
    mockUser.findOne.mockResolvedValue(user);
    mockComparePassword.mockResolvedValue(true);
    mockNormalizeRoles.mockReturnValue(['Admin']);
    mockSignToken.mockReturnValue('mocktoken');

    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.user.email).toBe('test@example.com');
    expect(data.user.role).toBe('Admin');
    expect(data.user.roles).toEqual(['Admin']);
    expect(res.cookies.get('auth-token')?.value).toBe('mocktoken');
    expect(mockLogActivity).toHaveBeenCalled();
  });
});
