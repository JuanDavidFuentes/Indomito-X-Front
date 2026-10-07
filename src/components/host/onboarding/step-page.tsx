'use client';

import {
  HOST_DESCRIPTION_MIN,
  HostSlugSchema,
  LOCALES,
  SOCIAL_NETWORKS,
  SPOKEN_LANGUAGES,
  webPath,
  type HostField,
  type Locale,
  type SlugAvailability,
  type SocialNetwork,
  type SpokenLanguage,
} from '@juandavidfuentes/indomitox-shared';
import { Check, CheckCircle, Image as ImageIcon, Trash, WarningCircle } from '@phosphor-icons/react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { Controller } from 'react-hook-form';
import { TextField } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';
import { AutosaveIndicator, LockedNotice } from '../autosave-indicator';
import { FileDrop } from '../file-drop';
import { useDraftForm } from './use-draft-form';
import { useHostEditing, type StepProps } from './use-editing';

const FIELDS = ['description', 'languages', 'socialLinks'] as const satisfies readonly HostField[];

interface PageForm {
  description: Record<Locale, string>;
  languages: SpokenLanguage[];
  socialLinks: Record<SocialNetwork, string>;
}

const LOCALE_LABELS: Record<Locale, string> = { es: 'Español', en: 'English', fr: 'Français' };
const SOCIAL_PLACEHOLDERS: Record<SocialNetwork, string> = {
  website: 'tuempresa.co',
  instagram: 'instagram.com/tuempresa',
  facebook: 'facebook.com/tuempresa',
  tiktok: 'tiktok.com/@tuempresa',
  youtube: 'youtube.com/@tuempresa',
  whatsapp: '+57 300 000 0000',
};

type SlugCheck = { state: 'idle' | 'checking' } | { state: 'done'; result: SlugAvailability };

/** La dirección de la página (`/guias/{slug}`, PAGE-02): se revisa mientras se escribe. */
function SlugField({ initial, disabled, onAvailable }: { initial: string; disabled: boolean; onAvailable: (slug: string) => void }) {
  const t = useTranslations();
  const errors = useErrorText();
  const locale = useLocale() as Locale;
  const id = useId();
  const [slug, setSlug] = useState(initial);
  const [check, setCheck] = useState<SlugCheck>({ state: 'idle' });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formatError = slug && !HostSlugSchema.safeParse(slug).success ? 'validation.slugInvalid' : null;
  const origin = (process.env.NEXT_PUBLIC_WEB_URL ?? '').replace(/^https?:\/\//, '');
  const prefix = `${origin}${webPath('/guias/[slug]', locale, { slug: '' })}`;

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const change = (value: string) => {
    const next = value.toLowerCase().replace(/\s+/g, '-');
    setSlug(next);
    if (timer.current) clearTimeout(timer.current);
    if (!next || next === initial || !HostSlugSchema.safeParse(next).success) {
      setCheck({ state: 'idle' });
      return;
    }
    setCheck({ state: 'checking' });
    timer.current = setTimeout(async () => {
      try {
        const result = await api<SlugAvailability>(`/v1/host/slug-availability?slug=${encodeURIComponent(next)}`);
        setCheck({ state: 'done', result });
        if (result.available) onAvailable(result.slug);
      } catch {
        setCheck({ state: 'idle' });
      }
    }, 450);
  };

  const result = check.state === 'done' ? check.result : null;
  return (
    <Field data-invalid={formatError || (result && !result.available) ? true : undefined}>
      <FieldLabel htmlFor={id}>{t('host.slug')}</FieldLabel>
      <div className="flex min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-card focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
        <span className="hidden items-center bg-muted px-3 text-sm text-muted-foreground sm:flex">{prefix}</span>
        <Input
          id={id}
          value={slug}
          onChange={(event) => change(event.target.value)}
          disabled={disabled}
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(formatError) || (result ? !result.available : false)}
          aria-describedby={`${id}-hint ${id}-status`}
          className="h-11 rounded-none border-0 focus-visible:ring-0"
        />
      </div>
      <FieldDescription id={`${id}-hint`}>{disabled ? t('host.slugLocked') : t('host.slugHint')}</FieldDescription>
      <div id={`${id}-status`} role="status" aria-live="polite" className="text-sm font-semibold">
        {result?.available ? (
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle size={18} weight="fill" className="text-success" aria-hidden="true" />
            {t('host.slugAvailable')}
          </span>
        ) : result && !result.available ? (
          <span className="inline-flex flex-wrap items-center gap-2 text-destructive">
            <WarningCircle size={18} weight="fill" aria-hidden="true" />
            {result.suggestion ? t('host.slugTaken', { suggestion: result.suggestion }) : t('host.slugTakenNoSuggestion')}
            {result.suggestion ? (
              <Button type="button" variant="link" className="h-auto p-0" onClick={() => change(result.suggestion!)}>
                {t('host.useSuggestion')}
              </Button>
            ) : null}
          </span>
        ) : null}
      </div>
      <FieldError>{errors.field(formatError ?? undefined)}</FieldError>
    </Field>
  );
}

