import type { WishlistDetail } from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { WishlistView } from '@/components/favorites/wishlist-view';
import { getPathname, redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getSports } from '@/lib/api/public';
import { serverApi } from '@/lib/api/server';

export async function generateMetadata({ params }: PageProps<'/[locale]/cuenta/favoritos/[id]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'favorites' });
  return { title: t('title'), robots: { index: false } };
}

/** Una lista de favoritos con sus aventuras. */
export default async function FavoriteListPage({ params }: PageProps<'/[locale]/cuenta/favoritos/[id]'>) {
  const { id } = await params;
  const locale = (await getLocale()) as (typeof routing.locales)[number];
  const [list, sports] = await Promise.all([serverApi<WishlistDetail>(`/v1/me/wishlists/${encodeURIComponent(id)}`), getSports()]);
  if (!list.ok && list.status === 401) {
    redirect({ href: { pathname: '/ingresar', query: { next: getPathname({ href: { pathname: '/cuenta/favoritos/[id]', params: { id } }, locale }) } }, locale });
  }
  if (!list.ok) notFound();
  return <WishlistView initial={list.data} sports={sports} />;
}
