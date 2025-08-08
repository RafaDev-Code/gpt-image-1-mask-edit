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
}) {
  // Read theme from cookie on server
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme')?.value;
  const validThemes = ['light', 'dark', 'green', 'retro'] as const;
  const initialTheme = validThemes.includes(themeCookie as any) 
    ? (themeCookie as 'light' | 'dark' | 'green' | 'retro')
    : 'light';

  return (
    <html lang="en" data-theme={initialTheme}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider initialTheme={initialTheme}>
          <I18nProvider>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
