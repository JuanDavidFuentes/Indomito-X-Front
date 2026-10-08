'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CatalogSlugSchema,
  COLOMBIA_DEPARTMENTS,
  DepartmentSchema,
  departmentName,
  LatitudeSchema,
  LOCALES,
  LongitudeSchema,
  MunicipalityCodeSchema,
  pickLocalized,
  ZONE_RADIUS_MAX_M,
  ZONE_RADIUS_MIN_M,
  ZoneNamesSchema,
  type Locale,
  type ZoneDto,
} from '@juandavidfuentes/indomitox-shared';
import { CircleDashed, MapPinArea, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { CheckboxField, TextField } from '@/components/forms/fields';
import { MunicipalityCombobox } from '@/components/forms/municipality-combobox';
import { LocationMap } from '@/components/maps/location-map';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { useErrorText } from '@/lib/forms';

export const ADMIN_ZONES_KEY = ['admin', 'zones'] as const;

const blankToUndefined = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value);
const toNumber = (value: unknown) => (typeof value === 'string' ? (value.trim() === '' ? undefined : Number(value.replace(',', '.'))) : value);

const ZoneFormSchema = z.object({
  names: ZoneNamesSchema,
  slug: z.preprocess(blankToUndefined, CatalogSlugSchema.optional()),
  departmentCode: DepartmentSchema,
  municipalityCode: MunicipalityCodeSchema.nullable(),
  lat: z.preprocess(toNumber, LatitudeSchema),
  lng: z.preprocess(toNumber, LongitudeSchema),
  radiusKm: z.preprocess(
    toNumber,
    z
      .number({ error: 'validation.required' })
      .min(ZONE_RADIUS_MIN_M / 1000, { error: 'validation.radiusOutOfRange' })
      .max(ZONE_RADIUS_MAX_M / 1000, { error: 'validation.radiusOutOfRange' }),
  ),
  active: z.boolean(),
});

interface ZoneForm {
  names: Record<Locale, string>;
  slug: string;
  departmentCode: string;
  municipalityCode: string | null;
  lat: string;
  lng: string;
  radiusKm: string;
  active: boolean;
}

function toForm(zone?: ZoneDto): ZoneForm {
  return {
    names: { es: zone?.names.es ?? '', en: zone?.names.en ?? '', fr: zone?.names.fr ?? '' },
    slug: zone?.slug ?? '',
    departmentCode: zone?.departmentCode ?? '68',
    municipalityCode: zone?.municipalityCode ?? null,
    lat: zone ? String(zone.center.lat) : '',
    lng: zone ? String(zone.center.lng) : '',
    radiusKm: zone ? String(zone.radiusMeters / 1000) : '5',
    active: zone?.active ?? true,
  };
}

/** Errores de la API (`center.lat`, `radiusMeters`) → campos del formulario. */
const API_PATHS: Record<string, keyof ZoneForm | `names.${Locale}`> = {
  'center.lat': 'lat',
  'center.lng': 'lng',
  radiusMeters: 'radiusKm',
  slug: 'slug',
  'names.es': 'names.es',
  'names.en': 'names.en',
  'names.fr': 'names.fr',
};

