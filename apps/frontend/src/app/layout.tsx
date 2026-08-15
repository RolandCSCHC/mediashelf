import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Fraunces, Source_Sans_3 } from 'next/font/google';
import { AuthProvider } from '@/components/auth-provider';
import { LocaleProvider } from '@/components/locale-provider';
import { ServiceWorkerRegister } from '@/components/service-worker-register';
import { ThemeProvider, themeInitScript } from '@/components/theme-provider';
import { LOCALE_COOKIE, htmlLang, parseLocale } from '@/i18n';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const APP_NAME = 'MediaShelf';
const APP_DESCRIPTION = 'Track movies and TV series in one private library.';

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2a7a6d' },
    { media: '(prefers-color-scheme: dark)', color: '#3d9a8b' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  return (
    <html
      lang={htmlLang(locale)}
      className={`${display.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <LocaleProvider initialLocale={locale}>
            <AuthProvider>
              <ServiceWorkerRegister />
              {children}
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
