'use client';

import { GeoPointSchema, SEARCH_LIMITS, searchQueryToParams, todayInPlatform, type SearchQuery } from '@juandavidfuentes/indomitox-shared';
import { CalendarBlank, Crosshair, MagnifyingGlass, Users } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { PlaceSearch } from '@/components/search/place-search';
import { Spinner } from '@/components/ui/spinner';
import { getPathname, useRouter } from '@/i18n/navigation';

/**
 * Buscador del hero (MASTER §7): destino con autocompletado, fecha y personas, más "Cerca de mí"
 * (D6: la ubicación se pide solo al tocarlo). Sin JavaScript, el formulario se envía a /buscar.
 */
export function HeroSearch() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const ids = { date: useId(), guests: useId() };
  const [text, setText] = useState('');
  const [place, setPlace] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('');
  const [locating, setLocating] = useState(false);

  const go = (patch: Partial<SearchQuery>) => {
    const query: Partial<SearchQuery> = {
      ...(date ? { date } : {}),
      ...(guests ? { guests: Number(guests) } : {}),
      ...patch,
    };
    router.push({ pathname: '/buscar', query: searchQueryToParams(query) });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    go(place ? { place } : text.trim() ? { q: text.trim() } : {});
  };

  const nearMe = () => {
    if (!('geolocation' in navigator)) return toast.error(t('search.locationUnavailable'));
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const point = GeoPointSchema.safeParse({ lat: position.coords.latitude, lng: position.coords.longitude });
        if (!point.success) return toast.error(t('search.locationOutside'));
        go({ near: point.data });
      },
      (error) => {
        setLocating(false);
        toast.error(error.code === error.PERMISSION_DENIED ? t('search.locationDenied') : t('search.locationUnavailable'));
      },
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  };

  const cell = 'flex flex-col justify-center gap-0.5 rounded-xl px-3 py-2 transition-colors focus-within:bg-muted';
  return (
    <div className="mt-8 max-w-3xl animate-rise [animation-delay:270ms]">
      <form
        action={getPathname({ href: '/buscar', locale })}
        role="search"
        onSubmit={onSubmit}
        className="grid gap-1 rounded-2xl bg-card p-2 text-card-foreground shadow-2xl shadow-night/50 sm:grid-cols-[1.5fr_1fr_0.8fr_auto]"
      >
        <div className={cell}>
          <PlaceSearch
            label={t('home.searchLabel')}
            placeholder={t('home.searchPlaceholder')}
            onTextChange={(value, slug) => {
              setText(value);
              setPlace(slug);
            }}
            onSubmitText={(value) => go(value ? { q: value } : {})}
          />
        </div>
        <label htmlFor={ids.date} className={`${cell} sm:border-l sm:border-border`}>
          <span className="text-xs font-bold tracking-[0.08em] uppercase">{t('home.searchWhen')}</span>
          <span className="flex items-center gap-2">
            <CalendarBlank size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              id={ids.date}
              name="date"
              type="date"
              min={todayInPlatform()}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-9 w-full min-w-0 bg-transparent text-base text-card-foreground focus-visible:outline-none"
            />
          </span>
        </label>
        <label htmlFor={ids.guests} className={`${cell} sm:border-l sm:border-border`}>
          <span className="text-xs font-bold tracking-[0.08em] uppercase">{t('home.searchGuests')}</span>
          <span className="flex items-center gap-2">
            <Users size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
            <select
              id={ids.guests}
              name="guests"
              value={guests}
              onChange={(event) => setGuests(event.target.value)}
              className="h-9 w-full min-w-0 cursor-pointer bg-transparent text-base text-card-foreground focus-visible:outline-none"
            >
              <option value="">{t('search.any')}</option>
              {Array.from({ length: Math.min(SEARCH_LIMITS.guestsMax, 20) }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {t('search.guestsValue', { count })}
                </option>
              ))}
            </select>
          </span>
        </label>
        <button
          type="submit"
          className="inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
        >
          <MagnifyingGlass size={20} weight="bold" aria-hidden="true" />
          {t('home.searchButton')}
        </button>
      </form>
      <button
        type="button"
        onClick={nearMe}
        disabled={locating}
        className="mt-3 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-night-foreground/30 bg-night-foreground/10 px-4 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-night-foreground/20 disabled:opacity-70"
      >
        {locating ? <Spinner aria-hidden="true" /> : <Crosshair size={18} weight="bold" aria-hidden="true" />}
        {locating ? t('search.locating') : t('home.nearMe')}
      </button>
    </div>
  );
}
