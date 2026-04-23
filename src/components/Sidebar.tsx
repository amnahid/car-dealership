'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';

interface SidebarProps {
  userRole: string;
}

interface MenuItem {
  href?: string;
  label: string;
  icon: string;
  roles: string[];
  children?: MenuItem[];
}

const navItems: MenuItem[] = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', 
    roles: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'] 
  },
  {
    label: 'Car',
    icon: 'M5 17h14v-5H5v5zm2-4h10v3H7v-3zm0-4h10v2H7V9z',
    roles: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'],
    children: [
      { href: '/dashboard/cars', label: 'All Cars', icon: '', roles: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'] },
      { href: '/dashboard/cars/suppliers', label: 'Suppliers', icon: '', roles: ['Admin', 'Manager'] },
      { href: '/dashboard/cars/purchases', label: 'Purchases', icon: '', roles: ['Admin', 'Manager', 'Accounts Officer'] },
      { href: '/dashboard/repairs', label: 'Repairs', icon: '', roles: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'] },
      { href: '/dashboard/cars/stock', label: 'Stock', icon: '', roles: ['Admin', 'Manager', 'Accounts Officer'] },
      { href: '/dashboard/documents', label: 'Documents', icon: '', roles: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'] },
    ]
  },
  {
    label: 'Sales',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    roles: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'],
    children: [
      { href: '/dashboard/sales', label: 'All Sales', icon: '', roles: ['Admin', 'Manager', 'Accounts Officer', 'Sales Agent'] },
      { href: '/dashboard/sales/cash', label: 'Cash Sales', icon: '', roles: ['Admin', 'Manager', 'Sales Agent'] },
      { href: '/dashboard/sales/installments', label: 'Installments', icon: '', roles: ['Admin', 'Manager', 'Accounts Officer'] },
      { href: '/dashboard/sales/rentals', label: 'Rentals', icon: '', roles: ['Admin', 'Manager', 'Sales Agent'] },
      { href: '/dashboard/sales/returns', label: 'Purchase Returns', icon: '', roles: ['Admin', 'Manager'] },
      { href: '/dashboard/sales/invoices', label: 'Invoice Manager', icon: '', roles: ['Admin', 'Manager', 'Accounts Officer'] },
    ]
  },
  {
    label: 'Finance',
    icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2v-5a2 2 0 00-2-2H7a2 2 0 00-2 2v5a2 2 0 002 2z',
    roles: ['Admin', 'Manager', 'Accounts Officer'],
    children: [
      { href: '/dashboard/finance', label: 'Transactions', icon: '', roles: ['Admin', 'Manager', 'Accounts Officer'] },
      { href: '/dashboard/finance/expenses', label: 'Expenses', icon: '', roles: ['Admin', 'Manager', 'Accounts Officer'] },
      { href: '/dashboard/finance/incomes', label: 'Incomes', icon: '', roles: ['Admin', 'Manager', 'Accounts Officer'] },
      { href: '/dashboard/finance/reports', label: 'Reports', icon: '', roles: ['Admin', 'Manager', 'Accounts Officer'] },
    ]
  },
  
  {
    label: 'CRM',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    roles: ['Admin', 'Manager', 'Sales Agent'],
    children: [
      { href: '/dashboard/customers', label: 'Customers', icon: '', roles: ['Admin', 'Manager', 'Sales Agent'] },
    ]
  },
  {
    label: 'HRM',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    roles: ['Admin', 'Manager'],
    children: [
      { href: '/dashboard/employees', label: 'Employees', icon: '', roles: ['Admin', 'Manager'] },
      { href: '/dashboard/salary-payments', label: 'Salary Payments', icon: '', roles: ['Admin', 'Manager', 'Accounts Officer'] },
    ]
  },
  {
    label: 'Administration',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    roles: ['Admin'],
    children: [
      { href: '/dashboard/users', label: 'Users', icon: '', roles: ['Admin'] },
      { href: '/dashboard/activity-logs', label: 'Activity Logs', icon: '', roles: ['Admin', 'Manager'] },
    ]
  },
];

function filterMenuItems(items: MenuItem[], role: string): MenuItem[] {
  return items
    .filter(item => item.roles.includes(role))
    .map(item => {
      if (item.children) {
        return { ...item, children: filterMenuItems(item.children, role) };
      }
      return item;
    });
}

function SubMenu({ 
  children, 
  isOpen 
}: { 
  children: React.ReactNode; 
  isOpen: boolean;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      if (isOpen) {
        const scrollHeight = ref.current.scrollHeight;
        setHeight(scrollHeight);
      } else {
        setHeight(0);
      }
    }
  }, [isOpen]);

  return (
    <ul
      ref={ref}
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        height: height,
        backgroundColor: '#fafbfc',
        transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </ul>
  );
}

