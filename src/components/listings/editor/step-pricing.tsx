'use client';

import {
  CANCELLATION_POLICIES,
  formatMoney,
  LISTING_PRICE_UNITS,
  ListingDraftSchema,
  PAYMENT_MODES,
  type CancellationPolicy,
  type Locale,
  type PaymentMode,
  type PriceUnit,
} from '@juandavidfuentes/indomitox-shared';
import { Check } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { AutosaveIndicator } from '@/components/host/autosave-indicator';
import { TextField } from '@/components/forms/fields';
import { FieldError, FieldLegend, FieldSet } from '@/components/ui/field';
import { useErrorText } from '@/lib/forms';
import { minorToPesos, pesosToMinor } from '@/lib/listings';
import type { StepProps } from './step-props';
import { numberField, useListingForm } from './use-listing-form';

const shape = ListingDraftSchema.shape;

const FIELDS = {
  // El Guía escribe pesos ("80.000"); la API guarda unidades menores.
  basePriceMinor: z.preprocess((value) => (typeof value === 'string' ? pesosToMinor(value) : value), shape.basePriceMinor),
  priceUnit: shape.priceUnit,
  paymentModes: shape.paymentModes,
  cancellationPolicy: shape.cancellationPolicy,
  rentalUnits: numberField(shape.rentalUnits),
  rentalMinDuration: numberField(shape.rentalMinDuration),
  rentalMaxDuration: numberField(shape.rentalMaxDuration),
};

interface PricingForm {
  basePriceMinor: string;
  priceUnit: PriceUnit;
  paymentModes: PaymentMode[];
  cancellationPolicy: CancellationPolicy;
  rentalUnits: string;
  rentalMinDuration: string;
  rentalMaxDuration: string;
}

/** Tarjetas de opción con título y explicación (radio o casillas). */
function OptionCards<V extends string>({
  legend,
  options,
  value,
  onChange,
  multiple,
  disabled,
  error,
}: {
  legend: string;
  options: { value: V; title: string; hint: string }[];
  value: V[];
  onChange: (value: V[]) => void;
  multiple: boolean;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <FieldSet>
      <FieldLegend className="font-display text-2xl font-extrabold uppercase italic">{legend}</FieldLegend>
      <div role={multiple ? 'group' : 'radiogroup'} aria-label={legend} className="grid gap-3 md:grid-cols-3">
        {options.map((option) => {
          const checked = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              role={multiple ? 'checkbox' : 'radio'}
              aria-checked={checked}
              disabled={disabled}
              onClick={() =>
                onChange(multiple ? (checked ? value.filter((v) => v !== option.value) : [...value, option.value]) : [option.value])
              }
              className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-colors duration-150 disabled:opacity-60 ${
                checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="flex w-full items-center justify-between gap-2 font-semibold">
                {option.title}
                <span
                  aria-hidden="true"
                  className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}
                >
                  {checked ? <Check size={12} weight="bold" /> : null}
                </span>
              </span>
              <span className="text-sm text-muted-foreground">{option.hint}</span>
            </button>
          );
        })}
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </FieldSet>
  );
}

/** Paso 5: precio en pesos, formas de pago y política de cancelación (LIST-01, CANC-01, PAY-11). */
export function StepPricing({ data, editable }: StepProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const errors = useErrorText();
  const { listing } = data;
  const rental = listing.type === 'RENTAL';
  const { form, autosave } = useListingForm<PricingForm>(
    listing.id,
    FIELDS,
    {
      basePriceMinor: minorToPesos(listing.basePriceMinor),
      priceUnit: listing.priceUnit,
      paymentModes: listing.paymentModes,
      cancellationPolicy: listing.cancellationPolicy,
      rentalUnits: listing.rentalUnits === null ? '' : String(listing.rentalUnits),
      rentalMinDuration: listing.rentalMinDuration === null ? '' : String(listing.rentalMinDuration),
      rentalMaxDuration: listing.rentalMaxDuration === null ? '' : String(listing.rentalMaxDuration),
    },
    { disabled: !editable },
  );
  const [price, unit] = useWatch({ control: form.control, name: ['basePriceMinor', 'priceUnit'] });
  const minor = pesosToMinor(price);
  const durationUnit = unit === 'PER_UNIT_DAY' ? 'days' : 'hours';

  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid gap-10">
      <AutosaveIndicator status={autosave.status} />
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          control={form.control}
          name="basePriceMinor"
          label={t('listings.fields.price')}
          description={t('listings.fields.priceHint')}
          inputMode="numeric"
          autoComplete="off"
        />
        <div className="grid content-start gap-1 rounded-xl bg-muted p-4" aria-live="polite">
          <span className="text-sm text-muted-foreground">{t('listings.fields.pricePreview')}</span>
          <span className="font-display text-3xl font-bold tabular-nums">
            {minor ? `${formatMoney(minor, 'COP', locale)}` : '—'} <span className="text-lg font-semibold">{t(`priceUnit.${unit}`)}</span>
          </span>
        </div>
      </div>

      {rental ? (
        <FieldSet>
          <FieldLegend className="font-display text-2xl font-extrabold uppercase italic">{t('listings.fields.rental')}</FieldLegend>
          <Controller
            control={form.control}
            name="priceUnit"
            render={({ field }) => (
              <div role="radiogroup" aria-label={t('listings.fields.rentalUnit')} className="flex flex-wrap gap-2">
                {LISTING_PRICE_UNITS.RENTAL.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={field.value === option}
                    disabled={field.disabled}
                    onClick={() => field.onChange(option)}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 font-semibold transition-colors duration-150 ${
                      field.value === option ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {field.value === option ? <Check size={16} weight="bold" aria-hidden="true" /> : null}
                    {t(`priceUnit.${option}`)}
                  </button>
                ))}
              </div>
            )}
          />
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField control={form.control} name="rentalUnits" label={t('listings.fields.rentalUnits')} description={t('listings.fields.rentalUnitsHint')} inputMode="numeric" />
            <TextField control={form.control} name="rentalMinDuration" label={t(`listings.fields.rentalMin.${durationUnit}`)} inputMode="numeric" />
            <TextField control={form.control} name="rentalMaxDuration" label={t(`listings.fields.rentalMax.${durationUnit}`)} inputMode="numeric" />
          </div>
        </FieldSet>
      ) : null}

      <Controller
        control={form.control}
        name="paymentModes"
        render={({ field, fieldState }) => (
          <OptionCards
            legend={t('listings.fields.paymentModes')}
            multiple
            options={PAYMENT_MODES.map((mode) => ({ value: mode, title: t(`paymentMode.${mode}`), hint: t(`paymentModeHint.${mode}`) }))}
            value={field.value}
            onChange={field.onChange}
            disabled={field.disabled}
            error={errors.field(field.value.length === 0 ? 'validation.selectAtLeastOne' : fieldState.error?.message)}
          />
        )}
      />

      <Controller
        control={form.control}
        name="cancellationPolicy"
        render={({ field }) => (
          <OptionCards
            legend={t('listings.fields.cancellationPolicy')}
            multiple={false}
            options={CANCELLATION_POLICIES.map((policy) => ({
              value: policy,
              title: t(`cancellationPolicy.${policy}`),
              hint: t(`cancellationPolicyHint.${policy}`),
            }))}
            value={[field.value]}
            onChange={(value) => field.onChange(value[0])}
            disabled={field.disabled}
          />
        )}
      />
    </form>
  );
}
