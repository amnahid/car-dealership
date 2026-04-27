'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { setUserLocale } from '@/lib/locale';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const toggleLanguage = async () => {
    const nextLocale = locale === 'en' ? 'ar' : 'en';
    await setUserLocale(nextLocale);
    router.refresh();
  };

  return (
    <button
      onClick={toggleLanguage}
      style={{
        padding: '6px 12px',
        fontSize: '14px',
        fontWeight: 500,
        borderRadius: '6px',
        border: '1px solid #e1e5ef',
        background: 'transparent',
        color: '#2a3142',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = '#f8f9fa';
        e.currentTarget.style.borderColor = '#28aaa9';
        e.currentTarget.style.color = '#28aaa9';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = '#e1e5ef';
        e.currentTarget.style.color = '#2a3142';
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
      {locale === 'en' ? 'العربية' : 'English'}
    </button>
  );
}
