import { HERO_FIELD_DATA } from '@juandavidfuentes/indomitox-shared';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/brand/logo';
import { TopoPattern } from '@/components/brand/topo-pattern';
import { Link } from '@/i18n/navigation';

export function SiteFooter() {
  const t = useTranslations();

  const links = [
    { href: '/buscar', label: t('nav.explore') },
    { href: { pathname: '/', hash: 'destinos' }, label: t('nav.destinations') },
    { href: { pathname: '/', hash: 'guias' }, label: t('nav.becomeHost') },
    { href: '/creditos', label: t('nav.credits') },
  ] as const;

  return (
    <footer className="relative isolate overflow-hidden bg-night text-night-foreground dark:border-t dark:border-border">
      <TopoPattern variant="footer" className="absolute inset-0 -z-10 size-full text-brand/20" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <Logo markClassName="size-10" />
            <p className="font-display text-3xl leading-none font-extrabold text-accent uppercase italic sm:text-4xl">
              {t('common.tagline')}
            </p>
            <p className="max-w-md text-night-foreground/80">{t('footer.madeIn')}</p>
          </div>
          <nav aria-label={t('nav.mainMenu')}>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-1 sm:flex sm:gap-2">
              {links.map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="inline-flex h-11 items-center rounded-full font-semibold text-night-foreground/90 transition-colors hover:text-accent sm:px-3"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-night-foreground/15 pt-6 text-sm text-night-foreground/75 sm:flex-row sm:items-center sm:justify-between">
          <p>{t('footer.rights', { year: new Date().getFullYear() })}</p>
          <p className="font-display tracking-[0.14em]">
            San Gil · {t('home.heroCoordinates')} · {t('home.heroAltitude', { meters: HERO_FIELD_DATA.altitudeM })}
          </p>
        </div>
      </div>
    </footer>
  );
}
