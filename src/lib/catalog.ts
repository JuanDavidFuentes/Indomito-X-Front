'use client';

import {
  pickLocalized,
  type Locale,
  type MunicipalityDto,
  type SportDto,
} from '@juandavidfuentes/indomitox-shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { api } from './api/client';

export const SPORTS_KEY = ['sports'] as const;

/** Catálogo de deportes activos (cambia poco: se guarda una hora). */
export function useSportsCatalog(initialData?: SportDto[]) {
  return useQuery({
    queryKey: SPORTS_KEY,
    queryFn: () => api<SportDto[]>('/v1/sports'),
    staleTime: 60 * 60_000,
    ...(initialData?.length ? { initialData } : {}),
  });
}

/**
 * Nombre visible de un deporte: el del catálogo (lo edita el administrador, ADM-03), si no el de
 * i18n (`sports.<KEY>`) y, como último recurso, la clave.
 */
export function useSportName(catalog?: readonly SportDto[]) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { data } = useSportsCatalog();
  const sports = catalog ?? data;
  return useCallback(
    (key: string) => {
      const fromCatalog = pickLocalized(sports?.find((sport) => sport.key === key)?.names, locale)?.text;
      if (fromCatalog) return fromCatalog;
      return t.has(`sports.${key}` as never) ? t(`sports.${key}` as never) : key;
    },
    [sports, locale, t],
  );
}

/** Autocompletado de municipios del DANE (sin tildes). Con menos de 2 letras no busca. */
export function useMunicipalitySearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['municipalities', q.toLowerCase()],
    queryFn: ({ signal }) => api<MunicipalityDto[]>(`/v1/municipalities?q=${encodeURIComponent(q)}&limit=12`, { signal }),
    enabled: q.length >= 2,
    staleTime: 60 * 60_000,
    placeholderData: keepPreviousData,
  });
}

/** Un municipio por su código (para mostrar el elegido). */
export function useMunicipality(code: string | null | undefined) {
  return useQuery({
    queryKey: ['municipality', code],
    queryFn: () => api<MunicipalityDto>(`/v1/municipalities/${code}`),
    enabled: Boolean(code),
    staleTime: Infinity,
  });
}
