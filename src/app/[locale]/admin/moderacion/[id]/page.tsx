import type { AdminListingDetail } from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { ListingReview } from '@/components/admin/moderation/listing-review';
import { routing } from '@/i18n/routing';
import { serverApi } from '@/lib/api/server';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/moderacion/[id]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'moderation' });
  return { title: t('reviewTitle') };
}

/** Revisión de una publicación en la moderación (ADM-02). */
export default async function ListingModerationPage({ params }: PageProps<'/[locale]/admin/moderacion/[id]'>) {
  const { id } = await params;
  const result = await serverApi<AdminListingDetail>(`/v1/admin/listings/${encodeURIComponent(id)}`);
  if (!result.ok) notFound();
  return <ListingReview key={result.data.listing.id} initial={result.data} />;
}
