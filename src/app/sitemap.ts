import {
  landingWebPath,
  listingWebPath,
  LOCALES,
  webPath,
  type Locale,
  type WebPathname,
} from '@juandavidfuentes/indomitox-shared';
import type { MetadataRoute } from 'next';
import { getSitemap, WEB_URL } from '@/lib/api/public';

/** Se regenera cada 10 minutos (las publicaciones nuevas entran solas). */
export const revalidate = 600;

type Entry = MetadataRoute.Sitemap[number];

/**
 * Una entrada por idioma, cada una con sus versiones en los otros idiomas (`hreflang`) y la del
 * español como `x-default`.
 */
function localized(build: (locale: Locale) => string, extra: Omit<Entry, 'url' | 'alternates'> = {}): Entry[] {
  const languages = Object.fromEntries(LOCALES.map((locale) => [locale, `${WEB_URL}${build(locale)}`]));
  return LOCALES.map((locale) => ({
    url: `${WEB_URL}${build(locale)}`,
    alternates: { languages: { ...languages, 'x-default': languages.es! } },
    ...extra,
  }));
}

const STATIC_PAGES: WebPathname[] = ['/buscar', '/creditos', '/legal/terminos', '/legal/privacidad'];

/** sitemap.xml (RNF de SEO): portada, búsqueda, páginas de aterrizaje, publicaciones y Guías. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getSitemap();
  return [
    ...localized((locale) => `/${locale}`, { changeFrequency: 'daily', priority: 1 }),
    ...STATIC_PAGES.flatMap((pathname) => localized((locale) => webPath(pathname, locale), { changeFrequency: 'monthly', priority: 0.3 })),
    ...data.landings
      .filter((landing) => landing.count > 0)
      .flatMap((landing) =>
        localized((locale) => landingWebPath(landing.sportSlugs, locale, landing.placeSlug), {
          changeFrequency: 'daily',
          priority: landing.placeSlug ? 0.8 : 0.7,
        }),
      ),
    ...data.listings.flatMap((listing) =>
      localized((locale) => listingWebPath(listing.path, locale), { lastModified: listing.updatedAt, changeFrequency: 'weekly', priority: 0.9 }),
    ),
    ...data.hosts.flatMap((host) =>
      localized((locale) => webPath('/guias/[slug]', locale, { slug: host.slug }), { lastModified: host.updatedAt, changeFrequency: 'weekly', priority: 0.6 }),
    ),
  ];
}
