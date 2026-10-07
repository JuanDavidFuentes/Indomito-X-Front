'use client';

import type { MyHostResponse } from '@juandavidfuentes/indomitox-shared';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useMyHost } from '@/lib/host';
import { StepPage } from './onboarding/step-page';

/** /panel/pagina: la página pública del Guía (PAGE-01), editable también después de aprobado. */
export function PageEditor({ initial }: { initial: MyHostResponse }) {
  const t = useTranslations();
  const { data: mine } = useMyHost(initial);
  const { host } = mine;

  return (
    <section aria-labelledby="page-title" className="rounded-xl border border-border bg-card p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="page-title" className="font-display text-4xl leading-tight font-extrabold uppercase italic">
            {t('hostSteps.page.title')}
          </h2>
          <p className="mt-2 text-muted-foreground">{t('hostSteps.page.subtitle')}</p>
        </div>
        {host.status === 'APPROVED' && host.slug ? (
          <Link
            href={{ pathname: '/guias/[slug]', params: { slug: host.slug } }}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-4 font-semibold text-secondary transition-colors duration-150 hover:bg-muted"
          >
            <ArrowSquareOut size={18} aria-hidden="true" />
            {t('host.pagePreview')}
          </Link>
        ) : null}
      </div>
      <div className="mt-8">
        <StepPage mine={mine} />
      </div>
    </section>
  );
}
