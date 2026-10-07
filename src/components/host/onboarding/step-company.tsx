'use client';

import {
  COLOMBIA_DEPARTMENTS,
  SPORT_ELEMENTS,
  type HostField,
  type SportElement,
} from '@juandavidfuentes/indomitox-shared';
import { Check, ShieldCheck } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { Controller } from 'react-hook-form';
import { TextField } from '@/components/forms/fields';
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useErrorText } from '@/lib/forms';
import { AutosaveIndicator, LockedNotice } from '../autosave-indicator';
import { useSportName } from '../labels';
import { useDraftForm } from './use-draft-form';
import { useHostEditing, type StepProps } from './use-editing';

const FIELDS = [
  'legalName',
  'tradeName',
  'taxId',
  'rntNumber',
  'contactPhone',
  'contactEmail',
  'address',
  'department',
  'city',
] as const satisfies readonly HostField[];

interface CompanyForm {
  legalName: string;
  tradeName: string;
  taxId: string;
  rntNumber: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  department: string;
  city: string;
}

const DOT: Record<SportElement, string> = {
  WATER: 'bg-tint-water',
  AIR: 'bg-tint-air',
  LAND: 'bg-tint-land',
  UNDERGROUND: 'bg-tint-underground dark:bg-muted-foreground',
  PARK: 'bg-tint-park',
};

/** Paso 2: datos de la empresa (como en el RUT), contacto, ubicación base y actividades. */
export function StepCompany({ mine, sports }: StepProps) {
  const t = useTranslations();
  const errors = useErrorText();
  const sportName = useSportName();
  const departmentId = useId();
  const { can, lockedReason } = useHostEditing(mine);
  const { host } = mine;
  const { form, autosave } = useDraftForm<CompanyForm>(FIELDS, {
    legalName: host.legalName ?? '',
    tradeName: host.tradeName ?? '',
    taxId: host.taxId ?? '',
    rntNumber: host.rntNumber ?? '',
    contactPhone: host.contactPhone ?? '',
    contactEmail: host.contactEmail ?? '',
    address: host.address ?? '',
    department: host.department ?? '',
    city: host.city ?? '',
  });
  const [sportKeys, setSportKeys] = useState<string[]>(host.sportKeys);
  const companyLocked = !can('company');
  const contactLocked = !can('contact');
  const activitiesLocked = !can('activities');
  const lockedNotice = lockedReason('company') ?? lockedReason('contact');

  const toggleSport = (key: string) => {
    const next = sportKeys.includes(key) ? sportKeys.filter((k) => k !== key) : [...sportKeys, key];
    // En el orden del catálogo.
    const ordered = sports.map((sport) => sport.key).filter((k) => next.includes(k));
    setSportKeys(ordered);
    autosave.queue({ sportKeys: ordered }, true);
  };

  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid gap-8">
      <AutosaveIndicator status={autosave.status} />
      {lockedNotice ? <LockedNotice>{lockedNotice}</LockedNotice> : null}

      <FieldGroup>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField control={form.control} name="legalName" label={t('host.legalName')} description={t('host.legalNameHint')} autoComplete="organization" disabled={companyLocked} />
          <TextField control={form.control} name="tradeName" label={t('host.tradeName')} description={t('host.tradeNameHint')} disabled={companyLocked} />
          <TextField control={form.control} name="taxId" label={t('host.taxId')} description={t('host.taxIdHint')} inputMode="numeric" autoComplete="off" disabled={companyLocked} />
          {host.offersTourismServices ? (
            <TextField control={form.control} name="rntNumber" label={t('host.rntNumber')} description={t('host.rntNumberHint')} inputMode="numeric" autoComplete="off" disabled={companyLocked} />
          ) : null}
        </div>
      </FieldGroup>

      <FieldSet>
        <FieldLegend className="font-display text-2xl font-extrabold uppercase italic">{t('host.contactSection')}</FieldLegend>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField control={form.control} name="contactPhone" label={t('host.contactPhone')} type="tel" autoComplete="tel" disabled={contactLocked} />
          <TextField control={form.control} name="contactEmail" label={t('host.contactEmail')} type="email" inputMode="email" autoComplete="email" disabled={contactLocked} />
          <Controller
            control={form.control}
            name="department"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={departmentId}>{t('host.department')}</FieldLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange} disabled={contactLocked}>
                  <SelectTrigger id={departmentId} className="w-full" aria-invalid={fieldState.invalid} onBlur={field.onBlur}>
                    <SelectValue placeholder={t('host.departmentPlaceholder')} />
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
          <TextField control={form.control} name="city" label={t('host.city')} placeholder={t('host.cityPlaceholder')} autoComplete="address-level2" disabled={contactLocked} />
          <div className="md:col-span-2">
            <TextField control={form.control} name="address" label={t('host.address')} autoComplete="street-address" disabled={contactLocked} />
          </div>
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend className="font-display text-2xl font-extrabold uppercase italic">{t('host.activitiesSection')}</FieldLegend>
        <p className="text-muted-foreground">{t('host.activitiesHint')}</p>
        <div className="grid gap-5">
          {SPORT_ELEMENTS.map((element) => {
            const group = sports.filter((sport) => sport.element === element);
            if (group.length === 0) return null;
            return (
              <div key={element}>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  <span className={`size-2.5 rounded-full ${DOT[element]}`} aria-hidden="true" />
                  {t(`elements.${element}`)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.map((sport) => {
                    const checked = sportKeys.includes(sport.key);
                    return (
                      <button
                        key={sport.key}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        disabled={activitiesLocked}
                        onClick={() => toggleSport(sport.key)}
                        className={`inline-flex h-11 items-center gap-2 rounded-full border-2 px-4 font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
                          checked ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {checked ? <Check size={16} weight="bold" aria-hidden="true" /> : null}
                        {sportName(sport.key)}
                        {sport.requiresNts ? (
                          <span className="inline-flex items-center gap-0.5 rounded bg-secondary px-1.5 py-0.5 text-xs font-bold text-secondary-foreground">
                            <ShieldCheck size={12} weight="bold" aria-hidden="true" />
                            {t('host.ntsBadge')}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </FieldSet>
    </form>
  );
}
