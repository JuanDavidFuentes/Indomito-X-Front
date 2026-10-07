import type { AuthProvidersResponse } from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/auth-shell';
import { SignInForm } from '@/components/auth/sign-in-form';
import { routing } from '@/i18n/routing';
import { publicApi } from '@/lib/api/server';

const NO_PROVIDERS: AuthProvidersResponse = { google: { enabled: false, webClientId: null }, apple: { enabled: false } };

export async function generateMetadata({ params }: PageProps<'/[locale]/ingresar'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('signInTitle'), description: t('signInSubtitle') };
}

export default async function SignInPage() {
  const t = await getTranslations('auth');
  const providers = await publicApi('/v1/auth/providers', NO_PROVIDERS);
  return (
    <AuthShell photo="aire-parapente-san-gil" eyebrow={t('signInEyebrow')} title={t('signInTitle')} subtitle={t('signInSubtitle')}>
      <Suspense>
        <SignInForm googleClientId={providers.google.enabled ? providers.google.webClientId : null} />
      </Suspense>
    </AuthShell>
  );
}
