'use client';

import type { MyHostResponse } from '@juandavidfuentes/indomitox-shared';
import { ArrowRight, Backpack, UsersThree } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useMyHost } from '@/lib/host';
import { ExpiringDocuments, StatusSummary } from './summary';
import { Timeline } from './timeline';

/** Resumen del panel: estado y siguiente paso, vencimientos, publicaciones (F3) y equipo. */
export function HostOverview({ initial }: { initial: MyHostResponse }) {
  const t = useTranslations();
  const { data: mine } = useMyHost(initial);
  const approved = mine.host.status === 'APPROVED';

  return (
    <div className="grid grid-cols-1 gap-6">
      <StatusSummary mine={mine} />
      <ExpiringDocuments requirements={mine.requirements} />
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6">
          <Backpack size={32} weight="duotone" className="text-primary" aria-hidden="true" />
          <h2 className="mt-3 font-display text-2xl font-extrabold uppercase italic">{t('host.listingsSoonTitle')}</h2>
          <p className="mt-2 text-muted-foreground">{t('host.listingsSoonBody')}</p>
          {approved ? null : <p className="mt-3 text-sm font-semibold">{t('host.publishBlocked')}</p>}
          <p className="tape mt-4">{t('common.comingSoon')}</p>
        </section>
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
