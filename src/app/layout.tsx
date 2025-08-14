import './globals.css';
import { I18nProvider } from '@/components/i18n-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { OverlayCleanup } from '@/components/overlay-cleanup';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { supabaseServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { ThemeScheme, ThemeColor, Locale } from '@/lib/db.types';
import { getServerThemeCookies, validateThemeValues } from '@/lib/secure-cookies';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin']
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin']
});

export const metadata: Metadata = {
    title: 'gpt-image-1 playground',
    description: "Generate and edit images using OpenAI's gpt-image-1 model.",
    icons: {
        icon: '/favicon.svg'
    }
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
  params?: Promise<Record<string, unknown>>;
}) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  let themeData: {
    scheme: ThemeScheme;
    color: ThemeColor;
    locale: Locale;
  } = {
    scheme: 'light',
    color: 'default',
    locale: 'en',
  };
  
  if (user) {
    // Usuario autenticado: obtener preferencias de la base de datos
    const { data: profile } = await supabase
      .from('profiles')
      .select('theme_scheme, theme_color, locale')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      themeData = validateThemeValues({
        scheme: profile.theme_scheme,
        color: profile.theme_color,
        locale: profile.locale,
      });
    }
  } else {
    // Usuario no autenticado: fallback a cookies
    const cookieStore = await cookies();
    themeData = getServerThemeCookies(cookieStore);
  }
  
  // Nota: Las cookies se establecen en el middleware o en Server Actions
  // No podemos modificar cookies directamente en el layout

  return (
    <html lang={themeData.locale} data-scheme={themeData.scheme} data-colors={themeData.color}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider initialScheme={themeData.scheme} initialColor={themeData.color} initialLocale={themeData.locale}>
          <I18nProvider>
            <OverlayCleanup />
            {children}
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
