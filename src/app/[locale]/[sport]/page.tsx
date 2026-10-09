import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { landingJsonLd, landingMetadata, requireLanding } from '@/components/landing/load-landing';
import { SportLanding } from '@/components/landing/sport-landing';
import { routing } from '@/i18n/routing';

/** Páginas de aterrizaje bajo demanda (ISR de 5 minutos). */
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type Props = PageProps<'/[locale]/[sport]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, sport } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return landingMetadata(locale, sport, null);
}

/** SRCH-06: `/es/rafting`, `/en/paragliding`… */
export default async function SportPage({ params }: Props) {
  const { locale, sport } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const data = await requireLanding(locale, sport, null);
  return (
    <>
      {landingJsonLd(data, locale).map((json, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json).replace(/</g, '\\u003c') }} />
      ))}
      <SportLanding {...data} />
    </>
  );
}
