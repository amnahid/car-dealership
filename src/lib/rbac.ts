export const USER_ROLES = [
  'Admin',
  'Sales Person',
  'Car Manager',
  'Accountant',
  'Finance Manager',
] as const;

export const ROLE_OPTIONS = [...USER_ROLES] as const;

export const LEGACY_USER_ROLES = ['Manager', 'Accounts Officer', 'Sales Agent'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type LegacyUserRole = (typeof LEGACY_USER_ROLES)[number];
export type KnownUserRole = UserRole | LegacyUserRole;

const LEGACY_ROLE_MAP: Record<LegacyUserRole, UserRole> = {
  Manager: 'Car Manager',
  'Accounts Officer': 'Accountant',
  'Sales Agent': 'Sales Person',
};

const ALL_ROLES: UserRole[] = [...USER_ROLES];
const SALES_ROLES: UserRole[] = ['Admin', 'Sales Person'];
const CAR_ROLES: UserRole[] = ['Admin', 'Car Manager'];
const FINANCE_ROLES: UserRole[] = ['Admin', 'Accountant', 'Finance Manager'];
const FINANCE_REPORT_ROLES: UserRole[] = ['Admin', 'Finance Manager'];
const FINANCE_AUDIT_ROLES: UserRole[] = ['Admin', 'Finance Manager'];
const EMPLOYEE_READ_ROLES: UserRole[] = ['Admin', 'Sales Person', 'Accountant', 'Finance Manager'];

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

interface AccessRule {
  prefix: string;
  roles: UserRole[];
  methods?: RequestMethod[];
}

const DASHBOARD_ACCESS_RULES: AccessRule[] = [
  { prefix: '/dashboard/profile', roles: ALL_ROLES },
  { prefix: '/dashboard/admin', roles: ['Admin'] },
  { prefix: '/dashboard/users', roles: ['Admin'] },
  { prefix: '/dashboard/activity-logs', roles: FINANCE_AUDIT_ROLES },
  { prefix: '/dashboard/notifications', roles: FINANCE_AUDIT_ROLES },
  { prefix: '/dashboard/cars', roles: CAR_ROLES },
  { prefix: '/dashboard/repairs', roles: CAR_ROLES },
  { prefix: '/dashboard/documents', roles: CAR_ROLES },
  { prefix: '/dashboard/sales', roles: SALES_ROLES },
  { prefix: '/dashboard/customers', roles: SALES_ROLES },
  { prefix: '/dashboard/finance/reports', roles: FINANCE_REPORT_ROLES },
  { prefix: '/dashboard/finance', roles: FINANCE_ROLES },
  { prefix: '/dashboard/salary-payments', roles: FINANCE_ROLES },
  { prefix: '/dashboard/employees', roles: FINANCE_ROLES },
];

const API_ACCESS_RULES: AccessRule[] = [
  { prefix: '/api/users', roles: ['Admin'] },
  { prefix: '/api/zatca/retry', roles: ['Admin', 'Finance Manager', 'Accountant'] },
  { prefix: '/api/zatca', roles: ['Admin'] },
  { prefix: '/api/seed', roles: ['Admin'] },
  { prefix: '/api/activity-logs', roles: FINANCE_AUDIT_ROLES },
  { prefix: '/api/notifications/logs', roles: FINANCE_AUDIT_ROLES },

  { prefix: '/api/cars/gps', methods: ['PUT', 'PATCH', 'DELETE', 'POST'], roles: ['Admin'] },
  { prefix: '/api/cars/gps', methods: ['GET'], roles: ['Admin', 'Car Manager', 'Sales Person'] },

  { prefix: '/api/cars/purchases', methods: ['GET'], roles: ['Admin', 'Car Manager', 'Accountant', 'Finance Manager'] },
  { prefix: '/api/cars/purchases', roles: CAR_ROLES },
  { prefix: '/api/cars/stats', roles: ALL_ROLES },
  { prefix: '/api/cars', methods: ['GET', 'OPTIONS'], roles: ['Admin', 'Car Manager', 'Sales Person', 'Accountant', 'Finance Manager'] },
  { prefix: '/api/cars', roles: CAR_ROLES },

  { prefix: '/api/suppliers', methods: ['GET'], roles: CAR_ROLES },
  { prefix: '/api/suppliers', roles: CAR_ROLES },

  { prefix: '/api/repairs', methods: ['GET'], roles: ['Admin', 'Car Manager', 'Accountant', 'Finance Manager'] },
  { prefix: '/api/repairs', roles: CAR_ROLES },

  { prefix: '/api/documents/expiring', methods: ['GET'], roles: ['Admin', 'Car Manager', 'Sales Person'] },
  { prefix: '/api/documents', methods: ['GET'], roles: ['Admin', 'Car Manager', 'Sales Person'] },
  { prefix: '/api/documents', roles: CAR_ROLES },

  { prefix: '/api/customers', roles: SALES_ROLES },
  { prefix: '/api/sales', roles: SALES_ROLES },

  { prefix: '/api/invoices', roles: ['Admin', 'Sales Person', 'Accountant', 'Finance Manager'] },

  { prefix: '/api/transactions', roles: FINANCE_ROLES },
  { prefix: '/api/reports/financial', roles: FINANCE_REPORT_ROLES },
  { prefix: '/api/reports/profit-per-car', roles: FINANCE_REPORT_ROLES },
  { prefix: '/api/reports/expenses', roles: FINANCE_ROLES },
  { prefix: '/api/reports/incomes', roles: FINANCE_ROLES },
  { prefix: '/api/reports', roles: FINANCE_REPORT_ROLES },
  { prefix: '/api/salary-payments', roles: FINANCE_ROLES },

  { prefix: '/api/employees', methods: ['GET'], roles: EMPLOYEE_READ_ROLES },
  { prefix: '/api/employees', roles: FINANCE_ROLES },

  { prefix: '/api/dashboard/stats', roles: ALL_ROLES },
  { prefix: '/api/upload', roles: ALL_ROLES },
];

const PUBLIC_API_PREFIXES = ['/api/auth', '/api/cron'] as const;

function isPathMatch(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;

  if ((USER_ROLES as readonly string[]).includes(role)) {
    return role as UserRole;
  }

  if ((LEGACY_USER_ROLES as readonly string[]).includes(role)) {
    return LEGACY_ROLE_MAP[role as LegacyUserRole];
  }

  return null;
}

export function isAssignableRole(role: string): role is UserRole {
  return (USER_ROLES as readonly string[]).includes(role);
}

export function isRoleAllowed(userRole: string | null | undefined, allowedRoles: string[]): boolean {
  const normalizedUserRole = normalizeRole(userRole);
  if (!normalizedUserRole) return false;

  return allowedRoles.some((allowedRole) => normalizeRole(allowedRole) === normalizedUserRole);
}

export function canAccessDashboardPath(role: UserRole, pathname: string): boolean {
  if (pathname === '/dashboard') {
    return true;
  }

  const matchingRule = DASHBOARD_ACCESS_RULES.find((rule) => isPathMatch(pathname, rule.prefix));
  if (!matchingRule) {
    return role === 'Admin';
  }

  return matchingRule.roles.includes(role);
}

export function canAccessApiPath(role: UserRole, pathname: string, method: string): boolean {
  const requestMethod = method.toUpperCase() as RequestMethod;

  const matchingRule = API_ACCESS_RULES.find((rule) => {
    if (!isPathMatch(pathname, rule.prefix)) {
      return false;
    }

    if (!rule.methods || rule.methods.length === 0) {
      return true;
    }

    return rule.methods.includes(requestMethod);
  });

  if (!matchingRule) {
    return false;
  }

  return matchingRule.roles.includes(role);
}

export function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => isPathMatch(pathname, prefix));
}
