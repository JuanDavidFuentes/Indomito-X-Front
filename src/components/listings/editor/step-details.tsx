'use client';

import {
  DIFFICULTIES,
  FITNESS_LEVELS,
  ListingDraftSchema,
  type Difficulty,
  type FitnessLevel,
} from '@juandavidfuentes/indomitox-shared';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { z } from 'zod';
import { AutosaveIndicator } from '@/components/host/autosave-indicator';
import { CheckboxField, TextField } from '@/components/forms/fields';
import { ToggleChips } from '@/components/forms/toggle-chips';
import { DifficultyShape } from '@/components/listing/difficulty';
import { FieldError, FieldLegend, FieldSet } from '@/components/ui/field';
import { useErrorText } from '@/lib/forms';
import { emptyLocalized, LocalizedField, type LocalizedValue } from './localized-field';
import type { StepProps } from './step-props';
import { numberField, toNumberOrNull, useListingForm } from './use-listing-form';

const shape = ListingDraftSchema.shape;

/** La duración se escribe en horas ("1,5" = 90 minutos) y se guarda en minutos. */
const hoursToMinutes = (value: unknown) => {
  const hours = toNumberOrNull(value);
  return typeof hours === 'number' && Number.isFinite(hours) ? Math.round(hours * 60) : hours;
};

const FIELDS = {
  durationMinutes: z.preprocess(hoursToMinutes, shape.durationMinutes),
  durationDays: numberField(shape.durationDays),
  sessionsCount: numberField(shape.sessionsCount),
  difficulty: shape.difficulty,
  minAge: numberField(shape.minAge),
  minWeightKg: numberField(shape.minWeightKg),
  maxWeightKg: numberField(shape.maxWeightKg),
  fitnessLevel: shape.fitnessLevel,
  mustSwim: shape.mustSwim,
  medicalRestrictions: shape.medicalRestrictions,
  includes: shape.includes,
  excludes: shape.excludes,
  whatToBring: shape.whatToBring,
  equipmentIncluded: shape.equipmentIncluded,
  hostDisclaimer: shape.hostDisclaimer,
};

interface DetailsForm {
  durationMinutes: string;
  durationDays: string;
  sessionsCount: string;
  difficulty: Difficulty | null;
  minAge: string;
  minWeightKg: string;
  maxWeightKg: string;
  fitnessLevel: FitnessLevel | null;
  mustSwim: boolean;
  medicalRestrictions: LocalizedValue;
  includes: LocalizedValue;
  excludes: LocalizedValue;
  whatToBring: LocalizedValue;
  equipmentIncluded: LocalizedValue;
  hostDisclaimer: LocalizedValue;
}

const text = (value: number | null) => (value === null ? '' : String(value));

