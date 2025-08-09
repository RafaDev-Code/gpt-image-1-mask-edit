'use client';

import * as React from 'react';
import { getCookieValue, setCookieValue } from '@/lib/cookie-utils';

export type Scheme = 'light' | 'dark';
export type Color = 'default' | 'purple' | 'blue' | 'olive' | 'tangerine';

interface ThemeContextType {
  scheme: Scheme;
  color: Color;
  setScheme: (scheme: Scheme) => void;
  setColor: (color: Color) => void;
  getScheme: () => Scheme;
  getColor: () => Color;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const SCHEME_STORAGE_KEY = 'app-scheme';
const COLORS_STORAGE_KEY = 'app-colors';
const SCHEME_COOKIE_KEY = 'scheme';
const COLORS_COOKIE_KEY = 'colors';
const DEFAULT_SCHEME: Scheme = 'light';
const DEFAULT_COLOR: Color = 'default';

interface ThemeProviderProps {
  children: React.ReactNode;
  initialScheme?: Scheme;
  initialColor?: Color;
}

export function ThemeProvider({ 
  children, 
  initialScheme = DEFAULT_SCHEME,
  initialColor = DEFAULT_COLOR 
}: ThemeProviderProps) {
  const [scheme, setSchemeState] = React.useState<Scheme>(initialScheme);
  const [color, setColorState] = React.useState<Color>(initialColor);
  const [, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    
    // Sync on mount: check localStorage, then cookie, then use current values
    if (typeof window !== 'undefined') {
      // Handle scheme
      const storedScheme = localStorage.getItem(SCHEME_STORAGE_KEY);
      let finalScheme = scheme;
      
      if (storedScheme && (storedScheme === 'light' || storedScheme === 'dark')) {
        finalScheme = storedScheme as Scheme;
      } else {
        const cookieScheme = getCookieValue(SCHEME_COOKIE_KEY);
        if (cookieScheme && (cookieScheme === 'light' || cookieScheme === 'dark')) {
          finalScheme = cookieScheme as Scheme;
        }
      }
      
      // Handle colors
      const storedColors = localStorage.getItem(COLORS_STORAGE_KEY);
      let finalColor = color;
      
      if (storedColors && ['default', 'purple', 'blue', 'olive', 'tangerine'].includes(storedColors)) {
        finalColor = storedColors as Color;
      } else if (storedColors === 'vanilla') {
        // Migrate vanilla users to default
        finalColor = 'default';
      } else {
        const cookieColors = getCookieValue(COLORS_COOKIE_KEY);
        if (cookieColors && ['default', 'purple', 'blue', 'olive', 'tangerine'].includes(cookieColors)) {
          finalColor = cookieColors as Color;
        } else if (cookieColors === 'vanilla') {
          // Migrate vanilla users to default
          finalColor = 'default';
        }
      }
      
      // Sync HTML, localStorage and cookies
      document.documentElement.setAttribute('data-scheme', finalScheme);
      document.documentElement.setAttribute('data-colors', finalColor);
      localStorage.setItem(SCHEME_STORAGE_KEY, finalScheme);
      localStorage.setItem(COLORS_STORAGE_KEY, finalColor);
      setCookieValue(SCHEME_COOKIE_KEY, finalScheme);
      setCookieValue(COLORS_COOKIE_KEY, finalColor);
      
      if (finalScheme !== scheme) {
        setSchemeState(finalScheme);
      }
      if (finalColor !== color) {
        setColorState(finalColor);
      }
    }
  }, [scheme, color]);

  const setScheme = React.useCallback((newScheme: Scheme) => {
    setSchemeState(newScheme);
    
    // Sync HTML, localStorage and cookie immediately
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-scheme', newScheme);
      localStorage.setItem(SCHEME_STORAGE_KEY, newScheme);
      setCookieValue(SCHEME_COOKIE_KEY, newScheme);
    }
  }, []);

  const setColor = React.useCallback((newColor: Color) => {
    setColorState(newColor);
    
    // Sync HTML, localStorage and cookie immediately
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-colors', newColor);
      localStorage.setItem(COLORS_STORAGE_KEY, newColor);
      setCookieValue(COLORS_COOKIE_KEY, newColor);
    }
  }, []);

  const getScheme = React.useCallback(() => {
    return scheme;
  }, [scheme]);

  const getColor = React.useCallback(() => {
    return color;
  }, [color]);

  const value = React.useMemo(() => ({
    scheme,
    color,
    setScheme,
    setColor,
    getScheme,
    getColor
  }), [scheme, color, setScheme, setColor, getScheme, getColor]);

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

// Legacy compatibility - maps old theme values to new scheme/color
export function mapLegacyTheme(legacyTheme: string): { scheme: Scheme; color: Color } {
  switch (legacyTheme) {
    case 'dark':
      return { scheme: 'dark', color: 'default' };
    case 'green':
      return { scheme: 'light', color: 'olive' };
    case 'retro':
      return { scheme: 'light', color: 'default' };
    case 'light':
    default:
      return { scheme: 'light', color: 'default' };
  }
}