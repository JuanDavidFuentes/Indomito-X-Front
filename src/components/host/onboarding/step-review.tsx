'use client';

import { HOST_ONBOARDING_STEPS, type HostOnboardingStep, type MyHostResponse } from '@juandavidfuentes/indomitox-shared';
import { CheckCircle, EnvelopeSimple, PaperPlaneTilt, WarningCircle } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { FormAlert } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';
import { useStoreHost } from '@/lib/host';
import { useSession } from '@/lib/session';
import { useRequirementLabel } from '../labels';

/** Último paso: qué falta, la declaración de veracidad y el envío a revisión (HOST-03). */
export function StepReview({ mine, onGoTo }: { mine: MyHostResponse; onGoTo: (step: HostOnboardingStep) => void }) {
  const t = useTranslations();
  const errors = useErrorText();
  const router = useRouter();
  const storeHost = useStoreHost();
  const requirementLabel = useRequirementLabel();
  const { data: user } = useSession();
  const id = useId();
  const [declared, setDeclared] = useState(false);
  const [sending, setSending] = useState(false);
  const [resent, setResent] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const { progress } = mine;
  const verified = user?.emailVerified ?? true;
  const canSubmit = progress.readyToSubmit && declared && verified && mine.permissions.includes('host.submit');

  const missingLabel = (step: HostOnboardingStep, item: string) => {
    if (step === 'documents') {
      const requirement = mine.requirements.find((r) => r.id === item);
      return requirement ? requirementLabel(requirement) : item;
    }
    return t(`host.missing.${item}` as 'host.missing.legalName');
  };

  const submit = async () => {
    setSending(true);
    setFailure(null);
    try {
      storeHost(await api<MyHostResponse>('/v1/host/submit', { method: 'POST' }));
      toast.success(t('host.submitted'));
      router.refresh();
    } catch (error) {
      setFailure(errors.api(error));
    } finally {
      setSending(false);
    }
  };

  const resend = async () => {
    try {
      await api('/v1/auth/resend-verification', { method: 'POST' });
      setResent(true);
    } catch (error) {
      toast.error(errors.api(error));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <ul className="grid gap-3">
        {HOST_ONBOARDING_STEPS.map((step, index) => {
          const { complete, missing } = progress.steps[step];
          return (
            <li key={step} className="flex flex-wrap items-start gap-3 rounded-xl border border-border p-4">
              {complete ? (
                <CheckCircle size={26} weight="fill" className="shrink-0 text-success" aria-hidden="true" />
              ) : (
                <WarningCircle size={26} weight="fill" className="shrink-0 text-warning" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {index + 1}. {t(`hostSteps.${step}.label`)}
                  <span className="sr-only"> — {complete ? t('host.stepComplete') : t('host.stepIncomplete')}</span>
                </p>
                {complete ? null : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('host.reviewMissing')}: {missing.map((item) => missingLabel(step, item)).join(', ')}
                  </p>
                )}
              </div>
              {complete ? null : (
                <Button type="button" variant="outline" size="sm" onClick={() => onGoTo(step)}>
                  {t('host.goToStep')}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {progress.readyToSubmit ? <p className="font-semibold text-success">{t('host.reviewAllSet')}</p> : null}

      {verified ? null : (
        <div role="status" className="flex flex-col gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex min-w-0 items-start gap-2 font-medium [overflow-wrap:anywhere]">
            <EnvelopeSimple size={22} weight="duotone" className="mt-px shrink-0 text-warning" aria-hidden="true" />
            {resent ? t('auth.verificationSent') : t('host.verifyToSubmit', { email: user?.email ?? '' })}
          </p>
          {resent ? null : (
            <Button type="button" variant="outline" onClick={resend} className="shrink-0">
              {t('auth.resendVerification')}
            </Button>
          )}
        </div>
      )}

      <div className="flex items-start gap-3">
        <Checkbox id={id} checked={declared} onCheckedChange={(checked) => setDeclared(checked === true)} className="mt-0.5" />
        <label htmlFor={id} className="cursor-pointer leading-snug">
          {t('host.declaration')}
        </label>
      </div>

      {failure ? <FormAlert>{failure}</FormAlert> : null}
      <div>
        <Button type="button" size="lg" onClick={submit} disabled={!canSubmit || sending}>
          {sending ? <Spinner aria-hidden="true" /> : <PaperPlaneTilt size={20} weight="bold" aria-hidden="true" />}
          {mine.host.status === 'CHANGES_REQUESTED' ? t('host.resubmit') : t('host.submit')}
        </Button>
      </div>
    </div>
  );
}
