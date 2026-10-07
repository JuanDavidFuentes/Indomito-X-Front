import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { LegalPage } from '@/components/legal/legal-page';
import { routing } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/legal/privacidad'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'legal.privacy' });
  return { title: t('title'), description: t('intro') };
}

export default function Page() {
  return <LegalPage document="PRIVACY" />;
}
