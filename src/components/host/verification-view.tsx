'use client';

import type { MyHostResponse, SportDto } from '@juandavidfuentes/indomitox-shared';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useMyHost } from '@/lib/host';
import { DocumentsManager } from './onboarding/documents';
import { StepCompany } from './onboarding/step-company';
import { StepPayout } from './onboarding/step-payout';
import { OnboardingWizard } from './onboarding/wizard';
import { ExpiringDocuments, StatusSummary } from './summary';
import { Timeline } from './timeline';

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-8">
      <h2 className="font-display text-3xl font-extrabold uppercase italic">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/**
 * /panel/verificacion: en borrador o con cambios pedidos, el alta por pasos; enviado o en
 * revisión, el estado (sin editar); aprobado, la renovación de documentos, el contacto, las
 * actividades y la cuenta de pago (HOST-03, HOST-05).
 */
export function VerificationView({ initial, sports }: { initial: MyHostResponse; sports: SportDto[] }) {
  const t = useTranslations();
  const { data: mine } = useMyHost(initial);
  const { status } = mine.host;

  if (status === 'DRAFT' || status === 'CHANGES_REQUESTED') return <OnboardingWizard mine={mine} sports={sports} />;

  const approved = status === 'APPROVED';
  return (
    <div className="grid grid-cols-1 gap-6">
      <StatusSummary mine={mine} showSteps={false} />
      <ExpiringDocuments requirements={mine.requirements} />
      <Block title={t('host.documentsTitle')}>
        <DocumentsManager mine={mine} sports={sports} />
      </Block>
      {approved ? (
        <Block title={t('hostSteps.company.title')}>
          <StepCompany mine={mine} sports={sports} />
        </Block>
      ) : null}
      {approved && mine.permissions.includes('payout.manage') ? (
        <Block title={t('hostSteps.payout.title')}>
          <StepPayout mine={mine} sports={sports} />
        </Block>
      ) : null}
      <Timeline events={mine.events} />
    </div>
  );
}
