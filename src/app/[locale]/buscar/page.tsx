import { localizedOr, parseSearchParams, searchQueryToParams, toQueryString, webPath } from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { SearchView } from '@/components/search/search-view';
import { routing } from '@/i18n/routing';
import { getSports, searchListings } from '@/lib/api/public';

type Props = PageProps<'/[locale]/buscar'>;

async function readQuery(props: Props) {
  return parseSearchParams((await props.searchParams) as Record<string, string | string[] | undefined>);
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'search' });
  const query = await readQuery(props);
  const data = await searchListings(query);
  const place = data?.place ? localizedOr(data.place.names, locale, data.place.slug) : null;
  const filtered = Object.keys(searchQueryToParams(query)).length > 0;
  return {
    title: place ? t('headingIn', { place }) : t('title'),
    description: t('metaDescription'),
    // Las combinaciones de filtros no se indexan: para eso están las páginas de aterrizaje (SRCH-06).
    robots: filtered ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: webPath('/buscar', locale),
      languages: Object.fromEntries(routing.locales.map((l) => [l, webPath('/buscar', l)])),
    },
  };
}

/** Búsqueda con lista y mapa (SRCH-01 a SRCH-05). El servidor pinta la primera página de resultados. */
export default async function SearchPage(props: Props) {
  const query = await readQuery(props);
  const [data, sports] = await Promise.all([searchListings(query), getSports()]);
  const qs = toQueryString(searchQueryToParams(query));

  return (
    <Suspense>
      <SearchView initial={{ qs, data }} sports={sports} />
    </Suspense>
  );
}
