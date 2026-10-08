'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  LOCALES,
  pickLocalized,
  SPORT_ELEMENTS,
  SPORT_ICONS,
  SportElementSchema,
  SportIconSchema,
  SportNamesSchema,
  SportSlugsSchema,
  type AdminSportDto,
  type Locale,
  type SportElement,
  type SportIcon as SportIconName,
} from '@juandavidfuentes/indomitox-shared';
import { PencilSimple, Plus, ShieldCheck } from '@phosphor-icons/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { SportIcon, SPORT_ICON_COMPONENTS } from '@/components/catalog/sport-icon';
import { CheckboxField, TextField } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FieldError, FieldLegend, FieldSet } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { SPORTS_KEY } from '@/lib/catalog';
import { applyApiIssues, useErrorText } from '@/lib/forms';

export const ADMIN_SPORTS_KEY = ['admin', 'sports'] as const;

/** Punto de color de cada elemento (tintes de MASTER §2). */
export const ELEMENT_DOT: Record<SportElement, string> = {
  WATER: 'bg-tint-water',
  AIR: 'bg-tint-air',
  LAND: 'bg-tint-land',
  UNDERGROUND: 'bg-tint-underground dark:bg-muted-foreground',
  PARK: 'bg-tint-park',
};

const blankToUndefined = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value);

/** El formulario: en la edición las direcciones son obligatorias en español; al crear salen del nombre. */
const SportFormSchema = z.object({
  names: SportNamesSchema,
  slugs: z.preprocess(
    (value) => {
      const slugs = value as Record<string, string> | undefined;
      return slugs && Object.values(slugs).some((slug) => slug?.trim())
        ? Object.fromEntries(Object.entries(slugs).map(([locale, slug]) => [locale, blankToUndefined(slug)]))
        : undefined;
    },
    SportSlugsSchema.optional(),
  ),
  element: SportElementSchema,
  icon: SportIconSchema.nullable(),
  requiresNts: z.boolean(),
  active: z.boolean(),
});

interface SportForm {
  names: Record<Locale, string>;
  slugs: Record<Locale, string>;
  element: SportElement;
  icon: SportIconName | null;
  requiresNts: boolean;
  active: boolean;
}

function toForm(sport?: AdminSportDto): SportForm {
  return {
    names: { es: sport?.names.es ?? '', en: sport?.names.en ?? '', fr: sport?.names.fr ?? '' },
    slugs: { es: sport?.slugs.es ?? '', en: sport?.slugs.en ?? '', fr: sport?.slugs.fr ?? '' },
    element: sport?.element ?? 'LAND',
    icon: sport?.icon ?? null,
    requiresNts: sport?.requiresNts ?? false,
    active: sport?.active ?? true,
  };
}

