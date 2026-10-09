import { TAGLINES } from '@juandavidfuentes/indomitox-shared';
import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { Providers } from '@/components/providers';
import { routing } from '@/i18n/routing';
import { getFxRates } from '@/lib/api/public';
import { FxProvider } from '@/lib/fx';
import '../globals.css';

const barlow = Barlow({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
});

// 800 itálica para los titulares de aventura (hero y secciones); 600/700 rectas para el resto.
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1120' },
  ],
};

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'),
    title: {
      default: `Indómito X — ${TAGLINES[locale]}`,
      template: '%s · Indómito X',
    },
    description: t('heroSubtitle'),
    alternates: {
      canonical: `/${locale}`,
      languages: { ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])), 'x-default': '/es' },
    },
    openGraph: {
      siteName: 'Indómito X',
      type: 'website',
      locale,
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const [t, fxRates] = await Promise.all([getTranslations({ locale, namespace: 'common' }), getFxRates()]);

  return (
    <html
      lang={locale}
      className={`${barlow.variable} ${barlowCondensed.variable} scroll-smooth scroll-pt-20`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenido"
          className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t('skipToContent')}
        </a>
        <NextIntlClientProvider>
          <Providers>
            <FxProvider rates={fxRates}>
              <SiteHeader />
              <main id="contenido" className="flex-1">
                {children as ReactNode}
              </main>
              <SiteFooter />
            </FxProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
