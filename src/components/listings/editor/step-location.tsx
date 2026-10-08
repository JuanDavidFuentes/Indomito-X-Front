'use client';

import {
  GeoPointSchema,
  isServiceListing,
  ListingDraftSchema,
  mapsUrl,
  type GeoPoint,
} from '@juandavidfuentes/indomitox-shared';
import { ArrowSquareOut, Crosshair } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { AutosaveIndicator } from '@/components/host/autosave-indicator';
import { TextField } from '@/components/forms/fields';
import { MunicipalityCombobox } from '@/components/forms/municipality-combobox';
import { LocationMap } from '@/components/maps/location-map';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useMunicipality } from '@/lib/catalog';
import { useErrorText } from '@/lib/forms';
import { emptyLocalized, LocalizedField, type LocalizedValue } from './localized-field';
import type { StepProps } from './step-props';
import { useListingForm } from './use-listing-form';

const FIELDS = {
  municipalityCode: ListingDraftSchema.shape.municipalityCode,
  address: ListingDraftSchema.shape.address,
  meetingPoint: ListingDraftSchema.shape.meetingPoint,
  meetingNotes: ListingDraftSchema.shape.meetingNotes,
};

interface LocationForm {
  municipalityCode: string | null;
  address: string;
  meetingPoint: GeoPoint | null;
  meetingNotes: LocalizedValue;
}

/** Coordenadas escritas a mano: la alternativa de teclado al mapa (WCAG 2.5.7). */
function CoordinatesFields({ point, onChange, disabled }: { point: GeoPoint | null; onChange: (point: GeoPoint) => void; disabled: boolean }) {
  const t = useTranslations();
  const errors = useErrorText();
  const [draft, setDraft] = useState<{ lat: string; lng: string } | null>(null);
  const lat = draft?.lat ?? (point ? String(point.lat) : '');
  const lng = draft?.lng ?? (point ? String(point.lng) : '');
  const parsed = GeoPointSchema.safeParse({ lat: Number(lat.replace(',', '.')), lng: Number(lng.replace(',', '.')) });
  const problem = draft && lat && lng && !parsed.success ? errors.field(parsed.error.issues[0]?.message) : undefined;

  const update = (next: { lat: string; lng: string }) => {
    setDraft(next);
    const result = GeoPointSchema.safeParse({ lat: Number(next.lat.replace(',', '.')), lng: Number(next.lng.replace(',', '.')) });
    if (next.lat && next.lng && result.success) onChange(result.data);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="meeting-lat">{t('maps.latitude')}</FieldLabel>
        <Input id="meeting-lat" inputMode="decimal" value={lat} disabled={disabled} onChange={(event) => update({ lat: event.target.value, lng })} />
      </Field>
      <Field>
        <FieldLabel htmlFor="meeting-lng">{t('maps.longitude')}</FieldLabel>
        <Input id="meeting-lng" inputMode="decimal" value={lng} disabled={disabled} onChange={(event) => update({ lat, lng: event.target.value })} />
      </Field>
      {problem ? <FieldError className="sm:col-span-2">{problem}</FieldError> : null}
    </div>
  );
}

/** Paso 2: dónde (municipio, dirección y punto de encuentro o de recogida) (LIST-02, LIST-03). */
export function StepLocation({ data, editable }: StepProps) {
  const t = useTranslations();
  const errors = useErrorText();
  const { listing } = data;
  const service = isServiceListing(listing.type);
  const { form, autosave } = useListingForm<LocationForm>(
    listing.id,
    FIELDS,
    {
      municipalityCode: listing.municipalityCode,
      address: listing.address ?? '',
      meetingPoint: listing.meetingPoint,
      meetingNotes: emptyLocalized(listing.meetingNotes),
    },
    { disabled: !editable },
  );
  const [municipalityCode, meetingPoint] = useWatch({ control: form.control, name: ['municipalityCode', 'meetingPoint'] });
  const municipality = useMunicipality(municipalityCode);
  const setPoint = (point: GeoPoint) => form.setValue('meetingPoint', point, { shouldDirty: true, shouldTouch: true });

  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid gap-8">
      <AutosaveIndicator status={autosave.status} />
      <div className="grid gap-5 md:grid-cols-2">
        <Controller
          control={form.control}
          name="municipalityCode"
          render={({ field, fieldState }) => (
            <MunicipalityCombobox
              label={t('listings.fields.municipality')}
              description={t('listings.fields.municipalityHint')}
              value={field.value}
              onChange={(code) => field.onChange(code)}
              onBlur={field.onBlur}
              error={errors.field(fieldState.error?.message)}
              disabled={field.disabled}
            />
          )}
        />
        <TextField
          control={form.control}
          name="address"
          label={service ? t('listings.fields.meetingAddress') : t('listings.fields.pickupAddress')}
          description={service ? t('listings.fields.meetingAddressHint') : t('listings.fields.pickupAddressHint')}
          autoComplete="street-address"
        />
      </div>

      {service ? (
        <FieldSet>
          <FieldLegend className="font-display text-2xl font-extrabold uppercase italic">{t('listings.fields.meetingPoint')}</FieldLegend>
          <p className="-mt-2 text-muted-foreground">{t('listings.fields.meetingPointHint')}</p>
          <Controller
            control={form.control}
            name="meetingPoint"
            render={({ field, fieldState }) => (
              <div className="grid gap-4">
                <LocationMap
                  point={field.value}
                  onPick={editable ? setPoint : undefined}
                  label={t('listings.fields.meetingPointMap')}
                  className="h-80"
                  zoom={14}
                />
                <div className="flex flex-wrap gap-3">
                  {municipality.data && editable ? (
                    <Button type="button" variant="outline" onClick={() => setPoint({ lat: municipality.data.lat, lng: municipality.data.lng })}>
                      <Crosshair size={18} aria-hidden="true" />
                      {t('listings.fields.useMunicipalityCenter', { name: municipality.data.name })}
                    </Button>
                  ) : null}
                  {meetingPoint ? (
                    <a
                      href={mapsUrl(meetingPoint)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center gap-2 rounded-lg px-3 font-semibold text-secondary underline-offset-4 hover:underline"
                    >
                      <ArrowSquareOut size={18} aria-hidden="true" />
                      {t('listings.fields.openInMaps')}
                    </a>
                  ) : null}
                </div>
                <details className="rounded-lg border border-border p-4">
                  <summary className="cursor-pointer font-semibold">{t('listings.fields.typeCoordinates')}</summary>
                  <div className="mt-4">
                    <CoordinatesFields point={field.value} onChange={setPoint} disabled={!editable} />
                  </div>
                </details>
                <FieldError>{errors.field(fieldState.error?.message)}</FieldError>
              </div>
            )}
          />
          <LocalizedField
            control={form.control}
            name="meetingNotes"
            label={`${t('listings.fields.meetingNotes')} (${t('common.optional')})`}
            description={t('listings.fields.meetingNotesHint')}
            multiline
            rows={3}
            maxLength={500}
          />
        </FieldSet>
      ) : null}
    </form>
  );
}
