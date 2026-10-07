'use client';

import type { MeResponse, SavedParticipant } from '@juandavidfuentes/indomitox-shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useSetSessionUser } from '@/lib/session';

export const ME_KEY = ['me'] as const;
export const PARTICIPANTS_KEY = ['me', 'participants'] as const;

/** Perfil completo; el servidor lo entrega en la primera carga (sin parpadeo). */
export function useMe(initialData: MeResponse) {
  return useQuery({ queryKey: ME_KEY, queryFn: () => api<MeResponse>('/v1/me'), initialData, staleTime: 30_000 });
}

export function useParticipants(initialData: SavedParticipant[]) {
  return useQuery({
    queryKey: PARTICIPANTS_KEY,
    queryFn: () => api<SavedParticipant[]>('/v1/me/participants'),
    initialData,
    staleTime: 30_000,
  });
}

/** Guarda la respuesta de la API en la caché del perfil y en la sesión del encabezado. */
export function useStoreMe() {
  const queryClient = useQueryClient();
  const setSessionUser = useSetSessionUser();
  return (me: MeResponse) => {
    queryClient.setQueryData(ME_KEY, me);
    setSessionUser(me.user);
  };
}
