import { todayInPlatform, type CalendarResponse } from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { calendarRange, type CalendarView } from '@/components/calendar/calendar-range';
import { HostCalendar } from '@/components/calendar/host-calendar';
import { loadHostOr } from '@/components/host/panel-fallbacks';
import { routing } from '@/i18n/routing';
import { serverApi } from '@/lib/api/server';

export async function generateMetadata({ params }: PageProps<'/[locale]/panel/calendario'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'host.nav' });
  return { title: t('calendar') };
}

/** Calendario del Guía (AVAIL-04): `?mes=AAAA-MM`, `?vista=semana&dia=AAAA-MM-DD` y `?publicacion=`. */
export default async function CalendarPage({ searchParams }: PageProps<'/[locale]/panel/calendario'>) {
  const params = await searchParams;
  const today = todayInPlatform();
  const view: CalendarView = params.vista === 'semana' ? 'week' : 'month';
  const month = typeof params.mes === 'string' && /^\d{4}-\d{2}$/.test(params.mes) ? params.mes : today.slice(0, 7);
  const day = typeof params.dia === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.dia) ? params.dia : today;
  const anchor = view === 'week' ? day : `${month}-01`;
  const listing = typeof params.publicacion === 'string' && params.publicacion.length <= 40 ? params.publicacion : null;
  const range = calendarRange(view, anchor);
  const [loaded, calendar] = await Promise.all([
    loadHostOr('/panel/calendario'),
    serverApi<CalendarResponse>(`/v1/host/calendar?from=${range.from}&to=${range.to}${listing ? `&listingId=${listing}` : ''}`),
  ]);
  if ('fallback' in loaded) return loaded.fallback;
  return (
    <HostCalendar
      mine={loaded.mine}
      initial={calendar.ok ? calendar.data : null}
      initialView={view}
      initialAnchor={anchor}
      initialListing={calendar.ok ? listing : null}
    />
  );
}
