import './globals.css';
import { I18nProvider } from '@/components/i18n-provider';
import { ThemeProvider } from '@/components/theme-provider';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { cookies } from 'next/headers';

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
  // Read scheme and colors from cookies on server
  const cookieStore = await cookies();
  const schemeCookie = cookieStore.get('scheme')?.value;
  const colorsCookie = cookieStore.get('colors')?.value;
  
  const validSchemes = ['light', 'dark'] as const;
  const validColors = ['default', 'purple', 'blue', 'olive', 'tangerine'] as const;
  
  const initialScheme = validSchemes.includes(schemeCookie as typeof validSchemes[number]) 
    ? (schemeCookie as 'light' | 'dark')
    : 'light';
    
  // Migrate vanilla users to default on SSR
  const initialColors = validColors.includes(colorsCookie as typeof validColors[number])
    ? (colorsCookie as 'default' | 'purple' | 'blue' | 'olive' | 'tangerine')
    : colorsCookie === 'vanilla' ? 'default' : 'default';

  return (
    <html lang="en" data-scheme={initialScheme} data-colors={initialColors}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider initialScheme={initialScheme} initialColor={initialColors}>
          <I18nProvider>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
