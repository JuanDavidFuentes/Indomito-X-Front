'use client';

import type { AdminSportDto, ZoneDto } from '@juandavidfuentes/indomitox-shared';
import { MapPinArea, Mountains, type Icon } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { getPathname } from '@/i18n/navigation';
import type { routing } from '@/i18n/routing';
import { SportsAdmin } from './sports-admin';
import { ZonesAdmin } from './zones-admin';

export type CatalogSection = 'deportes' | 'zonas';
const SECTIONS: { key: CatalogSection; icon: Icon }[] = [
  { key: 'deportes', icon: Mountains },
  { key: 'zonas', icon: MapPinArea },
];

/** /admin/catalogo (ADM-03): pestañas de deportes y zonas; la pestaña queda en la URL. */
export function CatalogView({ sports, zones, initialSection }: { sports: AdminSportDto[]; zones: ZoneDto[]; initialSection: CatalogSection }) {
  const t = useTranslations('adminCatalog');
  const locale = useLocale() as (typeof routing.locales)[number];
  const [section, setSection] = useState<CatalogSection>(initialSection);
  const tabs = useRef<Record<CatalogSection, HTMLButtonElement | null>>({ deportes: null, zonas: null });

  useEffect(() => {
    const href = getPathname({ locale, href: { pathname: '/admin/catalogo', query: section === 'zonas' ? { seccion: 'zonas' } : {} } });
    window.history.replaceState(null, '', href);
  }, [locale, section]);

  // Flechas izquierda y derecha entre pestañas (patrón de pestañas de ARIA).
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const index = SECTIONS.findIndex((item) => item.key === section);
    const next = SECTIONS[(index + (event.key === 'ArrowRight' ? 1 : SECTIONS.length - 1)) % SECTIONS.length]!.key;
    setSection(next);
    tabs.current[next]?.focus();
  };

  return (
    <section aria-labelledby="catalog-title" className="grid grid-cols-1 gap-6">
      <div>
        <h2 id="catalog-title" className="font-display text-4xl leading-tight font-extrabold uppercase italic">
          {t('title')}
        </h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">{t('subtitle')}</p>
      </div>
      <div role="tablist" aria-label={t('title')} className="flex flex-wrap gap-2" onKeyDown={onKeyDown}>
        {SECTIONS.map(({ key, icon: TabIcon }) => {
          const active = section === key;
          return (
            <button
              key={key}
              ref={(element) => {
                tabs.current[key] = element;
              }}
              id={`tab-${key}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${key}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setSection(key)}
              className={`inline-flex h-11 items-center gap-2 rounded-full border px-5 font-semibold transition-colors duration-150 ${
                active ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'
              }`}
            >
              <TabIcon size={20} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
              {t(`tabs.${key}`)}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`panel-${section}`} aria-labelledby={`tab-${section}`}>
        {section === 'deportes' ? <SportsAdmin initial={sports} /> : <ZonesAdmin initial={zones} />}
      </div>
    </section>
  );
}
