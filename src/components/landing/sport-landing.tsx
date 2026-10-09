import {
  landingWebPath,
  localizedOr,
  sportSlugFor,
  type ListingSearchResponse,
  type Locale,
  type SearchFacetsResponse,
  type SearchPlace,
  type SportDto,
} from '@juandavidfuentes/indomitox-shared';
import { ArrowRight, CaretRight, MapTrifold } from '@phosphor-icons/react/ssr';
import { useLocale, useTranslations } from 'next-intl';
import { TopoPattern } from '@/components/brand/topo-pattern';
import { SportIcon } from '@/components/catalog/sport-icon';
import { ListingCard } from '@/components/listing/listing-card';
import { Link } from '@/i18n/navigation';

/**
 * Página de aterrizaje por deporte o por deporte y lugar (SRCH-06): indexable, con las aventuras,
 * el enlace al mapa y enlaces internos a otros destinos del deporte y a otros deportes del lugar.
 */
export function SportLanding({
  sport,
  sports,
  place,
  results,
  otherPlaces,
  otherSports,
}: {
  sport: SportDto;
  sports: SportDto[];
  place: SearchPlace | null;
  results: ListingSearchResponse | null;
  otherPlaces: SearchFacetsResponse['places'];
  otherSports: SearchFacetsResponse['sports'];
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const sportName = localizedOr(sport.names, locale, sport.key);
  const placeName = place ? localizedOr(place.names, locale, place.slug) : null;
  const total = results?.total ?? 0;
  const items = results?.items ?? [];
  const searchQuery = { sport: sport.key, ...(place ? { place: place.slug } : {}) };

  return (
    <>
      <section className="relative isolate overflow-hidden bg-night text-night-foreground clip-slope-b">
        <TopoPattern variant="hero" className="absolute inset-0 -z-10 size-full text-brand/30" />
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-[calc(3.5vw+3.5rem)] sm:px-6 sm:pt-16 lg:px-8">
          <nav aria-label={t('listingDetail.breadcrumbs')}>
            <ol className="flex flex-wrap items-center gap-1 text-sm text-night-foreground/80">
              <li>
                <Link href="/" className="hover:text-night-foreground hover:underline">
                  {t('listingDetail.home')}
                </Link>
              </li>
              <li className="inline-flex items-center gap-1">
                <CaretRight size={12} aria-hidden="true" />
                {place ? (
                  <Link href={{ pathname: '/[sport]', params: { sport: sportSlugFor(sport.slugs, locale) } }} className="hover:text-night-foreground hover:underline">
                    {sportName}
                  </Link>
                ) : (
                  <span aria-current="page">{sportName}</span>
                )}
              </li>
              {placeName ? (
                <li className="inline-flex items-center gap-1">
                  <CaretRight size={12} aria-hidden="true" />
                  <span aria-current="page">{placeName}</span>
                </li>
              ) : null}
            </ol>
          </nav>
          <p className="tape mt-6 inline-flex items-center gap-2">
            <SportIcon icon={sport.icon} size={16} weight="bold" />
            {t(`elements.${sport.element}`)}
          </p>
          <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.92] font-extrabold uppercase italic sm:text-7xl">
            {placeName ? t('landing.sportPlaceTitle', { sport: sportName, place: placeName }) : t('landing.sportTitle', { sport: sportName })}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-night-foreground/90">
            {placeName ? t('landing.sportPlaceIntro', { sport: sportName, place: placeName }) : t('landing.sportIntro', { sport: sportName })}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              href={{ pathname: '/buscar', query: searchQuery }}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-[filter] hover:brightness-110"
            >
              <MapTrifold size={20} weight="bold" aria-hidden="true" />
              {t('landing.viewOnMap')}
            </Link>
            <p className="font-display text-sm font-bold tracking-[0.16em] uppercase">{t('search.results', { count: total })}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {items.length ? (
          <>
            <ul className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item, index) => (
                <li key={item.id}>
                  <ListingCard listing={item} sports={sports} headingLevel="h2" priority={index < 2} sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 92vw" />
                </li>
              ))}
            </ul>
            {total > items.length ? (
              <Link
                href={{ pathname: '/buscar', query: searchQuery }}
                className="mt-10 inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
              >
                {t('landing.seeAll', { count: total })}
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Link>
            ) : null}
          </>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8">
            <TopoPattern variant="band" className="absolute inset-0 size-full text-primary/10" />
            <div className="relative grid justify-items-start gap-3">
              <h2 className="font-display text-3xl leading-tight font-extrabold uppercase italic">{t('landing.emptyTitle', { sport: sportName })}</h2>
              <p className="max-w-prose text-muted-foreground">{t('landing.emptyBody')}</p>
            </div>
          </div>
        )}

        {otherPlaces.length ? (
          <section aria-labelledby="otros-destinos" className="mt-16">
            <h2 id="otros-destinos" className="font-display text-3xl leading-tight font-extrabold uppercase italic sm:text-4xl">
              {t('landing.otherPlaces', { sport: sportName })}
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {otherPlaces.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={{ pathname: '/[sport]/[place]', params: { sport: sportSlugFor(sport.slugs, locale), place: other.slug } }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-border bg-card px-4 font-semibold transition-colors hover:border-primary/50"
                  >
                    {localizedOr(other.names, locale, other.slug)}
                    <span className="text-sm text-muted-foreground">{other.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {place && otherSports.length ? (
          <section aria-labelledby="otros-deportes" className="mt-14">
            <h2 id="otros-deportes" className="font-display text-3xl leading-tight font-extrabold uppercase italic sm:text-4xl">
              {t('landing.otherSports', { place: placeName ?? '' })}
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {otherSports.map((other) => (
                <li key={other.key}>
                  <Link
                    href={{ pathname: '/[sport]/[place]', params: { sport: sportSlugFor(other.slugs, locale), place: place.slug } }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-border bg-card px-4 font-semibold transition-colors hover:border-primary/50"
                  >
                    {localizedOr(other.names, locale, other.key)}
                    <span className="text-sm text-muted-foreground">{other.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}

/** URL absoluta de la página de aterrizaje en cada idioma (para `hreflang`). */
export function landingAlternates(sport: SportDto, placeSlug: string | null): Record<Locale, string> {
  return {
    es: landingWebPath(sport.slugs, 'es', placeSlug),
    en: landingWebPath(sport.slugs, 'en', placeSlug),
    fr: landingWebPath(sport.slugs, 'fr', placeSlug),
  };
}
