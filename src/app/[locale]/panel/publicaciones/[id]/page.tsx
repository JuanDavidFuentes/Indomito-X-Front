import type { HostListingResponse, Locale, SportDto } from '@juandavidfuentes/indomitox-shared';
import { pickLocalized } from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { loadHostOr } from '@/components/host/panel-fallbacks';
import { ListingEditor } from '@/components/listings/editor/listing-editor';
import { routing } from '@/i18n/routing';
import { publicApi, serverApi } from '@/lib/api/server';

export async function generateMetadata({ params }: PageProps<'/[locale]/panel/publicaciones/[id]'>): Promise<Metadata> {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'listings' });
  const result = await serverApi<HostListingResponse>(`/v1/host/listings/${encodeURIComponent(id)}`);
  const title = result.ok ? pickLocalized(result.data.listing.title, locale as Locale)?.text : null;
  return { title: title ?? t('untitled') };
}

/** Editor de una publicación (LIST-01 a LIST-07, AVAIL-01). */
export default async function ListingEditorPage({ params }: PageProps<'/[locale]/panel/publicaciones/[id]'>) {
  const { id } = await params;
  const [loaded, listing, sports] = await Promise.all([
    loadHostOr('/panel/publicaciones'),
    serverApi<HostListingResponse>(`/v1/host/listings/${encodeURIComponent(id)}`),
    publicApi<SportDto[]>('/v1/sports', []),
  ]);
  if ('fallback' in loaded) return loaded.fallback;
  if (!listing.ok) notFound();
  return (
    <Suspense>
      <ListingEditor key={listing.data.listing.id} initial={listing.data} mine={loaded.mine} catalog={sports} />
    </Suspense>
  );
}
