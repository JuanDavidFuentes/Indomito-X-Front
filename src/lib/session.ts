'use client';

import type { AuthUser } from '@juandavidfuentes/indomitox-shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api, hasSessionHint, refreshSession } from './api/client';

export const SESSION_KEY = ['session'] as const;

async function fetchSessionUser(): Promise<AuthUser | null> {
  if (!hasSessionHint()) return null;
  const { user } = await api<{ user: AuthUser | null }>('/v1/auth/session');
  if (user) return user;
  // El token de acceso venció: se renueva con la cookie httpOnly y se vuelve a preguntar.
  if (!(await refreshSession())) return null;
  return (await api<{ user: AuthUser | null }>('/v1/auth/session')).user;
}

/** Usuario de la sesión en el navegador (null si no hay sesión). Lo comparten el encabezado y las páginas. */
export function useSession() {
  return useQuery({ queryKey: SESSION_KEY, queryFn: fetchSessionUser, staleTime: 60_000 });
}

/** Tras ingresar, registrarse o editar el perfil: actualiza el usuario sin volver a pedirlo. */
export function useSetSessionUser() {
  const queryClient = useQueryClient();
  return (user: AuthUser | null) => queryClient.setQueryData(SESSION_KEY, user);
}

/** Cierra la sesión (o todas, con `everywhere`) y refresca la página actual. */
export function useSignOut() {
  const setUser = useSetSessionUser();
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: ({ everywhere = false }: { everywhere?: boolean } = {}) =>
      api(everywhere ? '/v1/auth/logout-all' : '/v1/auth/logout', { method: 'POST' }),
    onSettled: () => {
      setUser(null);
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== SESSION_KEY[0] });
      router.refresh();
    },
  });
}
