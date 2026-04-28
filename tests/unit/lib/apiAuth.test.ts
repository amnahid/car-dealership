import { jwtVerify } from 'jose';
import { getAuthPayload } from '../../../src/lib/apiAuth';
import { connectDB } from '../../../src/lib/db';
import User from '../../../src/models/User';

jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  connectDB: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

type MockRequest = {
  cookies: {
    get: (name: string) => { value: string } | undefined;
  };
};

const mockJwtVerify = jwtVerify as jest.MockedFunction<typeof jwtVerify>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockFindById = User.findById as jest.MockedFunction<typeof User.findById>;

describe('apiAuth.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue({} as never);
  });

  it('returns null when token is missing', async () => {
    const request: MockRequest = {
      cookies: {
        get: () => undefined,
      },
    };

    const result = await getAuthPayload(request as unknown as Parameters<typeof getAuthPayload>[0]);
    expect(result).toBeNull();
  });

  it('returns null for inactive users', async () => {
    const request: MockRequest = {
      cookies: {
        get: () => ({ value: 'token' }),
      },
    };

    mockJwtVerify.mockResolvedValue({
      payload: { userId: '507f1f77bcf86cd799439011', passwordVersion: 3 },
      protectedHeader: {},
      key: null,
    } as never);

    mockFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        email: 'user@example.com',
        name: 'User',
        role: 'Sales Person',
        isActive: false,
        passwordVersion: 3,
      }),
    } as never);

    const result = await getAuthPayload(request as unknown as Parameters<typeof getAuthPayload>[0]);
    expect(result).toBeNull();
  });

  it('returns null when password version does not match', async () => {
    const request: MockRequest = {
      cookies: {
        get: () => ({ value: 'token' }),
      },
    };

    mockJwtVerify.mockResolvedValue({
      payload: { userId: '507f1f77bcf86cd799439011', passwordVersion: 2 },
      protectedHeader: {},
      key: null,
    } as never);

    mockFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        email: 'user@example.com',
        name: 'User',
        role: 'Sales Person',
        isActive: true,
        passwordVersion: 3,
      }),
    } as never);

    const result = await getAuthPayload(request as unknown as Parameters<typeof getAuthPayload>[0]);
    expect(result).toBeNull();
  });

  it('returns normalized payload for valid active sessions', async () => {
    const request: MockRequest = {
      cookies: {
        get: () => ({ value: 'token' }),
      },
    };

    mockJwtVerify.mockResolvedValue({
      payload: { userId: '507f1f77bcf86cd799439011', passwordVersion: 3 },
      protectedHeader: {},
      key: null,
    } as never);

    mockFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        email: 'user@example.com',
        name: 'User',
        role: 'Manager',
        isActive: true,
        passwordVersion: 3,
      }),
    } as never);

    const result = await getAuthPayload(request as unknown as Parameters<typeof getAuthPayload>[0]);
    expect(result).toEqual({
      userId: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      role: 'Car Manager',
      normalizedRole: 'Car Manager',
      name: 'User',
      passwordVersion: 3,
    });
  });
});
