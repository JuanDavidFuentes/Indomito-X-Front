'use client';

import { ArrowSquareOut, Browser, CalendarDots, Compass, Gauge, ShieldCheck, UsersThree, type Icon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

type PanelHref = '/panel' | '/panel/publicaciones' | '/panel/calendario' | '/panel/verificacion' | '/panel/pagina' | '/panel/equipo';

const ITEMS: { href: PanelHref; icon: Icon; key: 'overview' | 'listings' | 'calendar' | 'verification' | 'page' | 'team' }[] = [
  { href: '/panel', icon: Gauge, key: 'overview' },
  { href: '/panel/publicaciones', icon: Compass, key: 'listings' },
  { href: '/panel/calendario', icon: CalendarDots, key: 'calendar' },
  { href: '/panel/verificacion', icon: ShieldCheck, key: 'verification' },
  { href: '/panel/pagina', icon: Browser, key: 'page' },
  { href: '/panel/equipo', icon: UsersThree, key: 'team' },
];

/**
 * Navegación del panel del Guía: barra lateral desde 1024 px (MASTER §8) y píldoras que se
 * acomodan en filas en pantallas pequeñas (sin desplazamiento horizontal).
 */
export function PanelNav({ publicSlug }: { publicSlug: string | null }) {
  const t = useTranslations('host.nav');
  const pathname = usePathname();

  return (
    <nav aria-label={t('sectionsLabel')} className="lg:sticky lg:top-24 lg:self-start">
      <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
        {ITEMS.map(({ href, icon: ItemIcon, key }) => {
          // El editor de una publicación (/panel/publicaciones/…) marca "Publicaciones".
          const active = href === '/panel' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-2.5 rounded-full border px-4 py-2 font-semibold transition-colors duration-150 lg:rounded-lg lg:border-transparent lg:px-3 ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <ItemIcon size={20} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                {t(key)}
              </Link>
            </li>
          );
        })}
        {publicSlug ? (
          <li className="lg:mt-3 lg:border-t lg:pt-3">
            <Link
              href={{ pathname: '/guias/[slug]', params: { slug: publicSlug } }}
              className="flex min-h-11 items-center gap-2.5 rounded-full border border-border px-4 py-2 font-semibold text-secondary transition-colors duration-150 hover:bg-muted lg:rounded-lg lg:border-transparent lg:px-3"
            >
              <ArrowSquareOut size={20} aria-hidden="true" />
              {t('viewPublicPage')}
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
