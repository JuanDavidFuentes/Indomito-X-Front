import type { AdminSportDto, ZoneDto } from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { CatalogView } from '@/components/admin/catalog/catalog-view';
import { routing } from '@/i18n/routing';
import { serverApi } from '@/lib/api/server';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/catalogo'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'adminCatalog' });
  return { title: t('title') };
}

/** Catálogo (ADM-03): deportes y zonas. La pestaña llega en la URL (`?seccion=zonas`). */
export default async function AdminCatalogPage({ searchParams }: PageProps<'/[locale]/admin/catalogo'>) {
  const params = await searchParams;
  const section = params.seccion === 'zonas' ? 'zonas' : 'deportes';
  const [sports, zones] = await Promise.all([
    serverApi<AdminSportDto[]>('/v1/admin/sports'),
    serverApi<ZoneDto[]>('/v1/admin/zones'),
  ]);
  return <CatalogView sports={sports.ok ? sports.data : []} zones={zones.ok ? zones.data : []} initialSection={section} />;
}
