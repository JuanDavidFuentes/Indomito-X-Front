'use client';

import { safeNextPath, type AuthResponse } from '@juandavidfuentes/indomitox-shared';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPathname } from '@/i18n/navigation';
import type { routing } from '@/i18n/routing';
import { useSetSessionUser } from '@/lib/session';

/**
 * AUTH-07: a dónde volver después de ingresar o registrarse. `next` llega en la URL
 * (`/es/ingresar?next=/es/buscar?q=rafting`) y solo se aceptan rutas internas.
 */
export function useNextPath() {
  const params = useSearchParams();
  const next = params.get('next');
  return next ? safeNextPath(next) : null;
}

/** Guarda el usuario de la sesión y navega al destino (o a `fallback`). */
export function useCompleteSignIn() {
  const router = useRouter();
  const setUser = useSetSessionUser();
  const next = useNextPath();
  const locale = useLocale() as (typeof routing.locales)[number];

  /** `host`: quien eligió "ofrecer aventuras" sigue al alta de Guía (AUTH-04). */
  return (response: AuthResponse, fallback: 'home' | 'account' | 'host' = 'home') => {
    setUser(response.user);
    const href = fallback === 'host' ? '/panel/verificacion' : fallback === 'account' ? '/cuenta' : '/';
    const destination = next ?? getPathname({ href, locale });
    router.replace(destination);
    router.refresh();
  };
}
