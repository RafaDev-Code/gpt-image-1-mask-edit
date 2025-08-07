'use client';

import { useEffect, useState } from 'react';
import i18n from '@/lib/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Ensure i18n is properly initialized on client side
    if (typeof window !== 'undefined' && !isInitialized) {
      // Change language to detected language after hydration
      const detectedLang = i18n.language || 'en';
      i18n.changeLanguage(detectedLang).then(() => {
        setIsInitialized(true);
      });
    }
  }, [isInitialized]);

  // Render children immediately to prevent hydration mismatch
  return <>{children}</>;
}