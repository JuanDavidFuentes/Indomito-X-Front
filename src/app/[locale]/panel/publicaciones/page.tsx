import { HOST_LISTING_FILTERS, type HostListingFilter, type HostListingsResponse } from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { loadHostOr } from '@/components/host/panel-fallbacks';
import { ListingsView } from '@/components/listings/listings-view';
import { routing } from '@/i18n/routing';
import { serverApi } from '@/lib/api/server';

export async function generateMetadata({ params }: PageProps<'/[locale]/panel/publicaciones'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'host.nav' });
  return { title: t('listings') };
}

const EMPTY: HostListingsResponse = { items: [], counts: { DRAFT: 0, IN_MODERATION: 0, PUBLISHED: 0, PAUSED: 0, ARCHIVED: 0 } };

/** Publicaciones del Guía (LIST-01 a LIST-07). El filtro de estado llega en la URL (`?estado=`). */
export default async function ListingsPage({ searchParams }: PageProps<'/[locale]/panel/publicaciones'>) {
  const params = await searchParams;
  const requested = typeof params.estado === 'string' ? params.estado : 'ALL';
  const filter: HostListingFilter = (HOST_LISTING_FILTERS as readonly string[]).includes(requested) ? (requested as HostListingFilter) : 'ALL';
  const [loaded, listings] = await Promise.all([
    loadHostOr('/panel/publicaciones'),
    serverApi<HostListingsResponse>(`/v1/host/listings?status=${filter}`),
  ]);
  if ('fallback' in loaded) return loaded.fallback;
  return <ListingsView mine={loaded.mine} initial={listings.ok ? listings.data : EMPTY} initialFilter={filter} />;
}
