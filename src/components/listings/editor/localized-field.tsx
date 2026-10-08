'use client';

import { LOCALES, type Locale } from '@juandavidfuentes/indomitox-shared';
import { Check } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useState, type ReactNode } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useErrorText } from '@/lib/forms';

const LOCALE_LABELS: Record<Locale, string> = { es: 'Español', en: 'English', fr: 'Français' };

export type LocalizedValue = Record<Locale, string>;

export const emptyLocalized = (value?: Partial<Record<Locale, string>> | null): LocalizedValue => ({
  es: value?.es ?? '',
  en: value?.en ?? '',
  fr: value?.fr ?? '',
});

/**
 * Texto en varios idiomas (I18N-02): el Guía escribe en el suyo y, si quiere, en los demás; una
 * marca muestra cuáles tienen texto. Empieza en el idioma de la interfaz si ya tiene texto, o en
 * el primero que lo tenga.
 */
export function LocalizedField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  multiline = false,
  rows = 5,
  maxLength,
  minLength,
  placeholder,
  disabled,
  footer,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: ReactNode;
  multiline?: boolean;
  rows?: number;
  maxLength: number;
  /** Muestra el conteo hacia un mínimo (título y descripción). */
  minLength?: number;
  placeholder?: string;
  disabled?: boolean;
  footer?: ReactNode;
}) {
  const t = useTranslations('listings');
  const uiLocale = useLocale() as Locale;
  const errors = useErrorText();
  const id = useId();
  const [locale, setLocale] = useState<Locale | null>(null);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = (field.value ?? emptyLocalized()) as LocalizedValue;
        const current = locale ?? (value[uiLocale] ? uiLocale : (LOCALES.find((l) => value[l]) ?? uiLocale));
        const text = value[current] ?? '';
        const Control = multiline ? Textarea : Input;
        return (
          <Field data-invalid={fieldState.invalid || undefined}>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <FieldLabel htmlFor={id}>{label}</FieldLabel>
              <div role="group" aria-label={t('textLanguage', { field: label })} className="inline-flex rounded-lg border border-border p-0.5">
                {LOCALES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={current === option}
                    onClick={() => setLocale(option)}
                    className={`inline-flex min-h-9 items-center gap-1 rounded-md px-2.5 text-sm font-semibold transition-colors duration-150 ${
                      current === option ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    {value[option] ? <Check size={13} weight="bold" aria-hidden="true" /> : null}
                    <span className="sm:hidden">{option.toUpperCase()}</span>
                    <span className="max-sm:hidden">{LOCALE_LABELS[option]}</span>
                  </button>
                ))}
              </div>
            </div>
            <Control
              id={id}
              lang={current}
              value={text}
              {...(multiline ? { rows } : {})}
              maxLength={maxLength}
              placeholder={placeholder}
              disabled={disabled ?? field.disabled}
              onChange={(event: { target: { value: string } }) => field.onChange({ ...value, [current]: event.target.value })}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
              aria-describedby={`${id}-hint`}
            />
            <FieldDescription id={`${id}-hint`} className="flex flex-wrap justify-between gap-2">
              <span>{description}</span>
              {minLength ? (
                <span className={`tabular-nums ${text.trim().length >= minLength ? 'text-success' : ''}`}>
                  {t('charCount', { count: text.trim().length, min: minLength })}
                </span>
              ) : null}
            </FieldDescription>
            {footer}
            <FieldError>{errors.field(fieldState.error?.message)}</FieldError>
          </Field>
        );
      }}
    />
  );
}
