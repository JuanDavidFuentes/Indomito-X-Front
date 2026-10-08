'use client';

import {
  type HostListingFilter,
  type HostListingResponse,
  type HostListingsResponse,
  type ListingAvailabilityResponse,
  type ListingDraftInput,
  type ListingHostAction,
} from '@juandavidfuentes/indomitox-shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api/client';
import type { AutosaveStatus } from './host';

export const LISTINGS_KEY = ['host', 'listings'] as const;
export const listingKey = (id: string) => ['host', 'listing', id] as const;
export const availabilityKey = (id: string) => ['host', 'listing', id, 'availability'] as const;
export const CALENDAR_KEY = ['host', 'calendar'] as const;

/** Mis publicaciones con un filtro de estado (el servidor entrega la primera carga). */
export function useHostListings(filter: HostListingFilter, initialData?: HostListingsResponse) {
  return useQuery({
    queryKey: [...LISTINGS_KEY, filter],
    queryFn: () => api<HostListingsResponse>(`/v1/host/listings?status=${filter}`),
    initialData,
    staleTime: 15_000,
  });
}

/** Una publicación con su progreso, bloqueos y acciones. */
export function useListing(id: string, initialData: HostListingResponse) {
  return useQuery({
    queryKey: listingKey(id),
    queryFn: () => api<HostListingResponse>(`/v1/host/listings/${id}`),
    initialData,
    staleTime: 10_000,
    // Mientras una foto se procesa (variantes en segundo plano), se consulta cada 2 s.
    refetchInterval: (query) => (query.state.data?.listing.photos.some((photo) => photo.status === 'PROCESSING') ? 2_000 : false),
  });
}

/** Guarda la respuesta de la API y marca como viejas la lista y el calendario. */
export function useStoreListing() {
  const queryClient = useQueryClient();
  return useCallback(
    (data: HostListingResponse) => {
      queryClient.setQueryData(listingKey(data.listing.id), data);
      void queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
    },
    [queryClient],
  );
}

/**
 * Autoguardado del editor (como el del alta): junta los cambios y los envía con
 * `PATCH /v1/host/listings/:id` al dejar de escribir o de inmediato con `immediate`.
 */
export function useListingAutosave(listingId: string, { delay = 800, onError }: { delay?: number; onError?: (error: unknown) => void } = {}) {
  const storeListing = useStoreListing();
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const pending = useRef<ListingDraftInput>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const flush = useCallback(async (): Promise<void> => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    await inFlight.current;
    const patch = pending.current;
    if (Object.keys(patch).length === 0) return;
    pending.current = {};
    setStatus('saving');
    const request = api<HostListingResponse>(`/v1/host/listings/${listingId}`, { method: 'PATCH', body: patch })
      .then((data) => {
        storeListing(data);
        setStatus(Object.keys(pending.current).length ? 'saving' : 'saved');
      })
      .catch((error: unknown) => {
        setStatus('error');
        onErrorRef.current?.(error);
      });
    inFlight.current = request;
    await request;
  }, [listingId, storeListing]);

  const queue = useCallback(
    (patch: ListingDraftInput, immediate = false) => {
      pending.current = { ...pending.current, ...patch };
      setStatus('saving');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), immediate ? 0 : delay);
    },
    [delay, flush],
  );

  useEffect(
    () => () => {
      if (timer.current) void flush();
    },
    [flush],
  );

  return { status, queue, flush };
}

/** Reglas, horarios sueltos y próximos horarios de una publicación. */
export function useListingAvailability(listingId: string, enabled = true) {
  return useQuery({
    queryKey: availabilityKey(listingId),
    queryFn: () => api<ListingAvailabilityResponse>(`/v1/host/listings/${listingId}/availability`),
    enabled,
    staleTime: 10_000,
  });
}

/** Publicar, pausar, reanudar, archivar, restaurar o retirar de moderación. */
export function transitionListing(listingId: string, action: ListingHostAction) {
  return api<HostListingResponse>(`/v1/host/listings/${listingId}/transition`, { method: 'POST', body: { action } });
}

/** "$80.000" escrito por el Guía (pesos, con o sin puntos) → unidades menores, o null si no es un número. */
export function pesosToMinor(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const digits = String(value).replace(/[^\d]/g, '');
  return digits ? Number(digits) * 100 : null;
}

/** Unidades menores → pesos sin decimales para un campo de texto. */
export function minorToPesos(minor: number | null | undefined): string {
  return minor === null || minor === undefined ? '' : String(Math.round(minor / 100));
}
