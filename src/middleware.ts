import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Si faltan envs, no hagas nada especial
  if (!url || !anon) return NextResponse.next()

  // Puente de cookies para Supabase (sin tocar cookies de tema)
  const response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(url, anon, {
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        response.cookies.set({ name, value, ...options })
      },
      remove: (name: string, options: CookieOptions) => {
        response.cookies.set({ name, value: '', ...options, maxAge: 0 })
      },
    },
  })

  // Solo refrescamos sesión (nada de sincronizar tema/locale aquí)
  const { data } = await supabase.auth.getSession()
  const session = data?.session

  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search || ''

  // 1) Proteger rutas privadas
  const requiresAuth =
    pathname.startsWith('/profile') || pathname.startsWith('/dashboard')

  if (requiresAuth && !session) {
    const redirect = new URL('/auth/login', request.url)
    redirect.searchParams.set('next', pathname + search)
    return NextResponse.redirect(redirect)
  }

  // 2) Evitar mostrar /auth/login si YA estoy autenticado
  if (pathname === '/auth/login' && session) {
    const next = request.nextUrl.searchParams.get('next')
    const safeNext =
      next &&
      next.startsWith('/') &&
      !next.startsWith('//') &&
      !next.startsWith('/auth/')
        ? next
        : '/profile/settings'

    return NextResponse.redirect(new URL(safeNext, request.url))
  }

  return response
}

// Excluimos estáticos/imagenes/favicon
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}