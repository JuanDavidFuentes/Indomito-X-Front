'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  PASSWORD_MIN_LENGTH,
  RegisterSchema,
  type AuthResponse,
  type RegisterInput,
} from '@juandavidfuentes/indomitox-shared';
import { ArrowSquareOut, Compass, Mountains } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { CheckboxField, FormAlert, PasswordField, TextField } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { FieldGroup, FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import { Link } from '@/i18n/navigation';
import type { routing } from '@/i18n/routing';
import { api } from '@/lib/api/client';
import { applyApiIssues, useErrorText } from '@/lib/forms';
import { GoogleSignIn } from './google-sign-in';
import { useCompleteSignIn, useNextPath } from './use-auth-flow';

const INTENTS = [
  { value: 'EXPLORE', icon: Compass, title: 'intentExplore', hint: 'intentExploreHint' },
  { value: 'HOST', icon: Mountains, title: 'intentHost', hint: 'intentHostHint' },
] as const;

/** En el formulario las casillas empiezan sin marcar; el esquema exige que lleguen en true. */
type RegisterForm = Omit<RegisterInput, 'acceptTerms' | 'acceptPrivacy'> & { acceptTerms: boolean; acceptPrivacy: boolean };

/** Enlace al documento legal en otra pestaña (el formulario no se pierde). */
function LegalLink({ href, label }: { href: '/legal/terminos' | '/legal/privacidad'; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      className="inline-flex items-center gap-1 font-semibold whitespace-nowrap text-secondary underline-offset-4 hover:underline"
    >
      {label}
      <ArrowSquareOut size={14} aria-hidden="true" />
    </Link>
  );
}

/** AUTH-02, AUTH-04 y AUTH-08: registro con intención, consentimientos y verificación por correo. */
export function SignUpForm({ googleClientId }: { googleClientId: string | null }) {
  const t = useTranslations();
  const locale = useLocale() as (typeof routing.locales)[number];
  const errors = useErrorText();
  const next = useNextPath();
  const complete = useCompleteSignIn();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema) as unknown as Resolver<RegisterForm>,
    defaultValues: {
      intent: 'EXPLORE',
      name: '',
      email: '',
      password: '',
      locale,
      acceptTerms: false,
      acceptPrivacy: false,
    },
    mode: 'onTouched',
  });
  const intent = useWatch({ control: form.control, name: 'intent' });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const response = await api<AuthResponse>('/v1/auth/register', { method: 'POST', body: values });
      toast.success(t('auth.welcomeCheckEmail'));
      // AUTH-04: quien quiere ofrecer aventuras sigue en su cuenta (alta de Guía en F2).
      complete(response, values.intent === 'HOST' ? 'account' : 'home');
    } catch (error) {
      if (!applyApiIssues(error, form.setError)) setFormError(errors.api(error));
    }
  });

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <Controller
            control={form.control}
            name="intent"
            render={({ field }) => (
              <FieldSet>
                <FieldLegend variant="label" className="text-sm font-semibold">
                  {t('auth.intentTitle')}
                </FieldLegend>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-3 sm:grid-cols-2">
                  {INTENTS.map(({ value, icon: Icon, title, hint }) => (
                    <label
                      key={value}
                      className="group relative flex cursor-pointer flex-col gap-2 rounded-lg border-2 border-border p-4 transition-colors duration-150 has-data-checked:border-primary has-data-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 hover:border-primary/50"
                    >
                      <span className="flex items-center justify-between">
                        <Icon size={26} className="text-primary" aria-hidden="true" />
                        <RadioGroupItem value={value} aria-describedby={`intent-${value}-hint`} />
                      </span>
                      <span className="font-display text-xl leading-tight font-bold uppercase">
                        {t(`auth.${title}`)}
                      </span>
                      <span id={`intent-${value}-hint`} className="text-sm text-muted-foreground">
                        {t(`auth.${hint}`)}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </FieldSet>
            )}
          />
          <TextField
            control={form.control}
            name="name"
            label={t('auth.name')}
            autoComplete="name"
            placeholder={t('auth.namePlaceholder')}
          />
          <TextField
            control={form.control}
            name="email"
            label={t('auth.email')}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder={t('auth.emailPlaceholder')}
          />
          <PasswordField
            control={form.control}
            name="password"
            label={t('auth.password')}
            autoComplete="new-password"
            description={t('auth.passwordHint', { min: PASSWORD_MIN_LENGTH })}
          />
          <div className="grid gap-3">
            <CheckboxField
              control={form.control}
              name="acceptTerms"
              label={t('auth.acceptTerms')}
              link={<LegalLink href="/legal/terminos" label={t('common.readDocument')} />}
            />
            <CheckboxField
              control={form.control}
              name="acceptPrivacy"
              label={t('auth.acceptPrivacy')}
              link={<LegalLink href="/legal/privacidad" label={t('common.readDocument')} />}
            />
          </div>
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Spinner aria-hidden="true" /> : null}
            {t('auth.submitSignUp')}
          </Button>
        </FieldGroup>
      </form>

      {googleClientId ? (
        <>
          <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">{t('auth.or')}</FieldSeparator>
          <GoogleSignIn clientId={googleClientId} intent={intent} />
        </>
      ) : null}

      <p className="text-center text-muted-foreground">
        {t('auth.haveAccount')}{' '}
        <Link
          href={{ pathname: '/ingresar', query: next ? { next } : undefined }}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t('auth.goSignIn')}
        </Link>
      </p>
    </div>
  );
}
