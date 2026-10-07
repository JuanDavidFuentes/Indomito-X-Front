import type { SportDto } from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { loadHostOr } from '@/components/host/panel-fallbacks';
import { VerificationView } from '@/components/host/verification-view';
import { routing } from '@/i18n/routing';
import { publicApi } from '@/lib/api/server';

export async function generateMetadata({ params }: PageProps<'/[locale]/panel/verificacion'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'host.nav' });
  return { title: t('verification') };
}

/** Alta por pasos y estado de la verificación del Guía (HOST-01 a HOST-05). */
export default async function VerificationPage() {
  const [loaded, sports] = await Promise.all([loadHostOr('/panel/verificacion'), publicApi<SportDto[]>('/v1/sports', [])]);
  if ('fallback' in loaded) return loaded.fallback;
  return (
    <Suspense>
      <VerificationView initial={loaded.mine} sports={sports} />
    </Suspense>
  );
}
