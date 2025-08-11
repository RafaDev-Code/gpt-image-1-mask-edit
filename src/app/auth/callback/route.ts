import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { validateRedirectUrl } from '@/lib/secure-cookies';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Validar la URL de redirección para prevenir open redirects
  const safeRedirectUrl = validateRedirectUrl(next, origin);

  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const response = NextResponse.redirect(safeRedirectUrl);
      
      // Establecer cookies seguras para la sesión
      response.cookies.set('auth-callback', 'success', {
        path: '/',
        maxAge: 60, // 1 minuto, solo para confirmar el callback
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
      });
      
      return response;
    }
  }

  // Redirigir a página de error con URL segura
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}