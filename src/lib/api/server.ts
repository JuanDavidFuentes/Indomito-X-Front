import 'server-only';
import { cookies } from 'next/headers';

/** URL de la API para el servidor de Next (puede ser una red interna en producción). */
const SERVER_API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type ServerApiResult<T> = { ok: true; data: T } | { ok: false; status: number };

/**
 * Lectura desde un componente de servidor reenviando las cookies de sesión del navegador
 * (PLAN §8). Las páginas que la usan son dinámicas. El proxy ya renovó la sesión si hacía falta.
 */
export async function serverApi<T>(path: string): Promise<ServerApiResult<T>> {
  const cookieHeader = (await cookies()).toString();
  try {
    const res = await fetch(`${SERVER_API_URL}${path}`, {
      headers: { cookie: cookieHeader, accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, status: 503 };
  }
}

/**
 * Recurso público que puede no existir (p. ej. la página de un Guía): se cachea `revalidate`
 * segundos (ISR). Distingue 404 (no existe) de la API caída (lanza el error).
 */
export async function publicResource<T>(path: string, revalidate: number): Promise<T | null> {
  const res = await fetch(`${SERVER_API_URL}${path}`, { next: { revalidate } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`La API respondió ${res.status} en ${path}`);
  return (await res.json()) as T;
}

/** Datos públicos y poco cambiantes (métodos de ingreso, catálogo): se cachean unos minutos. */
export async function publicApi<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${SERVER_API_URL}${path}`, { next: { revalidate: 300 } });
    return res.ok ? ((await res.json()) as T) : fallback;
  } catch {
    // Sin API (por ejemplo durante `next build`): la página sale con el valor por defecto.
    return fallback;
  }
}
