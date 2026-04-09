'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  userRole: string;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'] },
  { href: '/dashboard/cars', label: 'Cars', icon: '🚗', roles: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'] },
  { href: '/dashboard/repairs', label: 'Repairs', icon: '🔧', roles: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'] },
  { href: '/dashboard/documents', label: 'Documents', icon: '📄', roles: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'] },
  { href: '/dashboard/users', label: 'Users', icon: '👥', roles: ['Admin'] },
  { href: '/dashboard/activity-logs', label: 'Activity Logs', icon: '📋', roles: ['Admin', 'Manager'] },
];

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
    router.refresh();
  };

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-indigo-900 text-white">
      <div className="px-6 py-5 border-b border-indigo-800">
        <h1 className="text-xl font-bold">🚗 NahidDealership</h1>
        <p className="text-xs text-indigo-300 mt-1">Management System</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-indigo-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-200 hover:bg-indigo-800 hover:text-white transition-colors"
        >
          <span>🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
