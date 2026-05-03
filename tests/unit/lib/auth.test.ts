import {
  signToken,
  verifyToken,
  hashPassword,
  comparePassword,
  JWTPayload,
} from '../../../src/lib/auth';

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('auth.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signToken', () => {
    it('should sign a token with valid payload', async () => {
      const payload: JWTPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        name: 'Test User',
        passwordVersion: 1,
      };

      (mockJwt.sign as jest.Mock).mockReturnValue('mocked-token');

      const token = signToken(payload);

      expect(token).toBe('mocked-token');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        payload,
        expect.any(String),
        { expiresIn: '7d' }
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token and return payload', async () => {
      const payload: JWTPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        name: 'Test User',
        passwordVersion: 1,
      };

      (mockJwt.verify as jest.Mock).mockReturnValue(payload as any);

      const result = verifyToken('valid-token');

      expect(result).toEqual(payload);
      expect(mockJwt.verify).toHaveBeenCalledWith(
        'valid-token',
        expect.any(String)
      );
    });

    it('should throw on invalid token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await hashPassword('password123');

      expect(result).toBe('hashed-password');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await comparePassword('password123', 'hashed-password');

      expect(result).toBe(true);
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
    });

    it('should return false for non-matching password', async () => {
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await comparePassword('wrong-password', 'hashed-password');

      expect(result).toBe(false);
    });
  });
});