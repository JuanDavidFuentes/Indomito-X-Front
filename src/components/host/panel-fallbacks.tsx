import type { MyHostResponse, WebPathname } from '@juandavidfuentes/indomitox-shared';
import { WarningCircle } from '@phosphor-icons/react/ssr';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { getPathname, Link, redirect } from '@/i18n/navigation';
import type { routing } from '@/i18n/routing';
import { getMyHost } from '@/lib/api/host-server';
import { StartHost } from './start-host';

type PanelPath = Extract<
  WebPathname,
  '/panel' | '/panel/verificacion' | '/panel/pagina' | '/panel/equipo' | '/panel/publicaciones' | '/panel/calendario'
>;

/**
 * Lo común de las páginas del panel: si la sesión venció, a ingresar y de vuelta (AUTH-07); si
 * aún no tiene Guía, la invitación a empezar el alta; si la API falla, un error con "Reintentar".
 */
export async function loadHostOr(pathname: PanelPath): Promise<{ mine: MyHostResponse } | { fallback: ReactNode }> {
  const result = await getMyHost();
  if (result.ok) return { mine: result.data };
  const locale = (await getLocale()) as (typeof routing.locales)[number];
  if (result.status === 401) {
    redirect({ href: { pathname: '/ingresar', query: { next: getPathname({ href: pathname, locale }) } }, locale });
  }
  if (result.status === 404) return { fallback: <StartHost /> };
  const t = await getTranslations();
  return {
    fallback: (
      <section className="grid gap-4 rounded-xl border border-border bg-card p-8 text-center">
        <WarningCircle size={44} weight="duotone" className="mx-auto text-destructive" aria-hidden="true" />
        <h2 className="font-display text-3xl font-extrabold uppercase italic">{t('errors.SERVICE_UNAVAILABLE')}</h2>
        <Link href={pathname} className="font-semibold text-primary underline-offset-4 hover:underline">
          {t('common.retry')}
        </Link>
      </section>
    ),
  };
}
