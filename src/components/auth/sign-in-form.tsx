'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type AuthResponse, type LoginInput } from '@juandavidfuentes/indomitox-shared';
import { Info } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormAlert, PasswordField, TextField } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { FieldGroup, FieldSeparator } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { applyApiIssues, useErrorText } from '@/lib/forms';
import { GoogleSignIn } from './google-sign-in';
import { useCompleteSignIn, useNextPath } from './use-auth-flow';

export function SignInForm({ googleClientId }: { googleClientId: string | null }) {
  const t = useTranslations('auth');
  const errors = useErrorText();
  const next = useNextPath();
  const complete = useCompleteSignIn();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      complete(await api<AuthResponse>('/v1/auth/login', { method: 'POST', body: values }));
    } catch (error) {
      if (!applyApiIssues(error, form.setError)) setFormError(errors.api(error));
    }
  });

  const query = next ? { next } : undefined;

  return (
    <div className="grid gap-6">
      {next ? (
        <p className="flex items-start gap-2.5 rounded-md border border-secondary/40 bg-secondary/10 px-3.5 py-3 text-sm">
          <Info size={20} weight="fill" className="mt-px shrink-0 text-secondary" aria-hidden="true" />
          {t('signInRequired')}
        </p>
      ) : null}

      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
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
          <PasswordField
            control={form.control}
            name="password"
            label={t('password')}
            labelAction={
              <Link
                href={{ pathname: '/recuperar' }}
                className="text-sm font-semibold text-secondary underline-offset-4 hover:underline"
              >
                {t('forgotLink')}
              </Link>
            }
          />
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Spinner aria-hidden="true" /> : null}
            {t('submitSignIn')}
          </Button>
        </FieldGroup>
      </form>

      {googleClientId ? (
        <>
          <FieldSeparator className="bg-card *:data-[slot=field-separator-content]:bg-card">{t('or')}</FieldSeparator>
          <GoogleSignIn clientId={googleClientId} />
        </>
      ) : null}

      <p className="text-center text-muted-foreground">
        {t('noAccount')}{' '}
        <Link
          href={{ pathname: '/registro', query }}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t('goSignUp')}
        </Link>
      </p>
    </div>
  );
}
