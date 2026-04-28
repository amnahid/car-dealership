import { canAccessApiPath, isPublicApiPath } from '../../../src/lib/rbac';

describe('rbac.ts', () => {
  describe('canAccessApiPath', () => {
    it('denies unmatched protected API paths by default', () => {
      expect(canAccessApiPath('Sales Person', '/api/unknown/route', 'GET')).toBe(false);
    });

    it('allows authorized role for a configured API path', () => {
      expect(canAccessApiPath('Admin', '/api/seed', 'POST')).toBe(true);
    });

    it('denies unauthorized role for a configured API path', () => {
      expect(canAccessApiPath('Sales Person', '/api/users', 'GET')).toBe(false);
    });
  });

  describe('isPublicApiPath', () => {
    it('returns true for auth and cron API paths', () => {
      expect(isPublicApiPath('/api/auth/login')).toBe(true);
      expect(isPublicApiPath('/api/cron/check-expiry')).toBe(true);
    });

    it('returns false for protected API paths', () => {
      expect(isPublicApiPath('/api/users')).toBe(false);
    });
  });
});
