'use client';

import type { HostDraftInput, MyHostResponse } from '@juandavidfuentes/indomitox-shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api/client';
import { SESSION_KEY } from './session';

export const HOST_KEY = ['host'] as const;

/** Mi Guía (panel). El servidor lo entrega en la primera carga. */
export function useMyHost(initialData: MyHostResponse) {
  return useQuery({
    queryKey: HOST_KEY,
    queryFn: () => api<MyHostResponse>('/v1/host'),
    initialData,
    staleTime: 30_000,
  });
}

/** Guarda la respuesta de la API (y refresca la sesión del encabezado si cambió el estado). */
export function useStoreHost() {
  const queryClient = useQueryClient();
  return useCallback(
    (data: MyHostResponse) => {
      const previous = queryClient.getQueryData<MyHostResponse>(HOST_KEY);
      queryClient.setQueryData(HOST_KEY, data);
      if (previous?.host.status !== data.host.status || previous?.host.slug !== data.host.slug) {
        void queryClient.invalidateQueries({ queryKey: SESSION_KEY });
      }
    },
    [queryClient],
  );
}

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Autoguardado del alta (HOST-01): junta los cambios y los envía con `PATCH /v1/host` al
 * dejar de escribir (`delay`) o de inmediato con `flush()`. Si la API rechaza un campo,
 * `onError` lo recibe para mostrarlo junto al campo.
 */
export function useHostAutosave({ delay = 800, onError }: { delay?: number; onError?: (error: unknown) => void } = {}) {
  const storeHost = useStoreHost();
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const pending = useRef<HostDraftInput>({});
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
    const request = api<MyHostResponse>('/v1/host', { method: 'PATCH', body: patch })
      .then((data) => {
        storeHost(data);
        setStatus(Object.keys(pending.current).length ? 'saving' : 'saved');
      })
      .catch((error: unknown) => {
        setStatus('error');
        onErrorRef.current?.(error);
      });
    inFlight.current = request;
    await request;
  }, [storeHost]);

  const queue = useCallback(
    (patch: HostDraftInput, immediate = false) => {
      pending.current = { ...pending.current, ...patch };
      setStatus('saving');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), immediate ? 0 : delay);
    },
    [delay, flush],
  );

  // Al salir del paso se guarda lo pendiente.
  useEffect(
    () => () => {
      if (timer.current) void flush();
    },
    [flush],
  );

  return { status, queue, flush };
}
