'use client';

import {
  activeFilterCount,
  GeoPointSchema,
  localizedOr,
  SEARCH_LIMITS,
  searchQueryToParams,
  toQueryString,
  type ListingSearchResponse,
  type Locale,
  type SearchFacetsResponse,
  type SearchPlace,
  type SearchQuery,
  type SportDto,
} from '@juandavidfuentes/indomitox-shared';
import { ArrowClockwise, Crosshair, FadersHorizontal, ListBullets, MapTrifold, X } from '@phosphor-icons/react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useRef, useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { TopoPattern } from '@/components/brand/topo-pattern';
import { ListingCard } from '@/components/listing/listing-card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api/client';
import { useSportName } from '@/lib/catalog';
import { useSearchPins, useSearchQuery, useSearchResults, useSetSearchQuery } from '@/lib/search';
import { MapPreview } from './map-preview';
import { PlaceSearch } from './place-search';
import { EMPTY_FILTERS, FiltersDialog, SortSelect } from './search-filters';
import { SearchMap } from './search-map';

const desktopQuery = '(min-width: 1024px)';
const subscribeDesktop = (onChange: () => void) => {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};

/** Filtros removibles de la búsqueda, con su etiqueta. */
function useActiveFilters(query: SearchQuery, data: ListingSearchResponse | undefined, sports: SportDto[]) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const sportName = useSportName(sports);
  const money = (pesos: number) => format.number(pesos, { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const chips: { key: string; label: string; clear: Partial<SearchQuery> }[] = [];
  if (query.place) chips.push({ key: 'place', label: data?.place ? localizedOr(data.place.names, locale, query.place) : query.place, clear: { place: undefined } });
  // Si el texto resultó ser un lugar, la ficha muestra el lugar.
  if (query.q) chips.push({ key: 'q', label: data?.place && !query.place ? localizedOr(data.place.names, locale, query.q) : `«${query.q}»`, clear: { q: undefined } });
  if (query.near) chips.push({ key: 'near', label: t('search.nearValue', { km: query.radius ?? SEARCH_LIMITS.radiusKm }), clear: { near: undefined, radius: undefined } });
  if (query.bbox) chips.push({ key: 'bbox', label: t('search.areaValue'), clear: { bbox: undefined } });
  if (query.host) chips.push({ key: 'host', label: t('search.hostValue', { name: data?.items[0]?.host.name ?? query.host }), clear: { host: undefined } });
  if (query.sport) chips.push({ key: 'sport', label: sportName(query.sport), clear: { sport: undefined } });
  if (query.element) chips.push({ key: 'element', label: t(`elements.${query.element}`), clear: { element: undefined } });
  if (query.type) chips.push({ key: 'type', label: t(`listingType.${query.type}`), clear: { type: undefined } });
  if (query.date) chips.push({ key: 'date', label: format.dateTime(new Date(`${query.date}T12:00:00`), { day: 'numeric', month: 'short' }), clear: { date: undefined } });
  if (query.guests) chips.push({ key: 'guests', label: t('search.guestsValue', { count: query.guests }), clear: { guests: undefined } });
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const label =
      query.minPrice !== undefined && query.maxPrice !== undefined
        ? t('search.priceRangeValue', { min: money(query.minPrice), max: money(query.maxPrice) })
        : query.minPrice !== undefined
          ? t('search.priceFromValue', { price: money(query.minPrice) })
          : t('search.priceToValue', { price: money(query.maxPrice!) });
    chips.push({ key: 'price', label, clear: { minPrice: undefined, maxPrice: undefined } });
  }
  if (query.difficulty) chips.push({ key: 'difficulty', label: query.difficulty.map((level) => t(`difficulty.${level}`)).join(', '), clear: { difficulty: undefined } });
  if (query.duration) chips.push({ key: 'duration', label: query.duration.map((duration) => t(`search.durations.${duration}`)).join(', '), clear: { duration: undefined } });
  if (query.minRating) chips.push({ key: 'minRating', label: t('search.ratingValue', { rating: query.minRating }), clear: { minRating: undefined } });
  return chips;
}

