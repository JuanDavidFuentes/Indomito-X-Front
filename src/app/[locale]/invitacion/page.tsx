import type { InvitationPreview } from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { AuthShell } from '@/components/auth/auth-shell';
import { InvitationCard } from '@/components/host/invitation-card';
import { routing } from '@/i18n/routing';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function generateMetadata({ params }: PageProps<'/[locale]/invitacion'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'invitation' });
  return { title: t('title'), robots: { index: false } };
}

/** El token viaja en el cuerpo: así no queda en los registros de acceso de la API. */
async function loadPreview(token: string): Promise<InvitationPreview | null> {
  try {
    const res = await fetch(`${API_URL}/v1/invitations/preview`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });
    return res.ok ? ((await res.json()) as InvitationPreview) : null;
  } catch {
    return null;
  }
}

/** Invitación al equipo de un Guía (HOST-07): `/invitacion?token=…` del correo. */
export default async function InvitationPage({ searchParams }: PageProps<'/[locale]/invitacion'>) {
  const { token } = await searchParams;
  const value = typeof token === 'string' && token.length >= 20 ? token : null;
  const [t, preview] = await Promise.all([getTranslations('invitation'), value ? loadPreview(value) : null]);
  return (
    <AuthShell photo="guia-rafting" eyebrow={t('eyebrow')} title={t('title')}>
      <InvitationCard token={value} preview={preview} />
    </AuthShell>
  );
}
