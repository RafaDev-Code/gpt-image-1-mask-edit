// =====================================================
// UTILIDADES PARA COOKIES SEGURAS
// =====================================================

import type { ThemeScheme, ThemeColor, Locale } from '@/lib/db.types';
import { logger } from './logger';
import { isError } from './utils';

// Configuración de cookies seguras
export const COOKIE_OPTIONS = {
  // Configuración base para todas las cookies
  base: {
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // Necesario para acceso desde JavaScript del cliente
  },
  // Configuración específica para cookies de tema/locale
  theme: {
    maxAge: 60 * 60 * 24 * 365, // 1 año
  },
  // Configuración para cookies de sesión (manejadas por Supabase)
  session: {
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    httpOnly: true, // Más seguro para cookies de sesión
  },
} as const;

// =====================================================
// VALIDACIÓN DE RUTAS PARA PREVENIR OPEN REDIRECT
// =====================================================

/**
 * Valida que una URL de redirección sea segura (solo rutas internas)
 * @param next - URL de redirección
 * @param origin - Origen base para validación
 * @returns URL validada o fallback seguro
 */
export function validateRedirectUrl(next: string | null | undefined, origin?: string): string {
  if (!next) return '/';
  
  try {
    // Si es una URL completa, verificar que sea del mismo origen
    if (next.startsWith('http://') || next.startsWith('https://')) {
      const url = new URL(next);
      const currentOrigin = origin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const allowedOrigin = new URL(currentOrigin);
      
      if (url.origin !== allowedOrigin.origin) {
        console.warn(`Blocked external redirect to: ${next}`);
        return origin || '/';
      }
      
      return url.pathname + url.search + url.hash;
    }
    
    // Si es una ruta relativa, verificar que comience con '/'
    if (!next.startsWith('/')) {
      return (origin || '') + '/' + next;
    }
    
    // Prevenir rutas maliciosas
    if (next.includes('..') || next.includes('//')) {
      console.warn(`Blocked potentially malicious redirect: ${next}`);
      return origin || '/';
    }
    
    return (origin || '') + next;
  } catch (err: unknown) {
    logger.warn(`Invalid redirect URL: ${next}`, {
      component: 'SecureCookies',
      error: isError(err) ? err.message : String(err)
    });
    return origin || '/';
  }
}

// =====================================================
// FUNCIONES PARA MANEJO DE COOKIES DE TEMA
// =====================================================

/**
 * Establece una cookie de tema de forma segura
 */
export function setThemeCookie(name: string, value: string): string {
  const options = {
    ...COOKIE_OPTIONS.base,
    ...COOKIE_OPTIONS.theme,
  };
  
  const optionsString = Object.entries(options)
    .map(([key, val]) => {
      if (typeof val === 'boolean') {
        return val ? key : '';
      }
      return `${key}=${val}`;
    })
    .filter(Boolean)
    .join('; ');
  
  return `${name}=${value}; ${optionsString}`;
}

/**
 * Establece múltiples cookies de tema de forma segura
 */
export function setThemeCookies(cookies: Record<string, string>): string[] {
  return Object.entries(cookies).map(([name, value]) => 
    setThemeCookie(name, value)
  );
}

/**
 * Valida y normaliza valores de tema
 */
export function validateThemeValues(data: {
  scheme?: string;
  color?: string;
  locale?: string;
}): {
  scheme: ThemeScheme;
  color: ThemeColor;
  locale: Locale;
} {
  const validSchemes: ThemeScheme[] = ['light', 'dark'];
  const validColors: ThemeColor[] = ['default', 'purple', 'blue', 'olive', 'tangerine'];
  const validLocales: Locale[] = ['en', 'es'];
  
  return {
    scheme: validSchemes.includes(data.scheme as ThemeScheme) 
      ? (data.scheme as ThemeScheme) 
      : 'light',
    color: validColors.includes(data.color as ThemeColor) 
      ? (data.color as ThemeColor) 
      : 'default',
    locale: validLocales.includes(data.locale as Locale) 
      ? (data.locale as Locale) 
      : 'en',
  };
}

// =====================================================
// FUNCIONES PARA USO EN COMPONENTES
// =====================================================

/**
 * Establece cookies de tema en el cliente de forma segura
 */
export function setClientThemeCookies(data: {
  scheme: ThemeScheme;
  color: ThemeColor;
  locale: Locale;
}): void {
  const validated = validateThemeValues(data);
  
  // Establecer cookies individuales
  document.cookie = setThemeCookie('scheme', validated.scheme);
  document.cookie = setThemeCookie('color', validated.color);
  document.cookie = setThemeCookie('locale', validated.locale);
  
  // También actualizar localStorage para sincronización
  localStorage.setItem('scheme', validated.scheme);
  localStorage.setItem('color', validated.color);
  localStorage.setItem('locale', validated.locale);
}

/**
 * Obtiene cookies de tema del cliente
 */
export function getClientThemeCookies(): {
  scheme: ThemeScheme;
  color: ThemeColor;
  locale: Locale;
} {
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  };
  
  return validateThemeValues({
    scheme: getCookie('scheme') || undefined,
    color: getCookie('color') || undefined,
    locale: getCookie('locale') || undefined,
  });
}

// =====================================================
// FUNCIONES PARA USO EN SERVIDOR
// =====================================================

/**
 * Obtiene cookies de tema del servidor (Next.js)
 */
export function getServerThemeCookies(cookieStore: {
  get: (name: string) => { value: string } | undefined;
}): {
  scheme: ThemeScheme;
  color: ThemeColor;
  locale: Locale;
} {
  return validateThemeValues({
    scheme: cookieStore.get('scheme')?.value,
    color: cookieStore.get('color')?.value,
    locale: cookieStore.get('locale')?.value,
  });
}

/**
 * Establece headers de cookies de tema para respuestas del servidor
 */
export function setServerThemeCookies(
  response: Response,
  data: {
    scheme: ThemeScheme;
    color: ThemeColor;
    locale: Locale;
  }
): void {
  const validated = validateThemeValues(data);
  const cookieStrings = setThemeCookies({
    scheme: validated.scheme,
    color: validated.color,
    locale: validated.locale,
  });
  
  cookieStrings.forEach(cookieString => {
    response.headers.append('Set-Cookie', cookieString);
  });
}