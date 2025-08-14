'use client';

import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useTheme } from './theme-provider';
import type { Locale } from '@/lib/db.types';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { i18n } = useTranslation();
  const { locale, setLocale } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Cerrar dropdown al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const changeLanguage = (languageCode: string) => {
    setOpen(false);
    // Use ThemeProvider to persist locale in profile and sync cookies
    setLocale(languageCode as Locale);
  };

  // Always show English during SSR to prevent hydration mismatch
  const currentLanguage = mounted 
    ? (languages.find(lang => lang.code === locale) || languages[0])
    : languages[0]; // Default to English

  return (
    <div className={className}>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <button 
            type="button"
            className="inline-flex h-8 w-8 sm:w-auto sm:px-3 sm:min-w-[120px] p-0 sm:p-2 sm:gap-2 items-center justify-center overflow-hidden border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md" 
            title={currentLanguage.name}
            aria-label={`Language: ${currentLanguage.name}`}
          >
          {/* En <640px: solo bandera/ícono */}
          <span className="sm:hidden text-base">{currentLanguage.flag}</span>
          {/* En ≥640px: ícono + texto truncado */}
          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <Globe className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              <span>{currentLanguage.flag}</span>
              <span className="ml-1">{currentLanguage.name}</span>
            </span>
          </div>
        </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
           align="end"
           sideOffset={8}
           className="z-50"
         >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onSelect={() => changeLanguage(language.code)}
            className="gap-2"
            aria-current={i18n.language === language.code ? 'true' : undefined}
          >
            <span>{language.flag}</span>
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
}