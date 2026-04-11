'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  userName: string;
  userRole: string;
  expiringDocsCount?: number;
  userEmail?: string;
  userAvatar?: string;
}

export default function Header({ userName, userRole, expiringDocsCount = 0, userEmail = '', userAvatar }: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: '240px',
        right: 0,
        height: '70px',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 24px',
        boxShadow: '0px 5px 13px -8px rgba(0,0,0,0.05)',
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {expiringDocsCount > 0 && (
          <a
            href="/dashboard/documents"
            style={{ position: 'relative', textDecoration: 'none' }}
          >
            <span style={{ fontSize: '20px', color: '#525f80' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </span>
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-8px',
                background: '#ec4561',
                color: '#ffffff',
                fontSize: '10px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {expiringDocsCount > 9 ? '9+' : expiringDocsCount}
            </span>
          </a>
        )}
        <div style={{ textAlign: 'right' }}>
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
              right: '24px',
              background: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              padding: '8px 0',
              minWidth: '180px',
              zIndex: 101,
            }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#2a3142', margin: 0 }}>{userName}</p>
              <p style={{ fontSize: '12px', color: '#9ca8b3', margin: '4px 0 0' }}>{userRole}</p>
            </div>
            <a
              href="/dashboard/profile"
              style={{ display: 'block', padding: '10px 16px', fontSize: '14px', color: '#2a3142', textDecoration: 'none' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Edit Profile
            </a>
          </div>
        </>
      )}
    </header>
  );
}