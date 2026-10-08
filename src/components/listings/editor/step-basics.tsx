'use client';

import {
  isServiceListing,
  LISTING_LIMITS,
  ListingDraftSchema,
  SPOKEN_LANGUAGES,
  type SpokenLanguage,
} from '@juandavidfuentes/indomitox-shared';
import { ShieldCheck } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Controller } from 'react-hook-form';
import { AutosaveIndicator } from '@/components/host/autosave-indicator';
import { ToggleChips } from '@/components/forms/toggle-chips';
import { Link } from '@/i18n/navigation';
import { useSportName } from '@/lib/catalog';
import { useErrorText } from '@/lib/forms';
import { emptyLocalized, LocalizedField, type LocalizedValue } from './localized-field';
import type { StepProps } from './step-props';
import { useListingForm } from './use-listing-form';

const FIELDS = {
  title: ListingDraftSchema.shape.title,
  description: ListingDraftSchema.shape.description,
  sportKeys: ListingDraftSchema.shape.sportKeys,
  languages: ListingDraftSchema.shape.languages,
};

interface BasicsForm {
  title: LocalizedValue;
  description: LocalizedValue;
  sportKeys: string[];
  languages: SpokenLanguage[];
}

/** Paso 1: lo que es (título, descripción, deportes) y en qué idiomas se atiende (LIST-01). */
export function StepBasics({ data, editable, hostSportKeys, catalog }: StepProps) {
  const t = useTranslations();
  const errors = useErrorText();
  const sportName = useSportName(catalog);
  const { listing } = data;
  const service = isServiceListing(listing.type);
  const { form, autosave } = useListingForm<BasicsForm>(
    listing.id,
    FIELDS,
    {
      title: emptyLocalized(listing.title),
      description: emptyLocalized(listing.description),
      sportKeys: listing.sportKeys,
      languages: listing.languages,
    },
    { disabled: !editable },
  );
  // Un servicio solo usa las actividades que el Guía declaró (sus NTS están entre los requisitos).
  const sportOptions = catalog.filter((sport) => !service || hostSportKeys.includes(sport.key));

  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid gap-8">
      <AutosaveIndicator status={autosave.status} />
      <LocalizedField
        control={form.control}
        name="title"
        label={t('listings.fields.title')}
        description={t('listings.fields.titleHint')}
        maxLength={LISTING_LIMITS.titleMax}
        minLength={LISTING_LIMITS.titleMin}
        placeholder={t(`listings.titlePlaceholder.${listing.type}`)}
      />
      <LocalizedField
        control={form.control}
        name="description"
        label={t('listings.fields.description')}
        description={t('listings.fields.descriptionHint')}
        multiline
        rows={8}
        maxLength={LISTING_LIMITS.descriptionMax}
        minLength={LISTING_LIMITS.descriptionMin}
      />
      <Controller
        control={form.control}
        name="sportKeys"
        render={({ field, fieldState }) => (
          <ToggleChips
            legend={t('listings.fields.sports')}
            hint={
              service ? (
                <>
                  {t('listings.fields.sportsServiceHint')}{' '}
                  <Link href={{ pathname: '/panel/verificacion', query: { step: 'company' } }} className="font-semibold text-primary underline-offset-4 hover:underline">
                    {t('listings.fields.sportsAddMore')}
                  </Link>
                </>
              ) : (
                t('listings.fields.sportsProductHint')
              )
            }
            options={sportOptions.map((sport) => ({
              value: sport.key,
              label: sportName(sport.key),
              extra:
                service && sport.requiresNts ? (
                  <span className="inline-flex items-center gap-0.5 rounded bg-secondary px-1.5 py-0.5 text-xs font-bold text-secondary-foreground">
                    <ShieldCheck size={12} weight="bold" aria-hidden="true" />
                    {t('host.ntsBadge')}
                  </span>
                ) : null,
            }))}
            value={field.value}
            onChange={field.onChange}
            max={LISTING_LIMITS.sportsMax}
            disabled={field.disabled}
            error={errors.field(fieldState.error?.message)}
          />
        )}
      />
      {service ? (
        <Controller
          control={form.control}
          name="languages"
          render={({ field, fieldState }) => (
            <ToggleChips
              legend={t('listings.fields.languages')}
              hint={t('listings.fields.languagesHint')}
              options={SPOKEN_LANGUAGES.map((language) => ({ value: language, label: t(`spokenLanguages.${language}`) }))}
              value={field.value}
              onChange={field.onChange}
              disabled={field.disabled}
              error={errors.field(fieldState.error?.message)}
            />
          )}
        />
      ) : null}
    </form>
  );
}
