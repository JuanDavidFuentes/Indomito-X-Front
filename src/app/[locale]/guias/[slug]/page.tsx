import { departmentName, pickLocalized, webPath, type PublicHostResponse, type SportDto } from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { cache } from 'react';
import { GuideProfile } from '@/components/guide/guide-profile';
import { routing } from '@/i18n/routing';
import { publicApi, publicResource } from '@/lib/api/server';

/** Páginas de Guía bajo demanda: se generan la primera vez que se visitan y se renuevan cada 5 minutos (ISR). */
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

const getGuide = cache((slug: string) => publicResource<PublicHostResponse>(`/v1/hosts/${encodeURIComponent(slug)}`, 300));

export async function generateMetadata({ params }: PageProps<'/[locale]/guias/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const guide = await getGuide(slug);
  if (!guide) return {};
  const t = await getTranslations({ locale, namespace: 'guide' });
  const place = [guide.city, departmentName(guide.department)].filter(Boolean).join(', ') || 'Colombia';
  const about = pickLocalized(guide.description, locale)?.text;
  const description = about ? about.slice(0, 155) : t('metaDescription', { name: guide.name, place });
  return {
    title: guide.name,
    description,
    alternates: {
      canonical: webPath('/guias/[slug]', locale, { slug }),
      languages: Object.fromEntries(routing.locales.map((l) => [l, webPath('/guias/[slug]', l, { slug })])),
    },
    openGraph: {
      title: guide.name,
      description,
      type: 'profile',
      ...(guide.coverUrl ? { images: [{ url: guide.coverUrl }] } : {}),
    },
  };
}

/** PAGE-01 y PAGE-02: página pública e indexable de un Guía aprobado, con su RNT visible. */
export default async function GuidePage({ params }: PageProps<'/[locale]/guias/[slug]'>) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const [guide, sports] = await Promise.all([getGuide(slug), publicApi<SportDto[]>('/v1/sports', [])]);
  if (!guide) notFound();

  const webUrl = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000';
  const about = pickLocalized(guide.description, locale);
  // Datos estructurados (schema.org): agencia de turismo local con su RNT y ubicación.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: guide.name,
    url: `${webUrl}${webPath('/guias/[slug]', locale, { slug })}`,
    ...(guide.logoUrl ? { logo: guide.logoUrl } : {}),
    ...(guide.coverUrl ? { image: guide.coverUrl } : {}),
    ...(about ? { description: about.text } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(guide.city ? { addressLocality: guide.city } : {}),
      ...(guide.department ? { addressRegion: departmentName(guide.department) } : {}),
      addressCountry: 'CO',
    },
    ...(guide.rntNumber ? { identifier: { '@type': 'PropertyValue', propertyID: 'RNT', value: guide.rntNumber } } : {}),
    knowsLanguage: guide.languages,
    sameAs: Object.values(guide.socialLinks).filter((link) => link.startsWith('http')),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <GuideProfile guide={guide} sports={sports} />
    </>
  );
}
