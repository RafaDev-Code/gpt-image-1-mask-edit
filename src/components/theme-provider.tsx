'use client';

import * as React from 'react';

type Theme = 'light' | 'dark' | 'green' | 'retro';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  getTheme: () => Theme;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'app-theme';
const DEFAULT_THEME: Theme = 'light';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(DEFAULT_THEME);
  const [mounted, setMounted] = React.useState(false);

  // Cargar tema desde localStorage al montar
  React.useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme;
    const initialTheme = savedTheme && ['light', 'dark', 'green', 'retro'].includes(savedTheme) 
      ? savedTheme 
      : DEFAULT_THEME;
    
    setThemeState(initialTheme);
    setMounted(true);
  }, []);

  // Aplicar tema al HTML y persistir
  React.useEffect(() => {
    if (!mounted) return;
    
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const getTheme = React.useCallback(() => {
    return theme;
  }, [theme]);

  const value = React.useMemo(() => ({
    theme,
    setTheme,
    getTheme
  }), [theme, setTheme, getTheme]);

  // Evitar hidration mismatch
  if (!mounted) {
    return <div suppressHydrationWarning>{children}</div>;
  }

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