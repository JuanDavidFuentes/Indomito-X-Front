'use client';

import {
  parseSearchParams,
  searchQueryToParams,
  toQueryString,
  type ListingCardDto,
  type ListingPinsResponse,
  type ListingSearchResponse,
  type SearchPlace,
  type SearchQuery,
} from '@juandavidfuentes/indomitox-shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api/client';

/** La consulta de búsqueda tal como está en la URL (SRCH-05). */
export function useSearchQuery(): SearchQuery {
  const params = useSearchParams();
  const key = params.toString();
  return useMemo(() => parseSearchParams(Object.fromEntries(new URLSearchParams(key))), [key]);
}

/**
 * Cambia la búsqueda en la URL sin recargar la página: `pushState` deja cada búsqueda en el
 * historial (atrás vuelve a la anterior) y Next sincroniza `useSearchParams`.
 */
export function useSetSearchQuery() {
  return useCallback((next: Partial<SearchQuery>, options: { replace?: boolean } = {}) => {
    const qs = toQueryString(searchQueryToParams(next));
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    if (options.replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
  }, []);
}

const queryString = (query: Partial<SearchQuery>) => toQueryString(searchQueryToParams(query));

/** Resultados paginados; el servidor entrega la primera carga. */
export function useSearchResults(query: SearchQuery, initial?: { qs: string; data: ListingSearchResponse | null }) {
  const qs = queryString(query);
  return useQuery({
    queryKey: ['search', qs],
    queryFn: ({ signal }) => api<ListingSearchResponse>(`/v1/search${qs ? `?${qs}` : ''}`, { signal }),
    initialData: initial && initial.qs === qs && initial.data ? initial.data : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** Pines del mapa: la misma búsqueda sin página ni orden. */
export function useSearchPins(query: SearchQuery) {
  const qs = queryString({ ...query, page: 1, sort: 'RELEVANCE' });
  return useQuery({
    queryKey: ['search-pins', qs],
    queryFn: ({ signal }) => api<ListingPinsResponse>(`/v1/search/pins${qs ? `?${qs}` : ''}`, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** Tarjeta del pin seleccionado en el mapa. */
export function useListingCard(id: string | null) {
  return useQuery({
    queryKey: ['search-card', id],
    queryFn: async () => (await api<ListingCardDto[]>(`/v1/search/cards?ids=${id}`))[0] ?? null,
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

/** Valor que cambia solo después de `delay` ms sin cambios (autocompletado). */
export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Destinos que empiezan por el texto (zonas y municipios con sus aventuras). Sin texto, las zonas. */
export function usePlaceSuggestions(text: string, enabled = true) {
  const q = useDebounced(text.trim());
  return useQuery({
    queryKey: ['places', q.toLowerCase()],
    queryFn: ({ signal }) => api<SearchPlace[]>(`/v1/places?limit=8${q ? `&q=${encodeURIComponent(q)}` : ''}`, { signal }),
    enabled: enabled && (q.length === 0 || q.length >= 2),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}
