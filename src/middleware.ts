import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/db.types';
import { validateThemeValues } from '@/lib/secure-cookies';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser();

  // Manejar cookies de tema
  if (user) {
    // Usuario autenticado: sincronizar cookies con base de datos
    const { data: profile } = await supabase
      .from('profiles')
      .select('theme_scheme, theme_color, locale')
      .eq('id', user.id)
      .single();

    if (profile) {
      const themeData = validateThemeValues({
        scheme: profile.theme_scheme,
        color: profile.theme_color,
        locale: profile.locale,
      });

      // Establecer cookies seguras con datos de la base de datos
      const cookieOptions = {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 año
        sameSite: 'lax' as const,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
      };

      response.cookies.set('scheme', themeData.scheme, cookieOptions);
      response.cookies.set('color', themeData.color, cookieOptions);
      response.cookies.set('locale', themeData.locale, cookieOptions);
    }
  } else {
    // Usuario no autenticado: validar cookies existentes
    const currentScheme = request.cookies.get('scheme')?.value;
    const currentColor = request.cookies.get('color')?.value;
    const currentLocale = request.cookies.get('locale')?.value;

    const themeData = validateThemeValues({
      scheme: currentScheme,
      color: currentColor,
      locale: currentLocale,
    });

    // Solo actualizar cookies si los valores han cambiado (normalización)
    const cookieOptions = {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 año
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
    };

    if (currentScheme !== themeData.scheme) {
      response.cookies.set('scheme', themeData.scheme, cookieOptions);
    }
    if (currentColor !== themeData.color) {
      response.cookies.set('color', themeData.color, cookieOptions);
    }
    if (currentLocale !== themeData.locale) {
      response.cookies.set('locale', themeData.locale, cookieOptions);
    }
  }

  // Proteger rutas que requieren autenticación
  const protectedRoutes = ['/profile', '/dashboard'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirigir usuarios autenticados lejos de páginas de auth
  if (request.nextUrl.pathname.startsWith('/auth/login') && user) {
    const next = request.nextUrl.searchParams.get('next');
    let redirectPath = '/profile/settings'; // Default redirect for authenticated users
    
    // Validar next parameter - solo permitir rutas internas
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      // Verificar que no sea una ruta de auth para evitar loops
      if (!next.startsWith('/auth/')) {
        redirectPath = next;
      }
    }
    
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};