'use client';

import type { MyHostResponse } from '@juandavidfuentes/indomitox-shared';
import { ArrowRight, Backpack, CalendarDots, UsersThree } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useMyHost } from '@/lib/host';
import { useHostListings } from '@/lib/listings';
import { ExpiringDocuments, StatusSummary } from './summary';
import { Timeline } from './timeline';

/** Publicaciones por estado y accesos a la lista y al calendario. */
function ListingsSummary({ approved }: { approved: boolean }) {
  const t = useTranslations();
  const { data } = useHostListings('ALL');
  const counts = data?.counts;
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <Backpack size={32} weight="duotone" className="text-primary" aria-hidden="true" />
      <h2 className="mt-3 font-display text-2xl font-extrabold uppercase italic">{t('host.listingsSoonTitle')}</h2>
      {counts ? (
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {(['PUBLISHED', 'DRAFT', 'PAUSED'] as const).map((status) => (
            <div key={status} className="rounded-lg bg-muted px-2 py-3">
              <dt className="text-xs font-semibold text-muted-foreground">{t(`listingStatus.${status}`)}</dt>
              <dd className="font-display text-3xl font-bold tabular-nums">{counts[status]}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-2 text-muted-foreground">{t('listings.overviewHint')}</p>
      )}
      {approved ? null : <p className="mt-3 text-sm font-semibold">{t('host.publishBlocked')}</p>}
      <div className="mt-4 flex flex-wrap gap-x-5">
        <Link href="/panel/publicaciones" className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">
          {t('host.nav.listings')}
          <ArrowRight size={18} weight="bold" aria-hidden="true" />
        </Link>
        <Link href="/panel/calendario" className="inline-flex min-h-11 items-center gap-2 font-semibold text-secondary underline-offset-4 hover:underline">
          <CalendarDots size={18} aria-hidden="true" />
          {t('host.nav.calendar')}
        </Link>
      </div>
    </section>
  );
}

/** Resumen del panel: estado y siguiente paso, vencimientos, publicaciones y equipo. */
export function HostOverview({ initial }: { initial: MyHostResponse }) {
  const t = useTranslations();
  const { data: mine } = useMyHost(initial);
  const approved = mine.host.status === 'APPROVED';

  return (
    <div className="grid grid-cols-1 gap-6">
      <StatusSummary mine={mine} />
      <ExpiringDocuments requirements={mine.requirements} />
      <div className="grid gap-6 md:grid-cols-2">
        <ListingsSummary approved={approved} />
        <section className="rounded-xl border border-border bg-card p-6">
          <UsersThree size={32} weight="duotone" className="text-secondary" aria-hidden="true" />
          <h2 className="mt-3 font-display text-2xl font-extrabold uppercase italic">{t('team.title')}</h2>
          <p className="mt-2 text-muted-foreground">{t('team.hint')}</p>
          <Link
            href="/panel/equipo"
            className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
          >
            {t('host.nav.team')}
            <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </Link>
        </section>
      </div>
      <Timeline events={mine.events.slice(0, 8)} />
    </div>
  );
}
