import { RequestRateLimitError } from './errors';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Simple in-memory rate limit store
// Track: IP -> { count, resetTime }
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit: 1 request per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

export function checkRateLimit(ip: string): boolean {
  // Get current entry
  const entry = rateLimitStore.get(ip);

  // If no entry exists, allow
  if (!entry) {
    return true;
  }

  // Check if current time is past reset time
  const now = Date.now();
  if (now >= entry.resetTime) {
    // Reset entry
    rateLimitStore.delete(ip);
    return true;
  }

  // If within window and count >= limit, block
  if (entry.count >= 1) {
    return false;
  }

  return true;
}

export function recordRateLimit(ip: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry) {
    // Create new entry
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
  } else {
    // Increment count
    entry.count += 1;
  }
}

export async function enforceRateLimit(request: Request): Promise<void> {
  // Get IP from request
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  // Check rate limit
  if (!checkRateLimit(ip)) {
    throw new RequestRateLimitError('Too many requests. Please try again later.');
  }

  // Record request
  recordRateLimit(ip);
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);