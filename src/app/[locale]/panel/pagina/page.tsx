import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { PageEditor } from '@/components/host/page-editor';
import { loadHostOr } from '@/components/host/panel-fallbacks';
import { routing } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/panel/pagina'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'host.nav' });
  return { title: t('page') };
}

export default async function HostPagePage() {
  const loaded = await loadHostOr('/panel/pagina');
  if ('fallback' in loaded) return loaded.fallback;
  return <PageEditor initial={loaded.mine} />;
}
