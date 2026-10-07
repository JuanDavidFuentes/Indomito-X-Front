import { AUTH_COOKIES } from '@juandavidfuentes/indomitox-shared';
import { ApiError } from './errors';

/** URL pública de la API (la ve el navegador). */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * ¿Hay sesión? Lo dice la cookie `ix_session`, que no es httpOnly y no contiene nada secreto:
 * los tokens viajan en cookies httpOnly que el JavaScript de la página nunca ve.
 */
export function hasSessionHint(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((cookie) => cookie.startsWith(`${AUTH_COOKIES.session}=`));
}

let refreshing: Promise<boolean> | null = null;

/** Renueva la sesión una sola vez aunque varias peticiones fallen al mismo tiempo. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${API_URL}/v1/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Llama a la API desde el navegador con las cookies de sesión (CORS con credenciales).
 * Si el token de acceso venció (401) y hay sesión, la renueva y reintenta una vez.
 */
export async function api<T = void>(path: string, options: ApiOptions = {}): Promise<T> {
  const send = () =>
    fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers: options.body === undefined ? undefined : { 'content-type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });

  let res: Response;
  try {
    res = await send();
    if (res.status === 401 && hasSessionHint() && !path.startsWith('/v1/auth/')) {
      const error = await ApiError.fromResponse(res.clone());
      if (error.code === 'UNAUTHORIZED' && (await refreshSession())) res = await send();
    }
  } catch (cause) {
    if ((cause as Error).name === 'AbortError') throw cause;
    throw ApiError.network(cause);
  }

  if (!res.ok) throw await ApiError.fromResponse(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
