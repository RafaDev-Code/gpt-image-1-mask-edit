'use client';

import * as React from 'react';
import { getCookieValue, setCookieValue } from '@/lib/cookie-utils';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/db.types';
import type { User } from '@supabase/supabase-js';
import { validateThemeValues } from '@/lib/secure-cookies';
import { logger } from '@/lib/logger';

export type Scheme = 'light' | 'dark';
export type Color = 'default' | 'purple' | 'blue' | 'olive' | 'tangerine';
export type Locale = 'en' | 'es';

interface ThemeContextType {
  scheme: Scheme;
  color: Color;
  locale: Locale;
  setScheme: (scheme: Scheme) => void;
  setColor: (color: Color) => void;
  setLocale: (locale: Locale) => void;
  getScheme: () => Scheme;
  getColor: () => Color;
  getLocale: () => Locale;
  isAuthenticated: boolean;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const SCHEME_STORAGE_KEY = 'app-scheme';
const COLORS_STORAGE_KEY = 'app-colors';
const LOCALE_STORAGE_KEY = 'app-locale';
const SCHEME_COOKIE_KEY = 'scheme';
const COLORS_COOKIE_KEY = 'color';
const LOCALE_COOKIE_KEY = 'locale';
const DEFAULT_SCHEME: Scheme = 'light';
const DEFAULT_COLOR: Color = 'default';
const DEFAULT_LOCALE: Locale = 'en';

// Debounce timeout for saving to database
const SAVE_DEBOUNCE_MS = 300;

interface ThemeProviderProps {
  children: React.ReactNode;
  initialScheme?: Scheme;
  initialColor?: Color;
  initialLocale?: Locale;
}

export function ThemeProvider({ 
  children, 
  initialScheme = DEFAULT_SCHEME,
  initialColor = DEFAULT_COLOR,
  initialLocale = DEFAULT_LOCALE
}: ThemeProviderProps) {
  const [scheme, setSchemeState] = React.useState<Scheme>(initialScheme);
  const [color, setColorState] = React.useState<Color>(initialColor);
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [profileData, setProfileData] = React.useState<Database['public']['Tables']['profiles']['Row'] | null>(null);
  const [mounted, setMounted] = React.useState(false);
  
  // Debounce timer ref
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Supabase client
  const supabase = React.useMemo(() => createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // Initialize theme values with precedence: profile → cookie → localStorage
  const initializeTheme = React.useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);

      let finalScheme = DEFAULT_SCHEME;
      let finalColor = DEFAULT_COLOR;
      let finalLocale = DEFAULT_LOCALE;

      if (currentUser) {
        // User authenticated: try to get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('theme_scheme, theme_color, locale')
          .eq('id', currentUser.id)
          .single();

        if (profile) {
          setProfileData(profile);
          // Use profile data as source of truth
          const validated = validateThemeValues({
            scheme: profile.theme_scheme,
            color: profile.theme_color,
            locale: profile.locale
          });
          finalScheme = validated.scheme as Scheme;
          finalColor = validated.color as Color;
          finalLocale = validated.locale as Locale;
        } else {
          // No profile yet, fall back to cookies then localStorage
          finalScheme = getCookieValue(SCHEME_COOKIE_KEY) as Scheme || 
                       localStorage.getItem(SCHEME_STORAGE_KEY) as Scheme || 
                       DEFAULT_SCHEME;
          finalColor = getCookieValue(COLORS_COOKIE_KEY) as Color || 
                      localStorage.getItem(COLORS_STORAGE_KEY) as Color || 
                      DEFAULT_COLOR;
          finalLocale = getCookieValue(LOCALE_COOKIE_KEY) as Locale || 
                       localStorage.getItem(LOCALE_STORAGE_KEY) as Locale || 
                       DEFAULT_LOCALE;
        }
      } else {
        // Not authenticated: cookie → localStorage precedence
        finalScheme = getCookieValue(SCHEME_COOKIE_KEY) as Scheme || 
                     localStorage.getItem(SCHEME_STORAGE_KEY) as Scheme || 
                     DEFAULT_SCHEME;
        finalColor = getCookieValue(COLORS_COOKIE_KEY) as Color || 
                    localStorage.getItem(COLORS_STORAGE_KEY) as Color || 
                    DEFAULT_COLOR;
        finalLocale = getCookieValue(LOCALE_COOKIE_KEY) as Locale || 
                     localStorage.getItem(LOCALE_STORAGE_KEY) as Locale || 
                     DEFAULT_LOCALE;
      }

      // Validate values
      const validated = validateThemeValues({
        scheme: finalScheme,
        color: finalColor,
        locale: finalLocale
      });

      // Apply to DOM and storage
      document.documentElement.setAttribute('data-scheme', validated.scheme);
      document.documentElement.setAttribute('data-colors', validated.color);
      document.documentElement.setAttribute('lang', validated.locale);
      
      localStorage.setItem(SCHEME_STORAGE_KEY, validated.scheme);
      localStorage.setItem(COLORS_STORAGE_KEY, validated.color);
      localStorage.setItem(LOCALE_STORAGE_KEY, validated.locale);
      
      setCookieValue(SCHEME_COOKIE_KEY, validated.scheme);
      setCookieValue(COLORS_COOKIE_KEY, validated.color);
      setCookieValue(LOCALE_COOKIE_KEY, validated.locale);

      // Update state
      setSchemeState(validated.scheme as Scheme);
      setColorState(validated.color as Color);
      setLocaleState(validated.locale as Locale);
      
    } catch (error) {
      console.error('Error initializing theme:', error);
    }
  }, [supabase]);

  // Initialize on mount
  React.useEffect(() => {
    initializeTheme().then(() => setMounted(true));
  }, [initializeTheme]);

  // Listen for auth changes
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      setIsAuthenticated(!!session?.user);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await initializeTheme();
      } else if (event === 'SIGNED_OUT') {
        setProfileData(null);
        // Keep current theme but remove profile reference
        await initializeTheme();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, initializeTheme]);

  // Debounced save to database
  const debouncedSave = React.useCallback(async (newScheme: Scheme, newColor: Color, newLocale: Locale) => {
    if (!isAuthenticated || !user) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Check if values actually changed from profile data
        if (profileData && 
            profileData.theme_scheme === newScheme && 
            profileData.theme_color === newColor && 
            profileData.locale === newLocale) {
          // No change, skip upsert
          return;
        }

        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            theme_scheme: newScheme,
            theme_color: newColor,
            locale: newLocale,
            updated_at: new Date().toISOString()
          });

        if (error) {
          logger.supabase('save_theme_preferences', error, { userId: user.id });
          console.error('Error saving theme preferences:', error);
        } else {
          logger.supabase('save_theme_preferences', null, { userId: user.id });
          // Update local profile data
          setProfileData({
            theme_scheme: newScheme,
            theme_color: newColor,
            locale: newLocale
          });
        }
      } catch (error) {
        logger.supabase('debounced_save', error, { userId: user?.id });
        console.error('Error in debounced save:', error);
      }
    }, SAVE_DEBOUNCE_MS);
  }, [isAuthenticated, user, profileData, supabase]);

  const setScheme = React.useCallback((newScheme: Scheme) => {
    if (newScheme === scheme) return; // Avoid unnecessary updates
    
    setSchemeState(newScheme);
    
    // Log theme change
    logger.theme('scheme_change', user?.id, { 
      from: scheme, 
      to: newScheme 
    });
    
    // Sync HTML, localStorage and cookie immediately
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-scheme', newScheme);
      localStorage.setItem(SCHEME_STORAGE_KEY, newScheme);
      setCookieValue(SCHEME_COOKIE_KEY, newScheme);
    }

    // Debounced save to database
    debouncedSave(newScheme, color, locale);
  }, [scheme, color, locale, debouncedSave, user]);

  const setColor = React.useCallback((newColor: Color) => {
    if (newColor === color) return; // Avoid unnecessary updates
    
    setColorState(newColor);
    
    // Log theme change
    logger.theme('color_change', user?.id, { 
      from: color, 
      to: newColor 
    });
    
    // Sync HTML, localStorage and cookie immediately
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-colors', newColor);
      localStorage.setItem(COLORS_STORAGE_KEY, newColor);
      setCookieValue(COLORS_COOKIE_KEY, newColor);
    }

    // Debounced save to database
    debouncedSave(scheme, newColor, locale);
  }, [scheme, color, locale, debouncedSave, user]);

  const setLocale = React.useCallback((newLocale: Locale) => {
    if (newLocale === locale) return; // Avoid unnecessary updates
    
    setLocaleState(newLocale);
    
    // Log locale change
    logger.theme('locale_change', user?.id, { 
      from: locale, 
      to: newLocale 
    });
    
    // Sync HTML, localStorage and cookie immediately
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('lang', newLocale);
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      setCookieValue(LOCALE_COOKIE_KEY, newLocale);
    }

    // Debounced save to database
    debouncedSave(scheme, color, newLocale);
  }, [scheme, color, locale, debouncedSave, user]);

  const getScheme = React.useCallback(() => {
    return scheme;
  }, [scheme]);

  const getColor = React.useCallback(() => {
    return color;
  }, [color]);

  const getLocale = React.useCallback(() => {
    return locale;
  }, [locale]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const value = React.useMemo(() => ({
    scheme,
    color,
    locale,
    setScheme,
    setColor,
    setLocale,
    getScheme,
    getColor,
    getLocale,
    isAuthenticated
  }), [scheme, color, locale, setScheme, setColor, setLocale, getScheme, getColor, getLocale, isAuthenticated]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{
        scheme: DEFAULT_SCHEME,
        color: DEFAULT_COLOR,
        locale: DEFAULT_LOCALE,
        setScheme: () => {},
        setColor: () => {},
        setLocale: () => {},
        getScheme: () => DEFAULT_SCHEME,
        getColor: () => DEFAULT_COLOR,
        getLocale: () => DEFAULT_LOCALE,
        isAuthenticated: false
      }}>
        {children}
      </ThemeContext.Provider>
    );
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