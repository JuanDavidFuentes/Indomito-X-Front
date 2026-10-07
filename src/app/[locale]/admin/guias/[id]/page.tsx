import type { AdminHostDetail, SportDto } from '@juandavidfuentes/indomitox-shared';
import { WarningCircle } from '@phosphor-icons/react/ssr';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { HostReview } from '@/components/admin/host-review';
import { routing } from '@/i18n/routing';
import { publicApi, serverApi } from '@/lib/api/server';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/guias/[id]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { title: t('hostsTitle') };
}

/** Revisión de un Guía (ADM-01). */
export default async function AdminHostPage({ params }: PageProps<'/[locale]/admin/guias/[id]'>) {
  const { id } = await params;
  const [result, sports] = await Promise.all([
    serverApi<AdminHostDetail>(`/v1/admin/hosts/${encodeURIComponent(id)}`),
    publicApi<SportDto[]>('/v1/sports', []),
  ]);
  if (!result.ok && result.status === 404) notFound();
  if (!result.ok) {
    // 403: el layout ya muestra "Solo para administradores".
    if (result.status === 403 || result.status === 401) return null;
    const t = await getTranslations();
    return (
      <p role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 font-medium text-destructive">
        <WarningCircle size={22} weight="fill" aria-hidden="true" />
        {t('errors.SERVICE_UNAVAILABLE')}
      </p>
    );
  }
  return <HostReview initial={result.data} sports={sports} />;
}
