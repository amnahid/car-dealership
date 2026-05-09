import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return 'fallback-secret-change-in-production';
  }
  return secret;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  roles?: string[];
  name: string;
  passwordVersion: number;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, getSecret()) as JWTPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
