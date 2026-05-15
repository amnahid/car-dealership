import { canAccessApiPath, isPublicApiPath, normalizeRoles, canAccessDashboardPath } from '../../../src/lib/rbac';

describe('rbac.ts', () => {
  describe('normalizeRoles', () => {
    it('normalizes a single role string', () => {
      expect(normalizeRoles('Admin')).toEqual(['Admin']);
    });

    it('normalizes a legacy role string', () => {
      expect(normalizeRoles('Manager')).toEqual(['Car Manager']);
    });

    it('normalizes an array of roles and legacy roles', () => {
      expect(normalizeRoles(['Admin', 'Manager', 'InvalidRole'])).toEqual(['Admin', 'Car Manager']);
    });

    it('returns empty array for null/undefined/invalid input', () => {
      expect(normalizeRoles(null)).toEqual([]);
      expect(normalizeRoles(undefined)).toEqual([]);
      expect(normalizeRoles('Invalid')).toEqual([]);
    });

    it('ensures unique roles in the output', () => {
      expect(normalizeRoles(['Admin', 'Admin', 'Admin'])).toEqual(['Admin']);
    });
  });

  describe('canAccessDashboardPath', () => {
    it('allows access to root dashboard for any role', () => {
      expect(canAccessDashboardPath('Sales Person', '/dashboard')).toBe(true);
    });

    it('allows access if any of the user roles match the required roles', () => {
      expect(canAccessDashboardPath(['Sales Person', 'Car Manager'], '/dashboard/cars')).toBe(true);
      expect(canAccessDashboardPath(['Sales Person', 'Car Manager'], '/dashboard/sales')).toBe(true);
    });

    it('denies access if none of the user roles match the required roles', () => {
      expect(canAccessDashboardPath(['Sales Person'], '/dashboard/admin')).toBe(false);
    });

    it('allows Admin access to everything', () => {
      expect(canAccessDashboardPath('Admin', '/dashboard/admin')).toBe(true);
      expect(canAccessDashboardPath('Admin', '/dashboard/unknown')).toBe(true);
    });
  });

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

    it('allows access if any of multiple user roles match', () => {
      expect(canAccessApiPath(['Sales Person', 'Car Manager'], '/api/cars', 'GET')).toBe(true);
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
