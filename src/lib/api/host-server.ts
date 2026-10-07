import 'server-only';
import type { AuthUser, MyHostResponse } from '@juandavidfuentes/indomitox-shared';
import { cache } from 'react';
import { serverApi } from './server';

/** Mi Guía para los componentes de servidor: el layout y la página lo piden una sola vez por solicitud. */
export const getMyHost = cache(() => serverApi<MyHostResponse>('/v1/host'));

/** Usuario de la sesión (o null) para los componentes de servidor. */
export const getSessionUser = cache(async (): Promise<AuthUser | null> => {
  const result = await serverApi<{ user: AuthUser | null }>('/v1/auth/session');
  return result.ok ? result.data.user : null;
});
