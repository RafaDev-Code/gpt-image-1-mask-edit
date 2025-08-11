'use client';

import { useEffect, useState } from 'react';
import i18n from '@/lib/i18n';
import { useTheme } from './theme-provider';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { locale } = useTheme();

  useEffect(() => {
    // Sync i18n with theme provider locale
    if (typeof window !== 'undefined' && locale && i18n.language !== locale) {
      i18n.changeLanguage(locale).then(() => {
        setIsInitialized(true);
      });
    } else if (!isInitialized) {
      // Fallback initialization
      const fallbackLang = locale || 'en';
      i18n.changeLanguage(fallbackLang).then(() => {
        setIsInitialized(true);
      });
    }
  }, [locale, isInitialized]);

  // Render children immediately to prevent hydration mismatch
  return <>{children}</>;
}