/**
 * Búsqueda con lista y mapa (SRCH-01 a SRCH-05). Todo el estado vive en la URL: cada cambio
 * agrega una entrada al historial (atrás vuelve a la búsqueda anterior) y la URL se puede
 * compartir. En escritorio la lista y el mapa van lado a lado; en el teléfono el mapa se abre a
 * pantalla completa.
 */
export function SearchView({ initial, sports }: { initial: { qs: string; data: ListingSearchResponse | null }; sports: SportDto[] }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const query = useSearchQuery();
  const setQuery = useSetSearchQuery();
  const results = useSearchResults(query, initial);
  const pins = useSearchPins(query);
  const sportName = useSportName(sports);
  const data = results.data;
  const chips = useActiveFilters(query, data, sports);
  const isDesktop = useSyncExternalStore(subscribeDesktop, () => window.matchMedia(desktopQuery).matches, () => false);
  const [mobileMap, setMobileMap] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  // El pin seleccionado vale para la búsqueda en la que se eligió (una búsqueda nueva lo suelta).
  const [selection, setSelection] = useState<{ key: string; id: string | null }>({ key: '', id: null });
  const [locating, setLocating] = useState(false);
  const listTop = useRef<HTMLDivElement>(null);
  // Deportes con aventuras en el lugar de la búsqueda (el elegido o el que la API reconoció en el texto).
  const facetPlace = query.place ?? data?.place?.slug ?? '';
  const facets = useQuery({
    queryKey: ['facets', facetPlace],
    queryFn: () => api<SearchFacetsResponse>(`/v1/search/facets${facetPlace ? `?place=${facetPlace}` : ''}`),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });

  const fitKey = toQueryString(searchQueryToParams({ ...query, page: 1, sort: 'RELEVANCE' }));
  const selected = selection.key === fitKey ? selection.id : null;
  const setSelected = (id: string | null) => setSelection({ key: fitKey, id });

  const update = (patch: Partial<SearchQuery>) => setQuery({ ...query, ...patch, page: 1 });
  const placeChange = (patch: Partial<SearchQuery>) => update({ place: undefined, q: undefined, near: undefined, radius: undefined, bbox: undefined, ...patch });

  const nearMe = () => {
    if (!('geolocation' in navigator)) return toast.error(t('search.locationUnavailable'));
    setLocating(true);
    // D6: la ubicación solo se pide cuando el usuario toca el botón.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const point = GeoPointSchema.safeParse({ lat: position.coords.latitude, lng: position.coords.longitude });
        if (!point.success) return toast.error(t('search.locationOutside'));
        placeChange({ near: point.data, sort: 'RELEVANCE' });
      },
      (error) => {
        setLocating(false);
        toast.error(error.code === error.PERMISSION_DENIED ? t('search.locationDenied') : t('search.locationUnavailable'));
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  };

  const goToPage = (page: number) => {
    setQuery({ ...query, page });
    listTop.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };

  const placeName = data?.place ? localizedOr(data.place.names, locale, data.place.slug) : null;
  const heading = placeName
    ? t('search.headingIn', { place: placeName })
    : query.near
      ? t('search.headingNear')
      : query.bbox
        ? t('search.headingArea')
        : query.q
          ? t('search.headingQuery', { query: query.q })
          : t('search.heading');
  const filterCount = activeFilterCount(query);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const showMap = isDesktop || mobileMap;
  const loading = results.isFetching && results.isPlaceholderData;

  const map = showMap ? (
    <SearchMap
      pins={pins.data?.pins ?? []}
      fitKey={fitKey}
      bbox={query.bbox}
      selectedId={selected}
      highlightedId={highlighted}
      onSelect={setSelected}
      onSearchArea={(bbox) => placeChange({ bbox })}
      label={t('search.mapLabel')}
    />
  ) : null;

  return (
    <div className="mx-auto w-full max-w-[110rem]">
      {/* Barra de búsqueda */}
      <div className="border-b border-border bg-background px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-12 min-w-0 flex-[1_1_18rem] items-center rounded-full border border-border bg-card px-4 shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40">
            <PlaceSearch
              key={`${query.place ?? ''}|${query.q ?? ''}`}
              label={t('search.placeLabel')}
              hideLabel
              defaultText={placeName ?? query.q ?? ''}
              defaultPlace={query.place ?? null}
              onSelectPlace={(place) => placeChange({ place: place.slug })}
              onSubmitText={(text) => placeChange(text ? { q: text } : {})}
              onClear={() => placeChange({})}
            />
          </div>
          <Button type="button" variant="outline" onClick={nearMe} disabled={locating} aria-pressed={Boolean(query.near)} className="rounded-full">
            {locating ? <Spinner aria-hidden="true" /> : <Crosshair aria-hidden="true" />}
            {locating ? t('search.locating') : t('search.nearMe')}
          </Button>
          <Button type="button" variant="outline" onClick={() => setFiltersOpen(true)} className="rounded-full">
            <FadersHorizontal aria-hidden="true" />
            {filterCount ? t('search.filtersWithCount', { count: filterCount }) : t('search.filters')}
          </Button>
          <SortSelect query={query} value={query.sort} onChange={(sort) => update({ sort })} className="ml-auto max-lg:hidden" />
        </div>
        {facets.data?.sports.length ? (
          <nav aria-label={t('search.sport')} className="mt-3">
            <ul className="flex flex-wrap gap-2">
              {facets.data.sports.slice(0, 10).map((sport) => {
                const active = query.sport === sport.key;
                return (
                  <li key={sport.key}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => update({ sport: active ? undefined : sport.key })}
                      className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-4 text-sm font-semibold transition-colors duration-150 ${
                        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {sportName(sport.key)}
                      <span className={active ? 'opacity-90' : 'text-muted-foreground'}>{sport.count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
        {chips.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => update(chip.clear)}
                aria-label={t('search.removeFilter', { label: chip.label })}
                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full bg-muted px-3 text-sm font-semibold transition-colors duration-150 hover:bg-muted/70"
              >
                {chip.label}
                <X size={14} weight="bold" aria-hidden="true" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setQuery({ ...EMPTY_FILTERS, page: 1 })}
              className="min-h-9 cursor-pointer px-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t('search.clearFilters')}
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,42%)]">
        {/* Lista */}
        <section ref={listTop} aria-labelledby="resultados" className="scroll-mt-20 px-4 py-6 sm:px-6 lg:px-8" aria-busy={loading}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
            <h1 id="resultados" className="font-display text-4xl leading-[0.95] font-extrabold uppercase italic [overflow-wrap:anywhere] sm:text-5xl">
              {heading}
            </h1>
            <p aria-live="polite" className="font-display text-sm font-bold tracking-[0.14em] text-muted-foreground uppercase">
              {loading ? t('search.loadingResults') : data ? t('search.results', { count: data.total }) : null}
            </p>
          </div>

          {results.isError && !data ? (
            <div role="alert" className="grid justify-items-start gap-3 rounded-2xl border border-border bg-card p-8">
              <p className="text-xl font-semibold">{t('search.errorTitle')}</p>
              <p className="text-muted-foreground">{t('search.errorBody')}</p>
              <Button type="button" variant="outline" onClick={() => results.refetch()}>
                <ArrowClockwise aria-hidden="true" />
                {t('common.retry')}
              </Button>
            </div>
          ) : !data ? (
            <ul className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2" aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => (
                <li key={index} className="grid gap-3">
                  <div className="aspect-[4/3] animate-pulse rounded-lg bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-6 w-4/5 animate-pulse rounded bg-muted" />
                </li>
              ))}
            </ul>
          ) : data.items.length === 0 ? (
            <EmptyResults onClear={() => setQuery({ ...EMPTY_FILTERS, page: 1 })} onPlace={(place) => setQuery({ ...EMPTY_FILTERS, place, page: 1 })} />
          ) : (
            <>
              <ul className={`grid grid-cols-1 gap-x-5 gap-y-10 transition-opacity duration-200 sm:grid-cols-2 ${loading ? 'opacity-60' : ''}`}>
                {data.items.map((item, index) => (
                  <li key={item.id}>
                    <ListingCard
                      listing={item}
                      sports={sports}
                      headingLevel="h2"
                      priority={index < 2}
                      sizes="(min-width: 1536px) 26rem, (min-width: 1024px) 28vw, (min-width: 640px) 45vw, 92vw"
                      onActiveChange={setHighlighted}
                    />
                  </li>
                ))}
              </ul>
              {pages > 1 ? (
                <nav aria-label={t('search.pagination')} className="mt-12 flex items-center justify-between gap-3 border-t border-border pt-6">
                  <Button type="button" variant="outline" disabled={query.page <= 1} onClick={() => goToPage(query.page - 1)}>
                    {t('search.previousPage')}
                  </Button>
                  <p className="text-sm font-semibold text-muted-foreground tabular-nums">{t('search.pageOf', { page: query.page, pages })}</p>
                  <Button type="button" variant="outline" disabled={query.page >= pages} onClick={() => goToPage(query.page + 1)}>
                    {t('search.nextPage')}
                  </Button>
                </nav>
              ) : null}
            </>
          )}
        </section>

        {/* Mapa: al lado en escritorio, a pantalla completa en el teléfono */}
        {isDesktop ? (
          <div className="sticky top-16 h-[calc(100dvh-4rem)] border-l border-border">
            {map}
            <MapPreview id={selected} sports={sports} onClose={() => setSelected(null)} />
            {pins.data?.truncated ? (
              <p className="absolute bottom-3 left-3 rounded-md bg-background/90 px-2 py-1 text-xs">{t('search.mapTruncated', { count: pins.data.pins.length })}</p>
            ) : null}
          </div>
        ) : mobileMap ? (
          <div className="fixed inset-x-0 top-16 bottom-0 z-30 bg-background">
            {map}
            <MapPreview id={selected} sports={sports} onClose={() => setSelected(null)} />
          </div>
        ) : null}
      </div>

      {!isDesktop ? (
        <button
          type="button"
          onClick={() => setMobileMap((value) => !value)}
          className="fixed bottom-5 left-1/2 z-40 inline-flex h-12 -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full bg-night px-6 font-semibold text-night-foreground shadow-xl shadow-night/30 transition-transform duration-150 active:scale-[0.97] dark:ring-1 dark:ring-night-foreground/25"
        >
          {mobileMap ? <ListBullets size={20} weight="bold" aria-hidden="true" /> : <MapTrifold size={20} weight="bold" aria-hidden="true" />}
          {mobileMap ? t('search.showList') : t('search.showMap')}
        </button>
      ) : null}

      <FiltersDialog open={filtersOpen} onOpenChange={setFiltersOpen} query={query} sports={sports} onApply={(filters) => update(filters)} />
    </div>
  );
}

/** Sin resultados: cómo seguir (quitar filtros o probar un destino con aventuras). */
function EmptyResults({ onClear, onPlace }: { onClear: () => void; onPlace: (slug: string) => void }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const places = useQuery({ queryKey: ['places', ''], queryFn: () => api<SearchPlace[]>('/v1/places?limit=8'), staleTime: 5 * 60_000 });
  const withListings = (places.data ?? []).filter((place) => place.listingCount > 0);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8">
      <TopoPattern variant="band" className="absolute inset-0 size-full text-primary/10" />
      <div className="relative grid justify-items-start gap-4">
        <p className="font-display text-3xl leading-tight font-extrabold uppercase italic">{t('search.emptyTitle')}</p>
        <p className="max-w-prose text-muted-foreground">{t('search.emptyBody')}</p>
        <Button type="button" onClick={onClear}>
          {t('search.clearFilters')}
        </Button>
        {withListings.length ? (
          <ul className="flex flex-wrap gap-2">
            {withListings.map((place) => (
              <li key={place.slug}>
                <button
                  type="button"
                  onClick={() => onPlace(place.slug)}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-border bg-background px-4 font-semibold transition-colors hover:border-primary/50"
                >
                  {localizedOr(place.names, locale, place.slug)}
                  <span className="text-sm text-muted-foreground">{place.listingCount}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
