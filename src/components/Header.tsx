'use client';

import { useState } from 'react';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import { useLocale, useTranslations } from 'next-intl';

interface HeaderProps {
  userName: string;
  userRole: string;
  userEmail?: string;
  userAvatar?: string;
}

export default function Header({ userName, userRole, userEmail = '', userAvatar }: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const t = useTranslations('Header');

  return (
    <header
      className="no-print"
      style={{
        position: 'fixed',
        top: 0,
        left: isRtl ? 0 : '260px',
        right: isRtl ? '260px' : 0,
        height: '70px',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0px 5px 13px -8px rgba(0,0,0,0.05)',
        zIndex: 100,
      }}
    >
      <div>
        {/* Left side space if needed */}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ borderRight: isRtl ? 'none' : '1px solid #eee', borderLeft: isRtl ? '1px solid #eee' : 'none', paddingRight: isRtl ? 0 : '16px', paddingLeft: isRtl ? '16px' : 0 }}>
             <LanguageSwitcher />
          </div>

          <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#2a3142', margin: 0 }}>{userName}</p>
            <p style={{ fontSize: '12px', color: '#9ca8b3', margin: '2px 0 0' }}>{userRole}</p>
          </div>
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#28aaa9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {userAvatar ? (
              <img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      </div>

      {showProfileMenu && (
        <>
          <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
            onClick={() => setShowProfileMenu(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '60px',
              right: isRtl ? 'auto' : '24px',
              left: isRtl ? '24px' : 'auto',
              background: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              padding: '8px 0',
              minWidth: '180px',
              zIndex: 101,
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: isRtl ? 'right' : 'left' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#2a3142', margin: 0 }}>{userName}</p>
              <p style={{ fontSize: '12px', color: '#9ca8b3', margin: '4px 0 0' }}>{userRole}</p>
            </div>
            <a
              href="/dashboard/profile"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '10px 16px', 
                fontSize: '14px', 
                color: '#2a3142', 
                textDecoration: 'none',
                textAlign: isRtl ? 'right' : 'left',
                flexDirection: isRtl ? 'row-reverse' : 'row',
                justifyContent: 'flex-end'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              {t('editProfile')}
            </a>
          </div>
        </>
      )}
    </header>
  );
}
