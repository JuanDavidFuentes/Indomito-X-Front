import { ADMIN_LISTING_FILTERS, type AdminListingFilter, type AdminListingsResponse } from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { ModerationQueue } from '@/components/admin/moderation/moderation-queue';
import { routing } from '@/i18n/routing';
import { serverApi } from '@/lib/api/server';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/moderacion'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'moderation' });
  return { title: t('title') };
}

const EMPTY: AdminListingsResponse = {
  items: [],
  nextCursor: null,
  counts: { MODERATION: 0, HIDDEN: 0, BLOCKED: 0, PUBLISHED: 0, ALL: 0 },
  requirePreModeration: false,
};

/** Moderación de publicaciones (ADM-02). El filtro y la búsqueda llegan en la URL. */
export default async function ModerationPage({ searchParams }: PageProps<'/[locale]/admin/moderacion'>) {
  const params = await searchParams;
  const requested = typeof params.estado === 'string' ? params.estado : 'MODERATION';
  const status: AdminListingFilter = (ADMIN_LISTING_FILTERS as readonly string[]).includes(requested) ? (requested as AdminListingFilter) : 'MODERATION';
  const q = typeof params.q === 'string' ? params.q.slice(0, 80) : '';
  const query = new URLSearchParams({ status, ...(q ? { q } : {}) });
  const result = await serverApi<AdminListingsResponse>(`/v1/admin/listings?${query}`);
  return <ModerationQueue initial={result.ok ? result.data : EMPTY} initialStatus={status} initialQuery={q} />;
}
