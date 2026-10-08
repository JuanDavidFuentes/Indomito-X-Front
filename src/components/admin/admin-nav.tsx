'use client';

import { Books, IdentificationBadge, Scales, type Icon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

const ITEMS: { href: '/admin/guias' | '/admin/moderacion' | '/admin/catalogo'; icon: Icon; key: 'hosts' | 'moderation' | 'catalog' }[] = [
  { href: '/admin/guias', icon: IdentificationBadge, key: 'hosts' },
  { href: '/admin/moderacion', icon: Scales, key: 'moderation' },
  { href: '/admin/catalogo', icon: Books, key: 'catalog' },
];

/** Secciones de administración. F7 agrega usuarios, finanzas, configuración y auditoría. */
export function AdminNav() {
  const t = useTranslations('admin.nav');
  const pathname = usePathname();
  return (
    <nav aria-label={t('sectionsLabel')} className="lg:sticky lg:top-24 lg:self-start">
      <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
        {ITEMS.map(({ href, icon: ItemIcon, key }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-2.5 rounded-full border px-4 py-2 font-semibold transition-colors duration-150 lg:rounded-lg lg:border-transparent lg:px-3 ${
                  active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <ItemIcon size={20} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
