'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface SidebarProps {
  userRole: string;
}

interface MenuItem {
  href?: string;
  labelKey: string;
  icon: string;
  roles: string[];
  children?: MenuItem[];
}

const navItems: MenuItem[] = [
  { 
    href: '/dashboard', 
    labelKey: 'dashboard', 
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', 
    roles: ['Admin', 'Sales Person', 'Car Manager', 'Accountant', 'Finance Manager'] 
  },
  {
    labelKey: 'car',
    icon: 'M5 17h14v-5H5v5zm2-4h10v3H7v-3zm0-4h10v2H7V9z',
    roles: ['Admin', 'Car Manager'],
    children: [
      { href: '/dashboard/cars', labelKey: 'allCars', icon: '', roles: ['Admin', 'Car Manager'] },
      { href: '/dashboard/cars/suppliers', labelKey: 'suppliers', icon: '', roles: ['Admin', 'Car Manager'] },
      { href: '/dashboard/cars/purchases', labelKey: 'purchases', icon: '', roles: ['Admin', 'Car Manager'] },
      { href: '/dashboard/repairs', labelKey: 'repairs', icon: '', roles: ['Admin', 'Car Manager'] },
      { href: '/dashboard/cars/stock', labelKey: 'stock', icon: '', roles: ['Admin', 'Car Manager'] },
      { href: '/dashboard/documents', labelKey: 'documents', icon: '', roles: ['Admin', 'Car Manager'] },
    ]
  },
  {
    labelKey: 'sales',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    roles: ['Admin', 'Sales Person'],
    children: [
      { href: '/dashboard/sales', labelKey: 'allSales', icon: '', roles: ['Admin', 'Sales Person'] },
      { href: '/dashboard/sales/cash', labelKey: 'cashSales', icon: '', roles: ['Admin', 'Sales Person'] },
      { href: '/dashboard/sales/installments', labelKey: 'installments', icon: '', roles: ['Admin', 'Sales Person'] },
      { href: '/dashboard/sales/rentals', labelKey: 'rentals', icon: '', roles: ['Admin', 'Sales Person'] },
      { href: '/dashboard/sales/returns', labelKey: 'purchaseReturns', icon: '', roles: ['Admin', 'Sales Person'] },
      { href: '/dashboard/sales/invoices', labelKey: 'invoiceManager', icon: '', roles: ['Admin', 'Sales Person'] },
    ]
  },
  {
    labelKey: 'finance',
    icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2v-5a2 2 0 00-2-2H7a2 2 0 00-2 2v5a2 2 0 002 2z',
    roles: ['Admin', 'Accountant', 'Finance Manager'],
    children: [
      { href: '/dashboard/finance', labelKey: 'transactions', icon: '', roles: ['Admin', 'Accountant', 'Finance Manager'] },
      { href: '/dashboard/finance/expenses', labelKey: 'expenses', icon: '', roles: ['Admin', 'Accountant', 'Finance Manager'] },
      { href: '/dashboard/finance/incomes', labelKey: 'incomes', icon: '', roles: ['Admin', 'Accountant', 'Finance Manager'] },
      { href: '/dashboard/finance/reports', labelKey: 'reports', icon: '', roles: ['Admin', 'Finance Manager'] },
    ]
  },
  {
    labelKey: 'crm',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    roles: ['Admin', 'Sales Person'],
    children: [
      { href: '/dashboard/customers', labelKey: 'customers', icon: '', roles: ['Admin', 'Sales Person'] },
    ]
  },
  {
    labelKey: 'hrm',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    roles: ['Admin', 'Accountant', 'Finance Manager'],
    children: [
      { href: '/dashboard/employees', labelKey: 'employees', icon: '', roles: ['Admin', 'Accountant', 'Finance Manager'] },
      { href: '/dashboard/salary-payments', labelKey: 'salaryPayments', icon: '', roles: ['Admin', 'Accountant', 'Finance Manager'] },
    ]
  },
  {
    labelKey: 'administration',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    roles: ['Admin', 'Finance Manager'],
    children: [
      { href: '/dashboard/users', labelKey: 'users', icon: '', roles: ['Admin'] },
      { href: '/dashboard/activity-logs', labelKey: 'activityLogs', icon: '', roles: ['Admin', 'Finance Manager'] },
      { href: '/dashboard/notifications', labelKey: 'notificationLogs', icon: '', roles: ['Admin', 'Finance Manager'] },
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
    
    // Exact match is always preferred
    if (pathname === href) return true;
    
    // For dashboard root, only match exact
    if (href === '/dashboard') return pathname === '/dashboard';
    
    // Check for sub-paths, but ensure we are not matching the base path 
    // when a more specific sibling path is available.
    // e.g., if we are at /dashboard/sales/cash, we want /dashboard/sales/cash to be active,
    // but /dashboard/sales should ONLY be active if we are exactly at /dashboard/sales
    // or at a detail page like /dashboard/sales/[id] that isn't covered by other menu items.
    
    // If the pathname starts with this href, check if it's a detail page (like [id])
    // or another specific submenu item.
    if (pathname.startsWith(href + '/')) {
      // If the current href is a base path like /dashboard/sales, 
      // we only want it active if the next segment is NOT one of its siblings.
      const subPath = pathname.substring(href.length + 1);
      
      // List of specific sub-segments that have their own menu items
      // This is a bit of a heuristic but works for most Next.js dashboard structures
      const siblingSubPaths = ['cash', 'installments', 'rentals', 'returns', 'invoices', 'suppliers', 'purchases', 'stock', 'expenses', 'incomes', 'reports'];
      
      const firstSegment = subPath.split('/')[0];
      if (siblingSubPaths.includes(firstSegment)) {
        return false;
      }
      
      return true;
    }
    
    return false;
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
  const t = useTranslations('Sidebar');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isOpen = openMenus.has(item.labelKey);
  
  // An item is active if its own href matches
  const isDirectlyActive = isPathActive(item.href, pathname);
  
  // A parent item is active if any of its children are active
  const isAnyChildActive = hasChildren && item.children!.some(child => 
    isPathActive(child.href, pathname) || (child.children && child.children.some(gChild => isPathActive(gChild.href, pathname)))
  );

  const isActive = isDirectlyActive || (hasChildren && isAnyChildActive);

  const getBackgroundColor = () => {
    if (isDirectlyActive) return '#28aaa9';
    if (isHovered) return '#f0f4f4';
    return 'transparent';
  };

  const getTextColor = () => {
    if (isDirectlyActive) return '#ffffff';
    if (isAnyChildActive) return '#28aaa9';
    return '#555582';
  };

  const paddingStart = depth === 0 ? '20px' : '28px';
  const paddingEnd = '20px';

  return (
    <li style={{ marginBottom: depth === 0 ? '4px' : '0' }}>
      {hasChildren ? (
        <>
          <button
            onClick={() => toggleMenu(item.labelKey)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingTop: depth === 0 ? '12px' : '10px',
              paddingBottom: depth === 0 ? '12px' : '10px',
              paddingLeft: isRtl ? paddingEnd : paddingStart,
              paddingRight: isRtl ? paddingStart : paddingEnd,
              fontSize: depth === 0 ? '16px' : '14px',
              color: getTextColor(),
              backgroundColor: getBackgroundColor(),
              border: 'none',
              cursor: 'pointer',
              textAlign: isRtl ? 'right' : 'left',
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
              <span style={{ fontWeight: isOpen ? 600 : 400 }}>{t(item.labelKey)}</span>
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
                transform: isOpen ? 'rotate(90deg)' : (isRtl ? 'rotate(180deg)' : 'rotate(0deg)'),
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
                  key={child.href || child.labelKey}
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
            paddingTop: depth === 0 ? '12px' : '10px',
            paddingBottom: depth === 0 ? '12px' : '10px',
            paddingLeft: isRtl ? paddingEnd : paddingStart,
            paddingRight: isRtl ? paddingStart : paddingEnd,
            fontSize: depth === 0 ? '16px' : '14px',
            color: getTextColor(),
            backgroundColor: getBackgroundColor(),
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            position: 'relative',
            borderLeft: (!isRtl && isActive) ? '3px solid #1e8e8d' : '3px solid transparent',
            borderRight: (isRtl && isActive) ? '3px solid #1e8e8d' : '3px solid transparent',
            animation: isActive ? 'none' : `fadeSlideIn${isRtl ? 'Rtl' : ''} 0.3s ease ${index * 0.05}s both`,
          }}
        >
          <span style={{ 
            position: 'absolute', 
            left: isRtl ? 'auto' : 0,
            right: isRtl ? 0 : 'auto',
            top: 0, 
            bottom: 0, 
            width: '3px', 
            backgroundColor: '#1e8e8d',
            transform: isActive ? 'scaleY(1)' : 'scaleY(0)',
            transformOrigin: 'top',
            transition: 'transform 0.2s ease',
          }} />
          <span style={{ position: 'relative', zIndex: 1 }}>{t(item.labelKey)}</span>
        </Link>
      ) : null}
    </li>
  );
}

export default function Sidebar({ userRole }: SidebarProps) {
  const t = useTranslations('Sidebar');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  const filteredItems = filterMenuItems(navItems, userRole);

  useEffect(() => {
    const parentMenus = new Set<string>();
    
    const findParentMenus = (items: MenuItem[]) => {
      for (const item of items) {
        if (item.children) {
          for (const child of item.children) {
            if (child.href && pathname.startsWith(child.href)) {
              parentMenus.add(item.labelKey);
              break;
            }
          }
          findParentMenus(item.children);
        }
      }
    };
    
    findParentMenus(navItems);
    
    if (parentMenus.size > 0) {
      setOpenMenus(prev => new Set([...prev, ...parentMenus]));
    }
  }, [pathname]);

  const toggleMenu = (labelKey: string) => {
    setOpenMenus(prev => {
      const next = new Set(prev);
      if (next.has(labelKey)) {
        next.delete(labelKey);
      } else {
        next.add(labelKey);
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
        left: isRtl ? 'auto' : 0,
        right: isRtl ? 0 : 'auto',
        width: '260px',
        height: '100vh',
        background: '#ffffff',
        borderRight: isRtl ? 'none' : '1px solid #e9ecef',
        borderLeft: isRtl ? '1px solid #e9ecef' : 'none',
        boxShadow: isRtl ? '-1px 0px 10px 0px rgba(0,0,0,0.05)' : '1px 0px 10px 0px rgba(0,0,0,0.05)',
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
        @keyframes fadeSlideInRtl {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .logout-btn:hover {
          background-color: #fff5f5 !important;
          color: #dc3545 !important;
        }
        .logout-btn:hover svg {
          transform: translateX(${isRtl ? '-3px' : '3px'});
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
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#28aaa9', margin: 0 }}>{commonT('appName')}</h1>
            <p style={{ fontSize: '11px', color: '#9ca8b3', marginTop: '2px' }}>{t('managementSystem')}</p>
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
              key={item.labelKey}
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
            color: '#555582',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: isRtl ? 'right' : 'left',
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
            style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }}
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          {t('logout')}
        </button>
      </div>
    </aside>
  );
}
