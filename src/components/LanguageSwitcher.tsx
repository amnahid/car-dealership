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
      className="px-3 py-1 text-sm font-medium transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {locale === 'en' ? 'العربية' : 'English'}
    </button>
  );
}
