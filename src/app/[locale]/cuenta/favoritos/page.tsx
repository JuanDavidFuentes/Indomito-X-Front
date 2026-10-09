import type { WishlistsResponse } from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { WishlistsView } from '@/components/favorites/wishlists-view';
import { getPathname, redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { serverApi } from '@/lib/api/server';

export async function generateMetadata({ params }: PageProps<'/[locale]/cuenta/favoritos'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'favorites' });
  return { title: t('title'), robots: { index: false } };
}

/** Favoritos del Explorador (EXP-01): sus listas. */
export default async function FavoritesPage() {
  const locale = (await getLocale()) as (typeof routing.locales)[number];
  const lists = await serverApi<WishlistsResponse>('/v1/me/wishlists');
  if (!lists.ok && lists.status === 401) {
    redirect({ href: { pathname: '/ingresar', query: { next: getPathname({ href: '/cuenta/favoritos', locale }) } }, locale });
  }
  return <WishlistsView initial={lists.ok ? lists.data : { lists: [], savedListingIds: [] }} />;
}
