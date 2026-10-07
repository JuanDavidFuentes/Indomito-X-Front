import { useTranslations } from 'next-intl';
import { Logo } from '@/components/brand/logo';
import { Link } from '@/i18n/navigation';
import { HeaderFrame } from './header-frame';
import { LocaleSwitcher } from './locale-switcher';
import { ThemeToggle } from './theme-toggle';

export function SiteHeader() {
  const t = useTranslations();

  const links = [
    { href: '/buscar', label: t('nav.explore') },
    { href: { pathname: '/', hash: 'destinos' }, label: t('nav.destinations') },
    { href: { pathname: '/', hash: 'guias' }, label: t('nav.becomeHost') },
  ] as const;

  return (
    <HeaderFrame>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="rounded-md" aria-label={t('common.appName')}>
          <Logo />
        </Link>
        <nav aria-label={t('nav.mainMenu')} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map(({ href, label }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="inline-flex h-11 items-center rounded-full px-4 font-semibold transition-colors duration-150 hover:bg-current/10"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </HeaderFrame>
  );
}
