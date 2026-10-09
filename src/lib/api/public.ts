import 'server-only';
import {
  searchQueryToParams,
  toQueryString,
  type FxRatesResponse,
  type ListingSearchResponse,
  type PublicListingDetail,
  type SearchFacetsResponse,
  type SearchPlace,
  type SearchQuery,
  type SitemapResponse,
  type SportDto,
} from '@juandavidfuentes/indomitox-shared';
import { cache } from 'react';
import { publicApi, publicResource } from './server';

/*
 * Lecturas públicas del servidor de Next (F4): catálogo, tasas, búsqueda, lugares y detalle. Se
 * cachean unos minutos (ISR) y `cache` evita pedir dos veces lo mismo en un mismo render
 * (metadatos + página).
 */

const SERVER_API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const getSports = cache(() => publicApi<SportDto[]>('/v1/sports', []));

export const getFxRates = cache(() => publicApi<FxRatesResponse | null>('/v1/fx/rates', null));

/** Búsqueda (null si la API no responde). `revalidate` corto: los cupos y precios cambian. */
export const searchListings = cache(async (query: Partial<SearchQuery>, revalidate = 60): Promise<ListingSearchResponse | null> => {
  const qs = toQueryString(searchQueryToParams(query));
  try {
    const res = await fetch(`${SERVER_API_URL}/v1/search${qs ? `?${qs}` : ''}`, { next: { revalidate } });
    return res.ok ? ((await res.json()) as ListingSearchResponse) : null;
  } catch {
    return null;
  }
});

export const getPlace = cache((slug: string) => publicResource<SearchPlace>(`/v1/places/${encodeURIComponent(slug)}`, 300));

export const getFeaturedPlaces = cache(() => publicApi<SearchPlace[]>('/v1/places?limit=12', []));

export const getFacets = cache((sport?: string, place?: string) => {
  const qs = toQueryString({ ...(sport ? { sport } : {}), ...(place ? { place } : {}) });
  return publicApi<SearchFacetsResponse>(`/v1/search/facets${qs ? `?${qs}` : ''}`, { sports: [], places: [], types: [] });
});

export const getListing = cache((slug: string) => publicResource<PublicListingDetail>(`/v1/listings/${encodeURIComponent(slug)}`, 300));

export const getSitemap = () => publicApi<SitemapResponse>('/v1/sitemap', { listings: [], landings: [], hosts: [] });

/** El deporte de una dirección en cualquier idioma (`/en/canyoning` o `/es/torrentismo`). */
export function sportBySlug(sports: SportDto[], slug: string): SportDto | null {
  return sports.find((sport) => Object.values(sport.slugs).includes(slug)) ?? null;
}

/** URL absoluta de la web (metadatos, JSON-LD y sitemap). */
export const WEB_URL = (process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
