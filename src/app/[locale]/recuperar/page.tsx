import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/auth-shell';
import { RecoverPassword } from '@/components/auth/recover-password';
import { routing } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/recuperar'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('forgotTitle'), robots: { index: false } };
}

export default async function RecoverPasswordPage() {
  const t = await getTranslations('auth');
  return (
    <AuthShell photo="tierra-escalada" eyebrow={t('signInEyebrow')} title={t('forgotTitle')}>
      <Suspense>
        <RecoverPassword />
      </Suspense>
    </AuthShell>
  );
}