function ImageField({
  label,
  hint,
  url,
  purpose,
  aspect,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  url: string | null;
  purpose: 'HOST_LOGO' | 'HOST_COVER';
  aspect: 'square' | 'wide';
  disabled: boolean;
  onChange: (fileId: string | null) => void;
}) {
  const t = useTranslations();
  return (
    <div className="grid content-start gap-3">
      <p className="text-sm font-semibold">{label}</p>
      <div className={`grid items-start gap-4 ${aspect === 'square' ? 'sm:grid-cols-[8rem_1fr]' : ''}`}>
        <div
          className={`relative overflow-hidden border border-border bg-muted ${
            aspect === 'square' ? 'size-32 rounded-full' : 'aspect-[16/6] w-full rounded-xl'
          }`}
        >
          {url ? (
            <Image src={url} alt="" fill sizes={aspect === 'square' ? '8rem' : '(min-width: 1024px) 48rem, 100vw'} className="object-cover" />
          ) : (
            <ImageIcon size={36} className="absolute inset-0 m-auto text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <div className="grid content-start gap-2">
          <FileDrop purpose={purpose} label={url ? t('uploads.replace') : t('uploads.choose')} hint={hint} compact disabled={disabled} onUploaded={({ fileId }) => onChange(fileId)} />
          {url && !disabled ? (
            <Button type="button" variant="ghost" className="justify-self-start" onClick={() => onChange(null)}>
              <Trash size={18} aria-hidden="true" />
              {t('uploads.remove')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Paso 5 y "Página pública" del panel (PAGE-01): cómo ven al Guía los Exploradores. */
export function StepPage({ mine }: Omit<StepProps, 'sports'>) {
  const t = useTranslations();
  const errors = useErrorText();
  const { host } = mine;
  const { can, lockedReason } = useHostEditing(mine);
  const [descriptionLocale, setDescriptionLocale] = useState<Locale>(
    (LOCALES.find((locale) => host.description[locale]) ?? 'es') as Locale,
  );
  const { form, autosave } = useDraftForm<PageForm>(FIELDS, {
    description: { es: host.description.es ?? '', en: host.description.en ?? '', fr: host.description.fr ?? '' },
    languages: host.languages,
    socialLinks: Object.fromEntries(SOCIAL_NETWORKS.map((network) => [network, host.socialLinks[network] ?? ''])) as Record<
      SocialNetwork,
      string
    >,
  });
  const pageLocked = !can('page');
  const locked = lockedReason('page');
  const descriptionId = useId();

  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid gap-8">
      <AutosaveIndicator status={autosave.status} />
      {locked ? <LockedNotice>{locked}</LockedNotice> : null}

      <SlugField initial={host.slug ?? ''} disabled={!can('slug')} onAvailable={(slug) => autosave.queue({ slug }, true)} />

      <Controller
        control={form.control}
        name="description"
        render={({ field, fieldState }) => {
          const value = field.value[descriptionLocale] ?? '';
          return (
            <Field data-invalid={fieldState.invalid || undefined}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <FieldLabel htmlFor={descriptionId}>{t('host.description')}</FieldLabel>
                <div role="group" aria-label={t('common.language')} className="inline-flex rounded-lg border border-border p-0.5">
                  {LOCALES.map((locale) => (
                    <button
                      key={locale}
                      type="button"
                      aria-pressed={descriptionLocale === locale}
                      onClick={() => setDescriptionLocale(locale)}
                      className={`inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-colors duration-150 ${
                        descriptionLocale === locale ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      {field.value[locale] ? <Check size={14} weight="bold" aria-hidden="true" /> : null}
                      {LOCALE_LABELS[locale]}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                id={descriptionId}
                lang={descriptionLocale}
                value={value}
                rows={7}
                maxLength={2000}
                disabled={pageLocked}
                onChange={(event) => field.onChange({ ...field.value, [descriptionLocale]: event.target.value })}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid}
                aria-describedby={`${descriptionId}-hint`}
              />
              <FieldDescription id={`${descriptionId}-hint`} className="flex flex-wrap justify-between gap-2">
                <span>
                  {t('host.descriptionHint', { min: HOST_DESCRIPTION_MIN })} {t('host.descriptionTranslations')}
                </span>
                <span className={`tabular-nums ${value.length >= HOST_DESCRIPTION_MIN ? 'text-success' : ''}`}>
                  {t('host.descriptionCount', { count: value.length, min: HOST_DESCRIPTION_MIN })}
                </span>
              </FieldDescription>
              <FieldError>{errors.field(fieldState.error?.message)}</FieldError>
            </Field>
          );
        }}
      />

      <Controller
        control={form.control}
        name="languages"
        render={({ field }) => (
          <FieldSet>
            <FieldLegend variant="label" className="text-sm font-semibold">
              {t('host.languagesServed')}
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
                    disabled={pageLocked}
                    onClick={() => field.onChange(checked ? field.value.filter((l) => l !== language) : [...field.value, language])}
                    className={`inline-flex h-11 items-center gap-2 rounded-full border-2 px-4 font-semibold transition-colors duration-150 disabled:opacity-60 ${
                      checked ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
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

      <div className="grid gap-8 lg:grid-cols-2">
        <ImageField
          label={t('host.logo')}
          hint={t('host.logoHint')}
          url={host.logoUrl}
          purpose="HOST_LOGO"
          aspect="square"
          disabled={pageLocked}
          onChange={(fileId) => autosave.queue({ logoFileId: fileId }, true)}
        />
        <ImageField
          label={t('host.cover')}
          hint={t('host.coverHint')}
          url={host.coverUrl}
          purpose="HOST_COVER"
          aspect="wide"
          disabled={pageLocked}
          onChange={(fileId) => autosave.queue({ coverFileId: fileId }, true)}
        />
      </div>

      <FieldSet>
        <FieldLegend className="font-display text-2xl font-extrabold uppercase italic">{t('host.socialLinks')}</FieldLegend>
        <p className="text-muted-foreground">{t('host.socialLinksHint')}</p>
        <div className="grid gap-5 md:grid-cols-2">
          {SOCIAL_NETWORKS.map((network) => (
            <TextField
              key={network}
              control={form.control}
              name={`socialLinks.${network}`}
              label={t(`socialNetworks.${network}`)}
              placeholder={SOCIAL_PLACEHOLDERS[network]}
              type={network === 'whatsapp' ? 'tel' : 'url'}
              inputMode={network === 'whatsapp' ? 'tel' : 'url'}
              autoComplete="off"
              disabled={pageLocked}
            />
          ))}
        </div>
      </FieldSet>
    </form>
  );
}
