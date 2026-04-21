'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  userRole: string;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', roles: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'] },
  { href: '/dashboard/cars', label: 'Cars', icon: 'M5 17h14v-5H5v5zm2-4h10v3H7v-3zm0-4h10v2H7V9z', roles: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'] },
  { href: '/dashboard/customers', label: 'Customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', roles: ['Admin', 'Manager', 'Sales Agent'] },
  { href: '/dashboard/sales/cash', label: 'Cash Sales', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['Admin', 'Manager', 'Sales Agent'] },
  { href: '/dashboard/sales/installments', label: 'Installments', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z', roles: ['Admin', 'Manager', 'Accounts Officer'] },
  { href: '/dashboard/sales/rentals', label: 'Rentals', icon: 'M8 7h8m-8 4h8m-4 8v4m-4-4h8m-4-8v4m-4-4h8m-4-8v4', roles: ['Admin', 'Manager', 'Sales Agent'] },
  { href: '/dashboard/repairs', label: 'Repairs', icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', roles: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'] },
  { href: '/dashboard/documents', label: 'Documents', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', roles: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'] },
  { href: '/dashboard/employees', label: 'Employees', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', roles: ['Admin', 'Manager'] },
  { href: '/dashboard/finance', label: 'Finance', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2v-5a2 2 0 00-2-2H7a2 2 0 00-2 2v5a2 2 0 002 2z', roles: ['Admin', 'Manager', 'Accounts Officer'] },
  { href: '/dashboard/users', label: 'Users', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', roles: ['Admin'] },
  { href: '/dashboard/activity-logs', label: 'Activity Logs', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2', roles: ['Admin', 'Manager'] },
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
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '240px',
        height: '100vh',
        background: '#ffffff',
        borderRight: '1px solid #e9ecef',
        boxShadow: '1px 0px 10px 0px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 101,
      }}
    >
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #e9ecef' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Image
            src="/amyal-logo.png"
            alt="AMYAL CAR Logo"
            width={40}
            height={40}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#28aaa9', margin: 0 }}>AMYAL CAR</h1>
            <p style={{ fontSize: '11px', color: '#9ca8b3', marginTop: '2px' }}>Management System</p>
          </div>
        </div>
      </div>

      <nav style={{ padding: '12px 0' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <li key={item.href} style={{ marginBottom: '4px' }}>
                <Link
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    fontSize: '16px',
                    fontFamily: '"Sarabun", sans-serif',
                    color: isActive ? '#ffffff' : '#555582',
                    backgroundColor: isActive ? '#28aaa9' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.5s ease',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon}></path>
                  </svg>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div style={{ borderTop: '1px solid #e9ecef', marginTop: 'auto' }}>
        <button
          onClick={handleLogout}
          className="logout-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 20px',
            fontSize: '16px',
            fontFamily: '"Sarabun", sans-serif',
            color: '#555582',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.5s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}