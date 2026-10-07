'use client';

import { HOST_ONBOARDING_STEPS, type MyHostResponse, type SportDto } from '@juandavidfuentes/indomitox-shared';
import { ArrowLeft, ArrowRight, Check } from '@phosphor-icons/react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getPathname } from '@/i18n/navigation';
import type { routing } from '@/i18n/routing';
import { ReasonBox } from '../summary';
import { DocumentsManager } from './documents';
import { StepCompany } from './step-company';
import { StepPage } from './step-page';
import { StepPayout } from './step-payout';
import { StepReview } from './step-review';
import { StepType } from './step-type';

const STEPS = [...HOST_ONBOARDING_STEPS, 'review'] as const;
type WizardStep = (typeof STEPS)[number];

const isStep = (value: string | null): value is WizardStep => STEPS.includes(value as WizardStep);

/** Indicador de pasos: círculos tocables (44 px) con el número o la marca de completo, y su nombre desde 768 px. */
function Stepper({ current, progress, onSelect }: { current: WizardStep; progress: MyHostResponse['progress']; onSelect: (step: WizardStep) => void }) {
  const t = useTranslations();
  return (
    <nav aria-label={t('host.stepsLabel')}>
      <ol className="flex items-start justify-between gap-1">
        {STEPS.map((step, index) => {
          const active = step === current;
          const complete = step === 'review' ? progress.readyToSubmit : progress.steps[step].complete;
          return (
            <li key={step} className="relative flex flex-1 flex-col items-center gap-2 text-center">
              {index > 0 ? (
                <span aria-hidden="true" className={`absolute top-[22px] right-1/2 -z-0 h-0.5 w-full ${complete || active ? 'bg-primary/60' : 'bg-border'}`} />
              ) : null}
              <button
                type="button"
                onClick={() => onSelect(step)}
                aria-current={active ? 'step' : undefined}
                aria-label={`${index + 1}. ${t(`hostSteps.${step}.label`)} — ${complete ? t('host.stepComplete') : t('host.stepIncomplete')}`}
                className={`relative z-10 inline-flex size-11 items-center justify-center rounded-full border-2 font-display text-lg font-bold transition-colors duration-150 ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : complete
                      ? 'border-success bg-success text-success-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/60'
                }`}
              >
                {complete && !active ? <Check size={20} weight="bold" aria-hidden="true" /> : index + 1}
              </button>
              <span aria-hidden="true" className={`hidden text-sm leading-tight md:block ${active ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                {t(`hostSteps.${step}.label`)}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * El alta por pasos (HOST-01): tipo → empresa → documentos → pagos → página → enviar. Cada paso
 * se guarda solo; se puede ir y volver, y el paso actual queda en la URL (`?step=`).
 */
export function OnboardingWizard({ mine, sports }: { mine: MyHostResponse; sports: SportDto[] }) {
  const t = useTranslations();
  const locale = useLocale() as (typeof routing.locales)[number];
  const searchParams = useSearchParams();
  const heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<WizardStep>(() => {
    const requested = searchParams.get('step');
    if (isStep(requested)) return requested;
    return HOST_ONBOARDING_STEPS.find((s) => !mine.progress.steps[s].complete) ?? 'review';
  });
  const index = STEPS.indexOf(step);

  const go = (next: WizardStep) => {
    setStep(next);
    // El paso queda en la URL sin volver a pedir la página al servidor.
    window.history.replaceState(null, '', getPathname({ locale, href: { pathname: '/panel/verificacion', query: { step: next } } }));
    // El foco va al título del paso nuevo (lectores de pantalla y teclado).
    requestAnimationFrame(() => heading.current?.focus());
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {mine.host.status === 'CHANGES_REQUESTED' && mine.host.statusReason ? (
        <section className="grid gap-3 rounded-xl border-2 border-warning/50 bg-warning/10 p-5">
          <h2 className="font-display text-2xl font-extrabold uppercase italic">{t('host.changesRequestedTitle')}</h2>
          <ReasonBox reason={mine.host.statusReason} />
        </section>
      ) : null}

      <Stepper current={step} progress={mine.progress} onSelect={go} />

      <section aria-labelledby="step-title" className="rounded-xl border border-border bg-card p-5 sm:p-8">
        <p className="font-display text-sm font-bold tracking-[0.2em] text-muted-foreground uppercase">
          {t('host.stepOf', { current: index + 1, total: STEPS.length })}
        </p>
        <h2 id="step-title" ref={heading} tabIndex={-1} className="mt-1 scroll-mt-24 font-display text-4xl leading-tight font-extrabold uppercase italic outline-none">
          {t(`hostSteps.${step}.title`)}
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t(`hostSteps.${step}.subtitle`, { maxMb: 10 })}</p>

        <div className="mt-8">
          {step === 'type' ? <StepType key={step} mine={mine} sports={sports} /> : null}
          {step === 'company' ? <StepCompany key={step} mine={mine} sports={sports} /> : null}
          {step === 'documents' ? <DocumentsManager key={step} mine={mine} sports={sports} /> : null}
          {step === 'payout' ? <StepPayout key={step} mine={mine} sports={sports} /> : null}
          {step === 'page' ? <StepPage key={step} mine={mine} /> : null}
          {step === 'review' ? <StepReview key={step} mine={mine} onGoTo={go} /> : null}
        </div>

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6">
          {index > 0 ? (
            <Button type="button" variant="outline" onClick={() => go(STEPS[index - 1]!)}>
              <ArrowLeft size={18} weight="bold" aria-hidden="true" />
              {t('common.previous')}
            </Button>
          ) : (
            <span />
          )}
          {index < STEPS.length - 1 ? (
            <Button type="button" onClick={() => go(STEPS[index + 1]!)}>
              {t('common.next')}
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
