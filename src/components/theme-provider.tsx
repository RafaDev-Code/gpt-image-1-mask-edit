'use client';

import * as React from 'react';
import { getCookieValue, setCookieValue } from '@/lib/cookie-utils';

export type Theme = 'light' | 'dark' | 'green' | 'retro';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  getTheme: () => Theme;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'app-theme';
const COOKIE_KEY = 'theme';
const DEFAULT_THEME: Theme = 'light';

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Theme;
}

export function ThemeProvider({ children, initialTheme = DEFAULT_THEME }: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(initialTheme);
  const [, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    
    // Sync on mount: check localStorage, then cookie, then use current theme
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      let finalTheme = theme;
      
      if (stored && (stored === 'light' || stored === 'dark' || stored === 'green' || stored === 'retro')) {
        finalTheme = stored as Theme;
      } else {
        const cookieTheme = getCookieValue(COOKIE_KEY);
        if (cookieTheme && (cookieTheme === 'light' || cookieTheme === 'dark' || cookieTheme === 'green' || cookieTheme === 'retro')) {
          finalTheme = cookieTheme as Theme;
        }
      }
      
      // Sync HTML, localStorage and cookie
      document.documentElement.setAttribute('data-theme', finalTheme);
      localStorage.setItem(STORAGE_KEY, finalTheme);
      setCookieValue(COOKIE_KEY, finalTheme);
      
      if (finalTheme !== theme) {
        setThemeState(finalTheme);
      }
    }
  }, [theme]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Sync HTML, localStorage and cookie immediately
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem(STORAGE_KEY, newTheme);
      setCookieValue(COOKIE_KEY, newTheme);
    }
  }, []);

  const getTheme = React.useCallback(() => {
    return theme;
  }, [theme]);

  const value = React.useMemo(() => ({
    theme,
    setTheme,
    getTheme
  }), [theme, setTheme, getTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}