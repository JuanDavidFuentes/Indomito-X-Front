'use client';

import {
  DIFFICULTIES,
  DURATION_FILTERS,
  LISTING_TYPES,
  MIN_RATING_OPTIONS,
  SEARCH_LIMITS,
  SEARCH_SORTS,
  SPORT_ELEMENTS,
  canSortByDistance,
  localizedOr,
  todayInPlatform,
  type Locale,
  type SearchQuery,
  type SearchSort,
  type SportDto,
} from '@juandavidfuentes/indomitox-shared';
import { Minus, Plus } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { ToggleChips } from '@/components/forms/toggle-chips';
import { DifficultyShape } from '@/components/listing/difficulty';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/** Los filtros que edita el diálogo (el lugar, el texto y el mapa se cambian en la barra). */
type FilterDraft = Pick<SearchQuery, 'sport' | 'type' | 'date' | 'guests' | 'minPrice' | 'maxPrice' | 'difficulty' | 'duration' | 'minRating' | 'sort'>;

export const EMPTY_FILTERS: FilterDraft = {
  sport: undefined,
  type: undefined,
  date: undefined,
  guests: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  difficulty: undefined,
  duration: undefined,
  minRating: undefined,
  sort: 'RELEVANCE',
};

const selectClass =
  'h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none';
const inputClass = selectClass;

