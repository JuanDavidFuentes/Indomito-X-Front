'use client';

import {
  HOST_ONBOARDING_STEPS,
  SUPPORT_EMAIL,
  type HostOnboardingStep,
  type MyHostResponse,
  type RequirementStatus,
} from '@juandavidfuentes/indomitox-shared';
import {
  ArrowRight,
  CalendarX,
  CheckCircle,
  Circle,
  HourglassMedium,
  Prohibit,
  SealCheck,
  Warning,
  XCircle,
  type Icon,
} from '@phosphor-icons/react';
import { useFormatter, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { useRequirementLabel } from './labels';

/** Pasos completos del alta, con marca y texto (no solo color). */
export function StepChecklist({ progress }: { progress: MyHostResponse['progress'] }) {
  const t = useTranslations();
  return (
    <ol className="grid gap-2 sm:grid-cols-2">
      {HOST_ONBOARDING_STEPS.map((step, index) => {
        const done = progress.steps[step].complete;
        return (
          <li key={step}>
            <Link
              href={{ pathname: '/panel/verificacion', query: { step } }}
              className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 py-2 transition-colors duration-150 hover:bg-muted"
            >
              {done ? (
                <CheckCircle size={22} weight="fill" className="shrink-0 text-success" aria-hidden="true" />
              ) : (
                <Circle size={22} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <span className="font-semibold">
                {index + 1}. {t(`hostSteps.${step}.label`)}
              </span>
              <span className="ml-auto text-sm text-muted-foreground">
                {done ? t('host.stepComplete') : t('host.stepIncomplete')}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

type Tone = 'primary' | 'info' | 'success' | 'warning' | 'danger';

const CARD_BORDERS: Record<Tone, string> = {
  primary: 'border-primary/40',
  info: 'border-secondary/40',
  success: 'border-success/40',
  warning: 'border-warning/50',
  danger: 'border-destructive/50',
};

const CARD_ICONS: Record<Tone, string> = {
  primary: 'text-primary',
  info: 'text-secondary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
};

function Card({
  icon: CardIcon,
  tone,
  title,
  children,
}: {
  icon: Icon;
  tone: Tone;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-xl border-2 bg-card p-6 sm:p-8 ${CARD_BORDERS[tone]}`}>
      <div className="flex items-start gap-4">
        <CardIcon size={36} weight="duotone" className={`shrink-0 ${CARD_ICONS[tone]}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-3xl leading-tight font-extrabold uppercase italic">{title}</h2>
          <div className="mt-3 grid gap-4 text-card-foreground">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function ReasonBox({ reason }: { reason: string }) {
  const t = useTranslations('host');
  return (
    <div className="rounded-lg border-l-4 border-brand bg-muted px-4 py-3">
      <p className="font-display text-sm font-bold tracking-[0.15em] text-muted-foreground uppercase">{t('reasonLabel')}</p>
      <p className="mt-1 whitespace-pre-line">{reason}</p>
    </div>
  );
}

/** La tarjeta principal según el estado: qué pasa y qué sigue (HOST-03). */
export function StatusSummary({ mine, showSteps = true }: { mine: MyHostResponse; showSteps?: boolean }) {
  const t = useTranslations();
  const { host, progress } = mine;
  const done = HOST_ONBOARDING_STEPS.filter((step) => progress.steps[step].complete).length;

  switch (host.status) {
    case 'DRAFT':
    case 'CHANGES_REQUESTED':
      return (
        <Card
          icon={host.status === 'DRAFT' ? HourglassMedium : Warning}
          tone={host.status === 'DRAFT' ? 'primary' : 'warning'}
          title={host.status === 'DRAFT' ? t('host.continueOnboarding') : t('host.changesRequestedTitle')}
        >
          {host.statusReason && host.status === 'CHANGES_REQUESTED' ? <ReasonBox reason={host.statusReason} /> : null}
          <p className="font-semibold">{t('host.progress', { done, total: HOST_ONBOARDING_STEPS.length })}</p>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={HOST_ONBOARDING_STEPS.length}
            aria-valuenow={done}
            aria-label={t('host.stepsLabel')}
            className="h-2.5 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${(done / HOST_ONBOARDING_STEPS.length) * 100}%` }} />
          </div>
          {showSteps ? <StepChecklist progress={progress} /> : null}
          <div>
            <Link
              href="/panel/verificacion"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
            >
              {t('host.continueOnboarding')}
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </Card>
      );
    case 'SUBMITTED':
    case 'IN_REVIEW':
      return (
        <Card icon={HourglassMedium} tone="info" title={t('host.submittedTitle')}>
          <p>{t('host.submittedBody')}</p>
          <p className="text-sm text-muted-foreground">{t('host.lockedReview')}</p>
        </Card>
      );
    case 'APPROVED':
      return (
        <Card icon={SealCheck} tone="success" title={t('host.approvedTitle')}>
          <p>{t('host.approvedBody')}</p>
          {host.slug ? (
            <div>
              <Link
                href={{ pathname: '/guias/[slug]', params: { slug: host.slug } }}
                className="inline-flex h-11 items-center gap-2 rounded-lg border-2 border-success px-5 font-semibold text-foreground transition-colors duration-150 hover:bg-success/10"
              >
                {t('host.pagePreview')}
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Link>
            </div>
          ) : null}
        </Card>
      );
    case 'REJECTED':
    case 'SUSPENDED':
      return (
        <Card
          icon={host.status === 'REJECTED' ? XCircle : Prohibit}
          tone="danger"
          title={host.status === 'REJECTED' ? t('host.rejectedTitle') : t('host.suspendedTitle')}
        >
          {host.statusReason ? <ReasonBox reason={host.statusReason} /> : null}
          <p className="text-sm text-muted-foreground">{t('host.contactSupport', { email: SUPPORT_EMAIL })}</p>
        </Card>
      );
  }
}

/** Documentos vencidos o que vencen en 30 días o menos (HOST-05). */
export function expiringRequirements(requirements: RequirementStatus[]): RequirementStatus[] {
  return requirements.filter(
    (requirement) =>
      requirement.state === 'EXPIRED' ||
      ((requirement.state === 'APPROVED' || requirement.state === 'PENDING') &&
        requirement.daysToExpiry !== null &&
        requirement.daysToExpiry <= 30),
  );
}

export function ExpiringDocuments({ requirements }: { requirements: RequirementStatus[] }) {
  const t = useTranslations('host');
  const format = useFormatter();
  const label = useRequirementLabel();
  const list = expiringRequirements(requirements);
  if (list.length === 0) return null;

  return (
    <section aria-labelledby="expiring-title" className="rounded-xl border-2 border-warning/50 bg-warning/10 p-5 sm:p-6">
      <h2 id="expiring-title" className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase italic">
        <CalendarX size={26} weight="duotone" className="text-warning" aria-hidden="true" />
        {t('expiringTitle')}
      </h2>
      <ul className="mt-4 grid gap-2">
        {list.map((requirement) => (
          <li key={requirement.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card px-4 py-3">
            <span className="font-semibold">{label(requirement)}</span>
            <span className="text-sm font-semibold">
              {requirement.state === 'EXPIRED' && requirement.expiresAt
                ? t('expiredOn', { date: format.dateTime(new Date(`${requirement.expiresAt}T12:00:00Z`), { dateStyle: 'medium' }) })
                : t('expiresInDays', { days: requirement.daysToExpiry ?? 0 })}
            </span>
          </li>
        ))}
      </ul>
      <Link href={{ pathname: '/panel/verificacion', query: { step: 'documents' satisfies HostOnboardingStep } }} className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">
        {t('renewDocument')}
        <ArrowRight size={18} weight="bold" aria-hidden="true" />
      </Link>
    </section>
  );
}
