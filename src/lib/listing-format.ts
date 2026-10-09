import type { ListingType, PriceUnit } from '@juandavidfuentes/indomitox-shared';

/*
 * Formatos de las publicaciones que comparten los componentes de servidor (detalle, páginas de
 * aterrizaje) y de cliente (tarjetas, mapa). Funciones puras: reciben el traductor de next-intl
 * (`useTranslations()` o `getTranslations()`).
 */

/** Traductor sin el tipado estricto de claves (las claves se arman en tiempo de ejecución). */
export type Translate = (key: string, values?: Record<string, string | number | Date>) => string;

export interface DurationInput {
  type: ListingType;
  durationMinutes: number | null;
  durationDays: number | null;
  sessionsCount: number | null;
  priceUnit: PriceUnit;
}

/** "45 min", "3 h", "1 h 30 min". */
export function minutesText(t: Translate, value: number): string {
  if (value < 60) return t('listing.durationMinutes', { minutes: value });
  if (value % 60 === 0) return t('listing.durationHours', { hours: value / 60 });
  return t('listing.durationHoursMinutes', { hours: Math.floor(value / 60), minutes: value % 60 });
}

/**
 * Duración legible: "3 h", "2 días", "3 sesiones · 3 h"; los alquileres dicen cómo se cobran y
 * los productos su tipo.
 */
export function durationText(t: Translate, listing: DurationInput): string {
  switch (listing.type) {
    case 'PACKAGE':
      return listing.durationDays ? t('listing.durationDays', { days: listing.durationDays }) : t('listingType.PACKAGE');
    case 'COURSE': {
      const sessions = listing.sessionsCount ? t('listing.sessions', { count: listing.sessionsCount }) : t('listingType.COURSE');
      return listing.durationMinutes ? `${sessions} · ${minutesText(t, listing.durationMinutes)}` : sessions;
    }
    case 'EXPERIENCE':
      return listing.durationMinutes ? minutesText(t, listing.durationMinutes) : t('listingType.EXPERIENCE');
    case 'RENTAL':
      return `${t('listingType.RENTAL')} · ${t(`priceUnit.${listing.priceUnit}`)}`;
    default:
      return t('listingType.PRODUCT');
  }
}

/** "a 1,2 km" con el formato del idioma. */
export function distanceText(t: Translate, localeTag: string, meters: number): string {
  const km = new Intl.NumberFormat(localeTag, { maximumFractionDigits: meters < 10_000 ? 1 : 0 }).format(Math.max(meters, 100) / 1000);
  return t('listing.distanceKm', { km });
}
