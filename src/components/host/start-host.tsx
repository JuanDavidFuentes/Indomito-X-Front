'use client';

import type { MyHostResponse } from '@juandavidfuentes/indomitox-shared';
import { ArrowRight, Bank, Certificate, FileText, IdentificationCard, ShieldCheck, Storefront } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { TopoPattern } from '@/components/brand/topo-pattern';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { useErrorText } from '@/lib/forms';
import { useStoreHost } from '@/lib/host';

const NEEDS = [
  { key: 'id', icon: IdentificationCard },
  { key: 'chamber', icon: FileText },
  { key: 'rnt', icon: Certificate },
  { key: 'nts', icon: ShieldCheck },
  { key: 'insurance', icon: ShieldCheck },
  { key: 'bank', icon: Bank },
] as const;

/** Para quien aún no tiene cuenta de Guía: qué necesita y el botón para empezar (AUTH-04, HOST-01). */
export function StartHost() {
  const t = useTranslations('host');
  const errors = useErrorText();
  const router = useRouter();
  const storeHost = useStoreHost();
  const [starting, setStarting] = useState(false);

  const start = async () => {
    setStarting(true);
    try {
      storeHost(await api<MyHostResponse>('/v1/host', { method: 'POST', body: {} }));
    } catch (error) {
      if (!(error instanceof ApiError && error.code === 'HOST_ALREADY_EXISTS')) {
        toast.error(errors.api(error));
        setStarting(false);
        return;
      }
    }
    router.push('/panel/verificacion');
    router.refresh();
  };

  return (
    <section aria-labelledby="start-host-title" className="grid gap-6">
      <div className="relative overflow-hidden rounded-2xl bg-night p-6 text-night-foreground sm:p-10 dark:border dark:border-border dark:bg-card">
        <TopoPattern variant="band" className="absolute inset-0 size-full text-brand/20" />
        <div className="relative max-w-2xl">
          <h2 id="start-host-title" className="font-display text-4xl leading-[0.95] font-extrabold uppercase italic sm:text-5xl">
            {t('startTitle')}
          </h2>
          <p className="mt-4 text-lg text-night-foreground/85">{t('startBody')}</p>
          <Button size="lg" onClick={start} disabled={starting} className="mt-8">
            {starting ? <Spinner aria-hidden="true" /> : null}
            {t('startButton')}
            <ArrowRight size={20} weight="bold" aria-hidden="true" />
          </Button>
          <p className="mt-3 text-sm text-night-foreground/75">{t('startTime')}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h3 className="font-display text-2xl font-extrabold uppercase italic">{t('startNeedTitle')}</h3>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {NEEDS.map(({ key, icon: NeedIcon }) => (
            <li key={key} className="flex items-start gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <NeedIcon size={22} weight="duotone" aria-hidden="true" />
              </span>
              <span className="pt-2 leading-snug">{t(`startNeed.${key}`)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex items-start gap-2 rounded-lg bg-muted px-4 py-3 text-sm">
          <Storefront size={20} className="mt-px shrink-0 text-secondary" aria-hidden="true" />
          {t('productsOnlyNote')}
        </p>
      </div>
    </section>
  );
}
