'use client';

import { WarningCircle } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { SESSION_KEY } from '@/lib/session';
import { AuthResult } from './recover-password';

type Status = 'checking' | 'verified' | 'failed';

/**
 * `/verificar?token=…`: el token se envía con POST desde la página (no al abrir el enlace),
 * así los antivirus que visitan los enlaces del correo no lo gastan.
 */
export function VerifyEmail() {
  const t = useTranslations('auth');
  const tNav = useTranslations('nav');
  const token = useSearchParams().get('token');
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>(token ? 'checking' : 'failed');
  const sent = useRef(false);

  useEffect(() => {
    // En desarrollo React monta dos veces: el token es de un solo uso, se envía una vez.
    if (!token || sent.current) return;
    sent.current = true;
    api('/v1/auth/verify-email', { method: 'POST', body: { token } })
      .then(() => {
        setStatus('verified');
        void queryClient.invalidateQueries({ queryKey: SESSION_KEY });
      })
      .catch(() => setStatus('failed'));
  }, [token, queryClient]);

  if (status === 'checking') {
    return (
      <p role="status" className="flex items-center gap-3 text-lg">
        <Spinner className="size-6" aria-hidden="true" />
        {t('verifyChecking')}
      </p>
    );
  }

  if (status === 'verified') {
    return (
      <AuthResult
        tone="success"
        message={
          <>
            <strong className="block font-semibold">{t('verifySuccess')}</strong>
            <span className="mt-1 block text-base text-muted-foreground">{t('verifySuccessBody')}</span>
          </>
        }
        action={
          <Button asChild size="lg" className="w-full">
            <Link href="/cuenta">{tNav('account')}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div role="alert" className="grid gap-5">
      <div className="flex items-start gap-3">
        <WarningCircle size={32} weight="duotone" className="shrink-0 text-destructive" aria-hidden="true" />
        <p className="text-lg">
          <strong className="block font-semibold">{t('verifyFailed')}</strong>
          <span className="mt-1 block text-base text-muted-foreground">{t('verifyFailedBody')}</span>
        </p>
      </div>
      <Button asChild variant="outline" size="lg" className="w-full">
        <Link href="/cuenta">{t('resendVerification')}</Link>
      </Button>
    </div>
  );
}