/** Selector del orden (SRCH-04): "Más cerca" solo si hay un punto de referencia. */
export function SortSelect({ query, value, onChange, className = '' }: { query: Partial<SearchQuery>; value: SearchSort; onChange: (sort: SearchSort) => void; className?: string }) {
  const t = useTranslations('search');
  const id = useId();
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor={id} className="shrink-0 text-sm font-semibold text-muted-foreground">
        {t('sort')}
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value as SearchSort)} className={`${selectClass} h-10 min-w-0`}>
        {SEARCH_SORTS.filter((sort) => sort !== 'DISTANCE' || canSortByDistance(query)).map((sort) => (
          <option key={sort} value={sort}>
            {t(`sorts.${sort}`)}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Filtros (SRCH-03): deporte, tipo, fecha, personas, precio, dificultad, duración y calificación.
 * Se editan en un borrador y se aplican con "Ver resultados" (una sola búsqueda y una sola entrada
 * en el historial).
 */
export function FiltersDialog({
  open,
  onOpenChange,
  query,
  sports,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: SearchQuery;
  sports: SportDto[];
  onApply: (filters: FilterDraft) => void;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const ids = { sport: useId(), date: useId(), min: useId(), max: useId(), guests: useId() };
  const pick = (source: Partial<SearchQuery>): FilterDraft => ({
    sport: source.sport,
    type: source.type,
    date: source.date,
    guests: source.guests,
    minPrice: source.minPrice,
    maxPrice: source.maxPrice,
    difficulty: source.difficulty,
    duration: source.duration,
    minRating: source.minRating,
    sort: source.sort ?? 'RELEVANCE',
  });
  const [draft, setDraft] = useState<FilterDraft>(() => pick(query));
  const set = <K extends keyof FilterDraft>(key: K, value: FilterDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const pesos = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits ? Math.min(Number(digits), SEARCH_LIMITS.priceMax) : undefined;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(pick(query));
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-6 pt-6 pb-4">
          <DialogTitle>{t('search.filters')}</DialogTitle>
          <DialogDescription className="sr-only">{t('search.title')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-7 px-6 py-6">
          <div className="grid gap-2">
            <label htmlFor={ids.sport} className="text-sm font-semibold">
              {t('search.sport')}
            </label>
            <select id={ids.sport} value={draft.sport ?? ''} onChange={(event) => set('sport', event.target.value || undefined)} className={selectClass}>
              <option value="">{t('search.anySport')}</option>
              {SPORT_ELEMENTS.map((element) => (
                <optgroup key={element} label={t(`elements.${element}`)}>
                  {sports
                    .filter((sport) => sport.element === element)
                    .map((sport) => (
                      <option key={sport.key} value={sport.key}>
                        {localizedOr(sport.names, locale, sport.key)}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          <ToggleChips
            legend={t('search.type')}
            multiple={false}
            options={[{ value: '', label: t('search.anyType') }, ...LISTING_TYPES.map((type) => ({ value: type, label: t(`listingType.${type}`) }))]}
            value={[draft.type ?? '']}
            onChange={([value]) => set('type', (value || undefined) as FilterDraft['type'])}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor={ids.date} className="text-sm font-semibold">
                {t('search.date')}
              </label>
              <input
                id={ids.date}
                type="date"
                min={todayInPlatform()}
                value={draft.date ?? ''}
                onChange={(event) => set('date', event.target.value || undefined)}
                className={inputClass}
              />
            </div>
            <div className="grid gap-2">
              <span id={ids.guests} className="text-sm font-semibold">
                {t('search.guests')}
              </span>
              <div role="group" aria-labelledby={ids.guests} className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`${t('common.remove')} (${t('search.guests')})`}
                  disabled={!draft.guests}
                  onClick={() => set('guests', draft.guests && draft.guests > 1 ? draft.guests - 1 : undefined)}
                >
                  <Minus aria-hidden="true" />
                </Button>
                <output aria-live="polite" className="min-w-24 text-center font-semibold tabular-nums">
                  {draft.guests ? t('search.guestsValue', { count: draft.guests }) : t('search.any')}
                </output>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`${t('common.add')} (${t('search.guests')})`}
                  disabled={(draft.guests ?? 0) >= SEARCH_LIMITS.guestsMax}
                  onClick={() => set('guests', (draft.guests ?? 0) + 1)}
                >
                  <Plus aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-semibold">{t('search.price')}</legend>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['minPrice', ids.min, t('search.minPrice')],
                  ['maxPrice', ids.max, t('search.maxPrice')],
                ] as const
              ).map(([key, id, label]) => (
                <div key={key} className="grid gap-1">
                  <label htmlFor={id} className="text-sm text-muted-foreground">
                    {label}
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" aria-hidden="true">
                      $
                    </span>
                    <input
                      id={id}
                      inputMode="numeric"
                      autoComplete="off"
                      value={draft[key] === undefined ? '' : new Intl.NumberFormat('es-CO').format(draft[key]!)}
                      onChange={(event) => set(key, pesos(event.target.value))}
                      className={`${inputClass} pl-7 tabular-nums`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <ToggleChips
            legend={t('search.difficulty')}
            options={DIFFICULTIES.map((level) => ({ value: level, label: t(`difficulty.${level}`), extra: <DifficultyShape level={level} className="h-3" /> }))}
            value={draft.difficulty ?? []}
            onChange={(value) => set('difficulty', value.length ? value : undefined)}
          />

          <ToggleChips
            legend={t('search.duration')}
            options={DURATION_FILTERS.map((duration) => ({ value: duration, label: t(`search.durations.${duration}`) }))}
            value={draft.duration ?? []}
            onChange={(value) => set('duration', value.length ? value : undefined)}
          />

          <ToggleChips
            legend={t('search.rating')}
            hint={t('search.ratingSoon')}
            multiple={false}
            options={[{ value: 0, label: t('search.any') }, ...MIN_RATING_OPTIONS.map((rating) => ({ value: rating, label: t('search.ratingValue', { rating }) }))]}
            value={[draft.minRating ?? 0]}
            onChange={([value]) => set('minRating', value ? value : undefined)}
          />

          <div className="lg:hidden">
            <SortSelect query={query} value={draft.sort} onChange={(sort) => set('sort', sort)} />
          </div>
        </div>
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-popover px-6 py-4">
          <Button type="button" variant="ghost" onClick={() => setDraft({ ...EMPTY_FILTERS, sort: draft.sort })}>
            {t('search.clearFilters')}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
          >
            {t('search.showResults')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { FilterDraft };
