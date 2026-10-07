import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/auth-shell';
import { VerifyEmail } from '@/components/auth/verify-email';
import { routing } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/verificar'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('verifyTitle'), robots: { index: false } };
}

export default async function VerifyEmailPage() {
  const t = await getTranslations('auth');
  return (
    <AuthShell photo="destino-chicamocha" eyebrow={t('signUpEyebrow')} title={t('verifyTitle')}>
      <Suspense>
        <VerifyEmail />
      </Suspense>
    </AuthShell>
  );
}