function isPathActive(href: string | undefined, pathname: string): boolean {
    if (!href) return false;
    if (href === '/dashboard') return pathname === '/dashboard';
    const hrefParts = href.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);
    if (hrefParts.length !== pathParts.length) return false;
    return pathname === href;
  }

  function MenuItemComponent({ 
  item, 
  pathname, 
  openMenus, 
  toggleMenu,
  depth = 0,
  index = 0
}: { 
  item: MenuItem; 
  pathname: string; 
  openMenus: Set<string>;
  toggleMenu: (label: string) => void;
  depth?: number;
  index?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isOpen = openMenus.has(item.label);
  const isActive = isPathActive(item.href, pathname);

  const getBackgroundColor = () => {
    if (isActive) return '#28aaa9';
    if (isHovered) return '#f0f4f4';
    return 'transparent';
  };

  const getTextColor = () => {
    if (isActive) return '#ffffff';
    return '#555582';
  };

  return (
    <li style={{ marginBottom: depth === 0 ? '4px' : '0' }}>
      {hasChildren ? (
        <>
          <button
            onClick={() => toggleMenu(item.label)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: depth === 0 ? '12px 20px' : '10px 20px 10px 28px',
              fontSize: depth === 0 ? '16px' : '14px',
              fontFamily: '"Sarabun", sans-serif',
              color: getTextColor(),
              backgroundColor: getBackgroundColor(),
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{
                  transition: 'transform 0.2s ease',
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                <path d={item.icon}></path>
              </svg>
              <span style={{ fontWeight: isOpen ? 600 : 400 }}>{item.label}</span>
            </div>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{
                transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isHovered ? 1 : 0.7,
              }}
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          {isOpen && (
            <SubMenu isOpen={isOpen}>
              {item.children!.map((child, idx) => (
                <MenuItemComponent
                  key={child.href || child.label}
                  item={child}
                  pathname={pathname}
                  openMenus={openMenus}
                  toggleMenu={toggleMenu}
                  depth={depth + 1}
                  index={idx}
                />
              ))}
            </SubMenu>
          )}
        </>
      ) : item.href ? (
        <Link
          href={item.href}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: depth === 0 ? '12px 20px' : '10px 20px 10px 28px',
            fontSize: depth === 0 ? '16px' : '14px',
            fontFamily: '"Sarabun", sans-serif',
            color: getTextColor(),
            backgroundColor: getBackgroundColor(),
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            position: 'relative',
            borderLeft: isActive ? '3px solid #1e8e8d' : '3px solid transparent',
            animation: isActive ? 'none' : `fadeSlideIn 0.3s ease ${index * 0.05}s both`,
          }}
        >
          <span style={{ 
            position: 'absolute', 
            left: 0, 
            top: 0, 
            bottom: 0, 
            width: '3px', 
            backgroundColor: '#1e8e8d',
            transform: isActive ? 'scaleY(1)' : 'scaleY(0)',
            transformOrigin: 'top',
            transition: 'transform 0.2s ease',
          }} />
          <span style={{ position: 'relative', zIndex: 1 }}>{item.label}</span>
        </Link>
      ) : null}
    </li>
  );
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  const filteredItems = filterMenuItems(navItems, userRole);

  useEffect(() => {
    const parentMenus = new Set<string>();
    const pathParts = pathname.split('/').filter(Boolean);
    
    const findParentMenus = (items: MenuItem[], parentLabel?: string) => {
      for (const item of items) {
        if (item.children) {
          for (const child of item.children) {
            if (child.href && pathname.startsWith(child.href)) {
              parentMenus.add(item.label);
              break;
            }
          }
          findParentMenus(item.children, item.label);
        }
      }
    };
    
    findParentMenus(navItems);
    
    if (parentMenus.size > 0) {
      setOpenMenus(prev => new Set([...prev, ...parentMenus]));
    }
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '260px',
        height: '100vh',
        background: '#ffffff',
        borderRight: '1px solid #e9ecef',
        boxShadow: '1px 0px 10px 0px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 101,
        overflow: 'hidden',
      }}
    >
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        .logout-btn:hover {
          background-color: #fff5f5 !important;
          color: #dc3545 !important;
        }
        .logout-btn:hover svg {
          transform: translateX(3px);
        }
        .logout-btn svg {
          transition: transform 0.3s ease;
        }
        nav::-webkit-scrollbar {
          width: 4px;
        }
        nav::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        nav::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 2px;
        }
        nav::-webkit-scrollbar-thumb:hover {
          background: #aaa;
        }
      `}</style>

      <div style={{ padding: '20px 24px', borderBottom: '1px solid #e9ecef' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Image
            src="/amyal-logo.png"
            alt="AMYAL CAR Logo"
            width={40}
            height={40}
            style={{ 
              borderRadius: '50%', 
              objectFit: 'cover',
              boxShadow: '0 2px 8px rgba(40, 170, 169, 0.3)',
            }}
          />
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#28aaa9', margin: 0 }}>AMYAL CAR</h1>
            <p style={{ fontSize: '11px', color: '#9ca8b3', marginTop: '2px' }}>Management System</p>
          </div>
        </div>
      </div>

      <nav style={{ 
        padding: '12px 0', 
        flex: 1, 
        overflow: 'auto',
        overflowX: 'hidden',
      }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {filteredItems.map((item, index) => (
            <MenuItemComponent
              key={item.label}
              item={item}
              pathname={pathname}
              openMenus={openMenus}
              toggleMenu={toggleMenu}
              index={index}
            />
          ))}
        </ul>
      </nav>

      <div style={{ borderTop: '1px solid #e9ecef' }}>
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
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fff5f5';
            (e.currentTarget as HTMLButtonElement).style.color = '#dc3545';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = '#555582';
          }}
        >
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
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