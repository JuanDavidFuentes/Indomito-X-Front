'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  LOCALES,
  SPOKEN_LANGUAGES,
  UpdateProfileSchema,
  type Locale,
  type MeResponse,
  type SpokenLanguage,
} from '@juandavidfuentes/indomitox-shared';
import { Check, IdentificationCard } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { TextField } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api/client';
import { applyApiIssues, useErrorText } from '@/lib/forms';
import { useStoreMe } from './account-data';
import { AvatarField } from './avatar-field';
import { AccountSection } from './section';

const ProfileFormSchema = UpdateProfileSchema.pick({ name: true, city: true, languages: true, locale: true });

interface ProfileForm {
  name: string;
  city: string;
  languages: SpokenLanguage[];
  locale: Locale;
}

const LOCALE_LABELS: Record<Locale, string> = { es: 'Español', en: 'English', fr: 'Français' };

export function ProfileSection({ me }: { me: MeResponse }) {
  const t = useTranslations();
  const errors = useErrorText();
  const storeMe = useStoreMe();
  const form = useForm<ProfileForm>({
    resolver: zodResolver(ProfileFormSchema) as unknown as Resolver<ProfileForm>,
    values: {
      name: me.user.name,
      city: me.profile.city ?? '',
      languages: me.profile.languages,
      locale: me.user.locale,
    },
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      storeMe(await api<MeResponse>('/v1/me', { method: 'PATCH', body: values }));
      toast.success(t('account.saved'));
    } catch (error) {
      if (!applyApiIssues(error, form.setError)) toast.error(errors.api(error));
    }
  });

  return (
    <AccountSection id="datos" icon={IdentificationCard} title={t('account.sections.profile')} hint={t('account.profileHint')}>
      <div className="mb-8">
        <AvatarField me={me} />
      </div>
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <div className="grid gap-5 md:grid-cols-2">
            <TextField control={form.control} name="name" label={t('auth.name')} autoComplete="name" />
            <TextField
              control={form.control}
              name="city"
              label={t('account.city')}
              autoComplete="address-level2"
              placeholder={t('account.cityPlaceholder')}
            />
          </div>

          <Controller
            control={form.control}
            name="languages"
            render={({ field }) => (
              <FieldSet>
                <FieldLegend variant="label" className="text-sm font-semibold">
                  {t('account.languages')}
                </FieldLegend>
                <div className="flex flex-wrap gap-2">
                  {SPOKEN_LANGUAGES.map((language) => {
                    const checked = field.value.includes(language);
                    return (
                      <button
                        key={language}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() =>
                          field.onChange(
                            checked ? field.value.filter((l) => l !== language) : [...field.value, language],
                          )
                        }
                        className={`inline-flex h-11 items-center gap-2 rounded-full border-2 px-4 font-semibold transition-colors duration-150 ${
                          checked
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {checked ? <Check size={16} weight="bold" aria-hidden="true" /> : null}
                        {t(`spokenLanguages.${language}`)}
                      </button>
                    );
                  })}
                </div>
              </FieldSet>
            )}
          />

          <Controller
            control={form.control}
            name="locale"
            render={({ field }) => (
              <Field className="max-w-xs">
                <FieldLabel htmlFor="account-locale">{t('common.language')}</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="account-locale" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALES.map((locale) => (
                      <SelectItem key={locale} value={locale}>
                        {LOCALE_LABELS[locale]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <div>
            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
              {form.formState.isSubmitting ? <Spinner aria-hidden="true" /> : null}
              {t('common.save')}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </AccountSection>
  );
}