function ZoneDialog({ zone, open, onOpenChange }: { zone?: ZoneDto; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations();
  const errors = useErrorText();
  const queryClient = useQueryClient();
  const form = useForm<ZoneForm>({
    resolver: zodResolver(ZoneFormSchema) as unknown as Resolver<ZoneForm>,
    defaultValues: toForm(zone),
    mode: 'onTouched',
  });
  const [lat, lng, radiusKm] = useWatch({ control: form.control, name: ['lat', 'lng', 'radiusKm'] });
  const point = LatitudeSchema.safeParse(Number(lat)).success && LongitudeSchema.safeParse(Number(lng)).success && lat && lng
    ? { lat: Number(lat), lng: Number(lng) }
    : null;
  const radius = Number(radiusKm) > 0 ? Number(radiusKm) * 1000 : null;

  const submit = form.handleSubmit(async (values) => {
    const parsed = ZoneFormSchema.parse(values);
    const body = {
      names: parsed.names,
      ...(parsed.slug ? { slug: parsed.slug } : {}),
      departmentCode: parsed.departmentCode,
      municipalityCode: parsed.municipalityCode,
      center: { lat: parsed.lat, lng: parsed.lng },
      radiusMeters: Math.round(parsed.radiusKm * 1000),
      active: parsed.active,
    };
    try {
      if (zone) await api(`/v1/admin/zones/${zone.id}`, { method: 'PATCH', body });
      else await api('/v1/admin/zones', { method: 'POST', body });
      await queryClient.invalidateQueries({ queryKey: ADMIN_ZONES_KEY });
      toast.success(t('adminCatalog.saved'));
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'ZONE_SLUG_TAKEN') {
        form.setError('slug', { type: 'server', message: 'validation.slugTaken' }, { shouldFocus: true });
        return;
      }
      if (error instanceof ApiError && error.issues.length) {
        for (const issue of error.issues) {
          const field = API_PATHS[issue.path];
          if (field) form.setError(field, { type: 'server', message: issue.message });
        }
        return;
      }
      toast.error(errors.api(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold uppercase italic">
            {zone ? t('adminCatalog.editZone') : t('adminCatalog.newZone')}
          </DialogTitle>
          <DialogDescription>{t('adminCatalog.zoneHint')}</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submit} className="grid gap-6">
          <FieldSet>
            <FieldLegend className="font-semibold">{t('adminCatalog.names')}</FieldLegend>
            <div className="grid gap-4 sm:grid-cols-3">
              {LOCALES.map((locale) => (
                <TextField
                  key={locale}
                  control={form.control}
                  name={`names.${locale}`}
                  label={`${t(`spokenLanguages.${locale}`)}${locale === 'es' ? '' : ` (${t('common.optional')})`}`}
                />
              ))}
            </div>
          </FieldSet>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="slug" label={t('adminCatalog.zoneSlug')} description={t('adminCatalog.zoneSlugHint')} spellCheck={false} />
            <Controller
              control={form.control}
              name="departmentCode"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="zone-department">{t('host.department')}</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="zone-department" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOMBIA_DEPARTMENTS.map((department) => (
                        <SelectItem key={department.code} value={department.code}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.field(fieldState.error?.message)}</FieldError>
                </Field>
              )}
            />
          </div>
          <Controller
            control={form.control}
            name="municipalityCode"
            render={({ field, fieldState }) => (
              <MunicipalityCombobox
                label={`${t('adminCatalog.zoneMunicipality')} (${t('common.optional')})`}
                description={t('adminCatalog.zoneMunicipalityHint')}
                value={field.value}
                onBlur={field.onBlur}
                error={errors.field(fieldState.error?.message)}
                onChange={(code, municipality) => {
                  field.onChange(code);
                  if (!municipality) return;
                  form.setValue('departmentCode', municipality.departmentCode, { shouldValidate: true });
                  form.setValue('lat', String(municipality.lat), { shouldValidate: true });
                  form.setValue('lng', String(municipality.lng), { shouldValidate: true });
                }}
              />
            )}
          />
          <FieldSet>
            <FieldLegend className="font-semibold">{t('adminCatalog.zoneArea')}</FieldLegend>
            <LocationMap
              point={point}
              radiusMeters={radius}
              label={t('adminCatalog.zoneMapLabel')}
              onPick={(picked) => {
                form.setValue('lat', picked.lat.toFixed(6), { shouldValidate: true, shouldDirty: true });
                form.setValue('lng', picked.lng.toFixed(6), { shouldValidate: true, shouldDirty: true });
              }}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField control={form.control} name="lat" label={t('maps.latitude')} inputMode="decimal" />
              <TextField control={form.control} name="lng" label={t('maps.longitude')} inputMode="decimal" />
              <TextField control={form.control} name="radiusKm" label={t('adminCatalog.radiusKm')} inputMode="decimal" />
            </div>
          </FieldSet>
          {zone ? <CheckboxField control={form.control} name="active" label={t('adminCatalog.activeZone')} /> : null}
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Spinner aria-hidden="true" /> : null}
              {t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Zonas (ADM-03): centro y radio, para las páginas por destino (F4) y las alertas de cercanía (F8). */
export function ZonesAdmin({ initial }: { initial: ZoneDto[] }) {
  const t = useTranslations();
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const errors = useErrorText();
  const queryClient = useQueryClient();
  const { data: zones } = useQuery({
    queryKey: ADMIN_ZONES_KEY,
    queryFn: () => api<ZoneDto[]>('/v1/admin/zones'),
    initialData: initial,
    staleTime: 15_000,
  });
  const [editing, setEditing] = useState<ZoneDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ZoneDto | null>(null);
  const name = (zone: ZoneDto) => pickLocalized(zone.names, locale)?.text ?? zone.slug;

  const remove = async () => {
    if (!deleting) return;
    try {
      await api(`/v1/admin/zones/${deleting.id}`, { method: 'DELETE' });
      await queryClient.invalidateQueries({ queryKey: ADMIN_ZONES_KEY });
      toast.success(t('adminCatalog.zoneDeleted'));
    } catch (error) {
      toast.error(errors.api(error));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-muted-foreground">{t('adminCatalog.zonesHint')}</p>
        <Button type="button" onClick={() => setCreating(true)}>
          <Plus weight="bold" aria-hidden="true" />
          {t('adminCatalog.newZone')}
        </Button>
      </div>
      {zones.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
          <MapPinArea size={40} weight="duotone" className="text-secondary" aria-hidden="true" />
          <p className="font-semibold">{t('adminCatalog.noZones')}</p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {zones.map((zone) => (
            <li key={zone.id} className={`flex items-start gap-3 rounded-xl border border-border p-4 ${zone.active ? 'bg-card' : 'bg-muted/50'}`}>
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <CircleDashed size={22} weight="bold" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold [overflow-wrap:anywhere]">{name(zone)}</p>
                <p className="text-sm text-muted-foreground">
                  {departmentName(zone.departmentCode)} · {t('adminCatalog.radiusValue', { km: format.number(zone.radiusMeters / 1000, { maximumFractionDigits: 1 }) })}
                </p>
                <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">/{zone.slug}</p>
                {zone.active ? null : (
                  <span className="mt-2 inline-block rounded-full bg-muted px-2.5 py-1 text-xs font-bold ring-1 ring-border">{t('adminCatalog.inactive')}</span>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button type="button" variant="ghost" size="icon" aria-label={`${t('common.edit')}: ${name(zone)}`} onClick={() => setEditing(zone)}>
                  <PencilSimple size={20} aria-hidden="true" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label={`${t('common.delete')}: ${name(zone)}`} onClick={() => setDeleting(zone)}>
                  <Trash size={20} aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {creating ? <ZoneDialog open onOpenChange={setCreating} /> : null}
      {editing ? <ZoneDialog key={editing.id} zone={editing} open onOpenChange={(open) => !open && setEditing(null)} /> : null}
      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('adminCatalog.deleteZoneTitle', { name: deleting ? name(deleting) : '' })}</AlertDialogTitle>
            <AlertDialogDescription>{t('adminCatalog.deleteZoneBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={() => void remove()}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
