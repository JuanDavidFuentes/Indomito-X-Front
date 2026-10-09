import 'server-only';
import {
  landingWebPath,
  localizedOr,
  sportSlugFor,
  type ListingSearchResponse,
  type Locale,
  type SearchFacetsResponse,
  type SearchPlace,
  type SportDto,
} from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getFacets, getPlace, getSports, searchListings, sportBySlug, WEB_URL } from '@/lib/api/public';
import { landingAlternates } from './sport-landing';

export interface LandingData {
  sport: SportDto;
  sports: SportDto[];
  place: SearchPlace | null;
  results: ListingSearchResponse | null;
  otherPlaces: SearchFacetsResponse['places'];
  otherSports: SearchFacetsResponse['sports'];
}

/** Lo que pinta `/{deporte}` o `/{deporte}/{lugar}` (null si el deporte o el lugar no existen). */
export async function loadLanding(sportSlug: string, placeSlug: string | null): Promise<LandingData | null> {
  const sports = await getSports();
  const sport = sportBySlug(sports, sportSlug);
  if (!sport) return null;
  const place = placeSlug ? await getPlace(placeSlug) : null;
  if (placeSlug && !place) return null;
  const [results, bySport, byPlace] = await Promise.all([
    searchListings({ sport: sport.key, ...(place ? { place: place.slug } : {}) }, 300),
    getFacets(sport.key),
    place ? getFacets(undefined, place.slug) : Promise.resolve(null),
  ]);
  return {
    sport,
    sports,
    place,
    results,
    otherPlaces: bySport.places.filter((other) => other.slug !== place?.slug).slice(0, 12),
    otherSports: (byPlace?.sports ?? []).filter((other) => other.key !== sport.key).slice(0, 12),
  };
}

/** 404 si no existe; si la dirección del deporte no es la de este idioma, a la canónica (301/308). */
export async function requireLanding(locale: Locale, sportSlug: string, placeSlug: string | null): Promise<LandingData> {
  const data = await loadLanding(sportSlug, placeSlug);
  if (!data) notFound();
  const canonical = sportSlugFor(data.sport.slugs, locale);
  if (canonical !== sportSlug) permanentRedirect(landingWebPath(data.sport.slugs, locale, placeSlug));
  return data;
}

export async function landingMetadata(locale: Locale, sportSlug: string, placeSlug: string | null): Promise<Metadata> {
  const data = await loadLanding(sportSlug, placeSlug);
  if (!data) return {};
  const t = await getTranslations({ locale, namespace: 'landing' });
  const sport = localizedOr(data.sport.names, locale, data.sport.key);
  const place = data.place ? localizedOr(data.place.names, locale, data.place.slug) : null;
  const count = data.results?.total ?? 0;
  const title = place ? t('sportPlaceTitle', { sport, place }) : t('sportTitle', { sport });
  const description = place ? t('metaSportPlace', { sport, place, count }) : t('metaSport', { sport, count });
  const languages = landingAlternates(data.sport, data.place?.slug ?? null);
  const cover = data.results?.items[0]?.cover?.variants.find((variant) => variant.format === 'jpeg');
  return {
    title,
    description,
    // Una página sin aventuras es contenido vacío: no se indexa hasta que tenga.
    robots: count === 0 ? { index: false, follow: true } : undefined,
    alternates: { canonical: languages[locale], languages: { ...languages, 'x-default': languages.es } },
    openGraph: { title, description, type: 'website', locale, url: languages[locale], ...(cover ? { images: [{ url: cover.url, width: cover.width, height: cover.height }] } : {}) },
  };
}

/** JSON-LD: lista de las aventuras (ItemList) y migas de pan. */
export function landingJsonLd(data: LandingData, locale: Locale): object[] {
  const sport = localizedOr(data.sport.names, locale, data.sport.key);
  const place = data.place ? localizedOr(data.place.names, locale, data.place.slug) : null;
  const items = data.results?.items ?? [];
  const crumbs = [
    { name: 'Indómito X', item: `${WEB_URL}/${locale}` },
    { name: sport, item: `${WEB_URL}${landingWebPath(data.sport.slugs, locale)}` },
    ...(place && data.place ? [{ name: place, item: `${WEB_URL}${landingWebPath(data.sport.slugs, locale, data.place.slug)}` }] : []),
  ];
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: place ? `${sport} · ${place}` : sport,
      numberOfItems: data.results?.total ?? 0,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${WEB_URL}/${locale}/${sportSlugFor(item.path.sportSlugs, locale)}/${item.path.placeSlug}/${item.path.slug}`,
        name: localizedOr(item.title, locale, item.slug),
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })),
    },
  ];
}
