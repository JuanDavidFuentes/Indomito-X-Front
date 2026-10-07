'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ForgotPasswordSchema,
  PASSWORD_MIN_LENGTH,
  ResetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '@juandavidfuentes/indomitox-shared';
import { CheckCircle, EnvelopeSimpleOpen } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { FormAlert, PasswordField, TextField } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Link } from '@/i18n/navigation';
import type { routing } from '@/i18n/routing';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { applyApiIssues, useErrorText } from '@/lib/forms';

/** Resultado de un paso del flujo: ícono, mensaje y acción siguiente. */
export function AuthResult({
  tone,
  message,
  action,
}: {
  tone: 'success' | 'info';
  message: ReactNode;
  action?: ReactNode;
}) {
  const Icon = tone === 'success' ? CheckCircle : EnvelopeSimpleOpen;
  return (
    <div role="status" className="grid gap-5">
      <div className="flex items-start gap-3">
        <Icon
          size={32}
          weight="duotone"
          className={tone === 'success' ? 'shrink-0 text-success' : 'shrink-0 text-secondary'}
          aria-hidden="true"
        />
        <p className="text-lg">{message}</p>
      </div>
      {action}
    </div>
  );
}

function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const errors = useErrorText();
  const locale = useLocale() as (typeof routing.locales)[number];
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '', locale },
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await api('/v1/auth/forgot-password', { method: 'POST', body: values });
      setSentTo(values.email.trim());
    } catch (error) {
      if (!applyApiIssues(error, form.setError)) setFormError(errors.api(error));
    }
  });

  if (sentTo) {
    return (
      <AuthResult
        tone="info"
        message={t('forgotSent', { email: sentTo })}
        action={
          <Link href="/ingresar" className="font-semibold text-primary underline-offset-4 hover:underline">
            {t('backToSignIn')}
          </Link>
        }
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <p className="-mt-2 text-muted-foreground">{t('forgotSubtitle')}</p>
        <TextField
          control={form.control}
          name="email"
          label={t('email')}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder={t('emailPlaceholder')}
        />
        {formError ? <FormAlert>{formError}</FormAlert> : null}
        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Spinner aria-hidden="true" /> : null}
          {t('forgotSubmit')}
        </Button>
        <Link href="/ingresar" className="text-center font-semibold text-primary underline-offset-4 hover:underline">
          {t('backToSignIn')}
        </Link>
      </FieldGroup>
    </form>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations('auth');
  const errors = useErrorText();
  const [done, setDone] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token, password: '' },
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await api('/v1/auth/reset-password', { method: 'POST', body: values });
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'TOKEN_INVALID') setTokenInvalid(true);
      else if (!applyApiIssues(error, form.setError)) setFormError(errors.api(error));
    }
  });

  if (done) {
    return (
      <AuthResult
        tone="success"
        message={t('resetSuccess')}
        action={
          <Button asChild size="lg" className="w-full">
            <Link href="/ingresar">{t('submitSignIn')}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <p className="-mt-2 text-muted-foreground">{t('resetTitle')}</p>
        <PasswordField
          control={form.control}
          name="password"
          label={t('newPassword')}
          autoComplete="new-password"
          description={t('passwordHint', { min: PASSWORD_MIN_LENGTH })}
        />
        {tokenInvalid ? (
          <FormAlert>
            {t('verifyFailed')}{' '}
            <Link href="/recuperar" className="underline underline-offset-4">
              {t('requestNewLink')}
            </Link>
          </FormAlert>
        ) : null}
        {formError ? <FormAlert>{formError}</FormAlert> : null}
        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Spinner aria-hidden="true" /> : null}
          {t('resetSubmit')}
        </Button>
      </FieldGroup>
    </form>
  );
}

/** `/recuperar`: sin token pide el correo; con el token del enlace, la contraseña nueva. */
export function RecoverPassword() {
  const token = useSearchParams().get('token');
  return token ? <ResetPasswordForm token={token} /> : <ForgotPasswordForm />;
}
