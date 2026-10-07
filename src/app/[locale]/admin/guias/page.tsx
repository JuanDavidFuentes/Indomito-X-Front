import { ADMIN_HOST_FILTERS, type AdminHostFilter, type AdminHostListResponse } from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { HostQueue } from '@/components/admin/host-queue';
import { routing } from '@/i18n/routing';
import { serverApi } from '@/lib/api/server';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/guias'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { title: t('hostsTitle') };
}

const EMPTY: AdminHostListResponse = {
  items: [],
  nextCursor: null,
  counts: { DRAFT: 0, SUBMITTED: 0, IN_REVIEW: 0, APPROVED: 0, CHANGES_REQUESTED: 0, REJECTED: 0, SUSPENDED: 0 },
  queueCount: 0,
};

/** Cola de verificación de Guías (ADM-01). El filtro y la búsqueda llegan en la URL. */
export default async function AdminHostsPage({ searchParams }: PageProps<'/[locale]/admin/guias'>) {
  const params = await searchParams;
  const requested = typeof params.status === 'string' ? params.status : 'QUEUE';
  const status: AdminHostFilter = (ADMIN_HOST_FILTERS as readonly string[]).includes(requested) ? (requested as AdminHostFilter) : 'QUEUE';
  const q = typeof params.q === 'string' ? params.q.slice(0, 80) : '';
  const query = new URLSearchParams({ status, ...(q ? { q } : {}) });
  const result = await serverApi<AdminHostListResponse>(`/v1/admin/hosts?${query}`);
  return <HostQueue initial={result.ok ? result.data : EMPTY} initialStatus={status} initialQuery={q} />;
}
