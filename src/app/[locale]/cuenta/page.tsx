import type { MeResponse, SavedParticipant, SportDto } from '@juandavidfuentes/indomitox-shared';
import { WarningCircle } from '@phosphor-icons/react/ssr';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { AccountView } from '@/components/account/account-view';
import { getPathname, Link, redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { publicApi, serverApi } from '@/lib/api/server';

export async function generateMetadata({ params }: PageProps<'/[locale]/cuenta'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'account' });
  return { title: t('title'), robots: { index: false } };
}

/** "Mi cuenta": se arma en el servidor con las cookies de la sesión (el proxy ya la renovó). */
export default async function AccountPage() {
  const locale = (await getLocale()) as (typeof routing.locales)[number];
  const [me, participants, sports] = await Promise.all([
    serverApi<MeResponse>('/v1/me'),
    serverApi<SavedParticipant[]>('/v1/me/participants'),
    publicApi<SportDto[]>('/v1/sports', []),
  ]);

  if (!me.ok && me.status === 401) {
    redirect({ href: { pathname: '/ingresar', query: { next: getPathname({ href: '/cuenta', locale }) } }, locale });
  }

  if (!me.ok) {
    const t = await getTranslations();
    return (
      <section className="mx-auto grid max-w-xl gap-4 px-4 py-24 text-center sm:px-6">
        <WarningCircle size={48} weight="duotone" className="mx-auto text-destructive" aria-hidden="true" />
        <h1 className="font-display text-4xl font-extrabold uppercase italic">{t('account.loadError')}</h1>
        <p className="text-muted-foreground">{t('errors.SERVICE_UNAVAILABLE')}</p>
        <Link href="/cuenta" className="font-semibold text-primary underline-offset-4 hover:underline">
          {t('common.retry')}
        </Link>
      </section>
    );
  }

  return (
    <AccountView
      initialMe={me.data}
      initialParticipants={participants.ok ? participants.data : []}
      sports={sports}
    />
  );
}
