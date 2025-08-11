'use client';

import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  // Always show English during SSR to prevent hydration mismatch
  const currentLanguage = mounted 
    ? (languages.find(lang => lang.code === i18n.language) || languages[0])
    : languages[0]; // Default to English

  return (
    <div className={className}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="inline-flex h-8 px-3 min-w-[120px] gap-2 overflow-hidden whitespace-nowrap truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" 
            title={currentLanguage.name}
            aria-label={`Language: ${currentLanguage.name}`}
          >
          <Globe className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {/* En móvil: solo bandera */}
            <span className="sm:hidden">{currentLanguage.flag}</span>
            {/* En desktop: bandera + nombre, pero en ≤360px solo bandera */}
            <span className="hidden sm:inline">
              <span>{currentLanguage.flag}</span>
              <span className="max-[360px]:sr-only ml-1">{currentLanguage.name}</span>
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className=""
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
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