function SportDialog({ sport, open, onOpenChange }: { sport?: AdminSportDto; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations();
  const errors = useErrorText();
  const queryClient = useQueryClient();
  const editing = Boolean(sport);
  const form = useForm<SportForm>({
    resolver: zodResolver(SportFormSchema) as unknown as Resolver<SportForm>,
    defaultValues: toForm(sport),
    mode: 'onTouched',
  });

  const submit = form.handleSubmit(async (values) => {
    const parsed = SportFormSchema.parse(values);
    try {
      if (sport) {
        await api(`/v1/admin/sports/${sport.key}`, { method: 'PATCH', body: parsed });
      } else {
        await api('/v1/admin/sports', {
          method: 'POST',
          body: { names: parsed.names, element: parsed.element, icon: parsed.icon, requiresNts: parsed.requiresNts },
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ADMIN_SPORTS_KEY }),
        queryClient.invalidateQueries({ queryKey: SPORTS_KEY }),
      ]);
      toast.success(t('adminCatalog.saved'));
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'SPORT_SLUG_TAKEN') {
        const locale = (error.details as { locale?: Locale } | undefined)?.locale ?? 'es';
        form.setError(`slugs.${locale}`, { type: 'server', message: 'validation.slugTaken' }, { shouldFocus: true });
        return;
      }
      if (!applyApiIssues(error, form.setError)) toast.error(errors.api(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold uppercase italic">
            {editing ? t('adminCatalog.editSport') : t('adminCatalog.newSport')}
          </DialogTitle>
          <DialogDescription>{editing ? t('adminCatalog.editSportHint', { key: sport!.key }) : t('adminCatalog.newSportHint')}</DialogDescription>
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
          {editing ? (
            <FieldSet>
              <FieldLegend className="font-semibold">{t('adminCatalog.slugs')}</FieldLegend>
              <p className="-mt-2 text-sm text-muted-foreground">{t('adminCatalog.slugsHint')}</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {LOCALES.map((locale) => (
                  <TextField key={locale} control={form.control} name={`slugs.${locale}`} label={t(`spokenLanguages.${locale}`)} spellCheck={false} />
                ))}
              </div>
            </FieldSet>
          ) : null}
          <Controller
            control={form.control}
            name="element"
            render={({ field }) => (
              <FieldSet>
                <FieldLegend className="font-semibold">{t('adminCatalog.element')}</FieldLegend>
                <div role="radiogroup" aria-label={t('adminCatalog.element')} className="flex flex-wrap gap-2">
                  {SPORT_ELEMENTS.map((element) => {
                    const checked = field.value === element;
                    return (
                      <button
                        key={element}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        onClick={() => field.onChange(element)}
                        className={`inline-flex h-11 items-center gap-2 rounded-full border-2 px-4 font-semibold transition-colors duration-150 ${
                          checked ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className={`size-2.5 rounded-full ${ELEMENT_DOT[element]}`} aria-hidden="true" />
                        {t(`elements.${element}`)}
                      </button>
                    );
                  })}
                </div>
              </FieldSet>
            )}
          />
          <Controller
            control={form.control}
            name="icon"
            render={({ field, fieldState }) => (
              <FieldSet>
                <FieldLegend className="font-semibold">{t('adminCatalog.icon')}</FieldLegend>
                <div role="radiogroup" aria-label={t('adminCatalog.icon')} className="grid grid-cols-6 gap-2 sm:grid-cols-10">
                  {SPORT_ICONS.map((name) => {
                    const checked = field.value === name;
                    const IconComponent = SPORT_ICON_COMPONENTS[name];
                    return (
                      <button
                        key={name}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        aria-label={name}
                        title={name}
                        onClick={() => field.onChange(name)}
                        className={`inline-flex aspect-square min-h-11 items-center justify-center rounded-lg border-2 transition-colors duration-150 ${
                          checked ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <IconComponent size={22} weight={checked ? 'bold' : 'regular'} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
                <FieldError>{errors.field(fieldState.error?.message)}</FieldError>
              </FieldSet>
            )}
          />
          <div className="grid gap-3">
            <CheckboxField control={form.control} name="requiresNts" label={t('adminCatalog.requiresNts')} />
            {editing ? <CheckboxField control={form.control} name="active" label={t('adminCatalog.activeSport')} /> : null}
          </div>
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

/** Deportes del catálogo (ADM-03) agrupados por elemento, con cuántos Guías los ofrecen. */
export function SportsAdmin({ initial }: { initial: AdminSportDto[] }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { data: sports } = useQuery({
    queryKey: ADMIN_SPORTS_KEY,
    queryFn: () => api<AdminSportDto[]>('/v1/admin/sports'),
    initialData: initial,
    staleTime: 15_000,
  });
  const [editing, setEditing] = useState<AdminSportDto | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-muted-foreground">{t('adminCatalog.sportsHint')}</p>
        <Button type="button" onClick={() => setCreating(true)}>
          <Plus weight="bold" aria-hidden="true" />
          {t('adminCatalog.newSport')}
        </Button>
      </div>
      {SPORT_ELEMENTS.map((element) => {
        const group = sports.filter((sport) => sport.element === element);
        if (!group.length) return null;
        return (
          <section key={element} aria-labelledby={`element-${element}`}>
            <h3 id={`element-${element}`} className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              <span className={`size-2.5 rounded-full ${ELEMENT_DOT[element]}`} aria-hidden="true" />
              {t(`elements.${element}`)}
            </h3>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {group.map((sport) => {
                const name = pickLocalized(sport.names, locale)?.text ?? sport.key;
                const others = LOCALES.filter((l) => l !== locale && sport.names[l]).map((l) => sport.names[l]);
                return (
                  <li key={sport.key} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${sport.active ? '' : 'bg-muted/50'}`}>
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <SportIcon icon={sport.icon} size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold [overflow-wrap:anywhere]">{name}</p>
                      <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
                        {others.join(' · ')}
                        {others.length ? ' · ' : ''}/{sport.slugs[locale] ?? sport.slugs.es}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {sport.requiresNts ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
                          <ShieldCheck size={14} weight="bold" aria-hidden="true" />
                          {t('host.ntsBadge')}
                        </span>
                      ) : null}
                      {sport.active ? null : (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold ring-1 ring-border">{t('adminCatalog.inactive')}</span>
                      )}
                      <span className="text-sm text-muted-foreground tabular-nums">{t('adminCatalog.hostCount', { count: sport.hostCount })}</span>
                      <Button type="button" variant="ghost" size="icon" aria-label={`${t('common.edit')}: ${name}`} onClick={() => setEditing(sport)}>
                        <PencilSimple size={20} aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {creating ? <SportDialog open onOpenChange={setCreating} /> : null}
      {editing ? <SportDialog key={editing.key} sport={editing} open onOpenChange={(open) => !open && setEditing(null)} /> : null}
    </div>
  );
}