/** Paso 3 de los servicios: duración, dificultad, requisitos, qué incluye y el descargo (LIST-02). */
export function StepDetails({ data, editable }: StepProps) {
  const t = useTranslations();
  const errors = useErrorText();
  const { listing } = data;
  const { type } = listing;
  // Cada tipo usa solo sus campos: el formulario solo registra esos (los demás no se envían).
  const fields = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(FIELDS).filter(([field]) => {
          if (field === 'durationMinutes') return type === 'EXPERIENCE' || type === 'COURSE';
          if (field === 'durationDays') return type === 'PACKAGE';
          if (field === 'sessionsCount') return type === 'COURSE';
          return true;
        }),
      ) as Partial<typeof FIELDS>,
    [type],
  );
  const { form, autosave } = useListingForm<DetailsForm>(listing.id, fields, {
    durationMinutes: listing.durationMinutes === null ? '' : String(Math.round((listing.durationMinutes / 60) * 100) / 100),
    durationDays: text(listing.durationDays),
    sessionsCount: text(listing.sessionsCount),
    difficulty: listing.difficulty,
    minAge: text(listing.minAge),
    minWeightKg: text(listing.minWeightKg),
    maxWeightKg: text(listing.maxWeightKg),
    fitnessLevel: listing.fitnessLevel,
    mustSwim: listing.mustSwim,
    medicalRestrictions: emptyLocalized(listing.medicalRestrictions),
    includes: emptyLocalized(listing.includes),
    excludes: emptyLocalized(listing.excludes),
    whatToBring: emptyLocalized(listing.whatToBring),
    equipmentIncluded: emptyLocalized(listing.equipmentIncluded),
    hostDisclaimer: emptyLocalized(listing.hostDisclaimer),
  }, { disabled: !editable });
  const linesHint = t('listings.fields.oneItemPerLine');

  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid gap-10">
      <AutosaveIndicator status={autosave.status} />

      {type !== 'RENTAL' ? (
        <div className="grid gap-5 sm:grid-cols-3">
          {type === 'EXPERIENCE' || type === 'COURSE' ? (
            <TextField
              control={form.control}
              name="durationMinutes"
              label={type === 'COURSE' ? t('listings.fields.sessionHours') : t('listings.fields.durationHours')}
              description={t('listings.fields.durationHoursHint')}
              inputMode="decimal"
            />
          ) : null}
          {type === 'PACKAGE' ? (
            <TextField control={form.control} name="durationDays" label={t('listings.fields.durationDays')} inputMode="numeric" />
          ) : null}
          {type === 'COURSE' ? (
            <TextField control={form.control} name="sessionsCount" label={t('listings.fields.sessionsCount')} inputMode="numeric" />
          ) : null}
        </div>
      ) : null}

      <Controller
        control={form.control}
        name="difficulty"
        render={({ field, fieldState }) => (
          <FieldSet>
            <FieldLegend className="font-display text-2xl font-extrabold uppercase italic">{t('listings.fields.difficulty')}</FieldLegend>
            <div role="radiogroup" aria-label={t('listings.fields.difficulty')} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {DIFFICULTIES.map((level) => {
                const checked = field.value === level;
                return (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    disabled={field.disabled}
                    onClick={() => field.onChange(level)}
                    className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-colors duration-150 disabled:opacity-60 ${
                      checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-display text-xl font-bold uppercase">
                      <DifficultyShape level={level} className="h-3.5" />
                      {t(`difficulty.${level}`)}
                    </span>
                    <span className="text-sm text-muted-foreground">{t(`home.levels.${level}`)}</span>
                  </button>
                );
              })}
            </div>
            <FieldError>{errors.field(fieldState.error?.message)}</FieldError>
          </FieldSet>
        )}
      />

      <FieldSet>
        <FieldLegend className="font-display text-2xl font-extrabold uppercase italic">{t('listings.fields.requirements')}</FieldLegend>
        <p className="-mt-2 text-muted-foreground">{t('listings.fields.requirementsHint')}</p>
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField control={form.control} name="minAge" label={t('listings.fields.minAge')} inputMode="numeric" />
          <TextField control={form.control} name="minWeightKg" label={t('listings.fields.minWeight')} inputMode="numeric" />
          <TextField control={form.control} name="maxWeightKg" label={t('listings.fields.maxWeight')} inputMode="numeric" />
        </div>
        <Controller
          control={form.control}
          name="fitnessLevel"
          render={({ field }) => (
            <ToggleChips
              legend={t('listings.fields.fitnessLevel')}
              multiple={false}
              options={FITNESS_LEVELS.map((level) => ({ value: level, label: t(`fitnessLevel.${level}`) }))}
              value={field.value ? [field.value] : []}
              onChange={(value) => field.onChange(value[0] === field.value ? null : (value[0] ?? null))}
              disabled={field.disabled}
            />
          )}
        />
        <CheckboxField control={form.control} name="mustSwim" label={t('listings.fields.mustSwim')} />
        <LocalizedField
          control={form.control}
          name="medicalRestrictions"
          label={`${t('listings.fields.medicalRestrictions')} (${t('common.optional')})`}
          description={t('listings.fields.medicalRestrictionsHint')}
          multiline
          rows={3}
          maxLength={1000}
        />
      </FieldSet>

      <FieldSet>
        <FieldLegend className="font-display text-2xl font-extrabold uppercase italic">{t('listings.fields.whatsIncluded')}</FieldLegend>
        <div className="grid gap-6 lg:grid-cols-2">
          <LocalizedField control={form.control} name="includes" label={t('listings.fields.includes')} description={linesHint} multiline rows={5} maxLength={2000} />
          <LocalizedField control={form.control} name="excludes" label={`${t('listings.fields.excludes')} (${t('common.optional')})`} description={linesHint} multiline rows={5} maxLength={2000} />
          <LocalizedField control={form.control} name="whatToBring" label={`${t('listings.fields.whatToBring')} (${t('common.optional')})`} description={linesHint} multiline rows={5} maxLength={2000} />
          <LocalizedField
            control={form.control}
            name="equipmentIncluded"
            label={`${t('listings.fields.equipmentIncluded')} (${t('common.optional')})`}
            description={linesHint}
            multiline
            rows={5}
            maxLength={2000}
          />
        </div>
      </FieldSet>

      <LocalizedField
        control={form.control}
        name="hostDisclaimer"
        label={`${t('listings.fields.hostDisclaimer')} (${t('common.optional')})`}
        description={t('listings.fields.hostDisclaimerHint')}
        multiline
        rows={4}
        maxLength={3000}
      />
    </form>
  );
}
