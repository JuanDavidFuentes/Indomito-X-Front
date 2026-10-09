'use client';

import { LOCALE_TAGS, localizedOr, type ListingCardDto, type Locale, type SportDto } from '@juandavidfuentes/indomitox-shared';
import { Star } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { ListingPhoto } from '@/components/listings/listing-photo';
import { Link } from '@/i18n/navigation';
import { useSportName } from '@/lib/catalog';
import { distanceText, durationText, type Translate } from '@/lib/listing-format';
import { DifficultyBadge } from './difficulty';
import { FavoriteButton } from './favorite-button';
import { Price } from './price';

export interface ListingCardProps {
  listing: ListingCardDto;
  /** Catálogo de deportes (para el nombre del deporte sin esperar al cliente). */
  sports?: SportDto[];
  /** Tamaños de la foto para `next/image`. */
  sizes?: string;
  /** La primera fila de resultados carga la foto sin esperar (LCP). */
  priority?: boolean;
  /** Resalta el pin del mapa al pasar el cursor o enfocar la tarjeta. */
  onActiveChange?: (id: string | null) => void;
  /** Encabezado de la tarjeta (h2 en listas sin sección, h3 dentro de una sección). */
  headingLevel?: 'h2' | 'h3';
}

/** Tarjeta de publicación (MASTER §7): foto 4:3, dificultad, deporte, título, lugar, calificación y precio. */
export function ListingCard({
  listing,
  sports,
  sizes = '(min-width: 1280px) 22rem, (min-width: 640px) 45vw, 92vw',
  priority = false,
  onActiveChange,
  headingLevel: Heading = 'h3',
}: ListingCardProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const sportName = useSportName(sports);
  const title = localizedOr(listing.title, locale, listing.slug);
  const meta = [
    listing.municipality?.name,
    durationText(t as Translate, listing),
    listing.distanceMeters !== null ? distanceText(t as Translate, LOCALE_TAGS[locale], listing.distanceMeters) : null,
  ].filter(Boolean);

  return (
    <article
      className="group relative flex flex-col gap-2"
      onMouseEnter={onActiveChange ? () => onActiveChange(listing.id) : undefined}
      onMouseLeave={onActiveChange ? () => onActiveChange(null) : undefined}
      onFocus={onActiveChange ? () => onActiveChange(listing.id) : undefined}
      onBlur={onActiveChange ? () => onActiveChange(null) : undefined}
    >
      <div className="relative overflow-hidden rounded-lg">
        <div className="transition-transform duration-500 ease-trail group-hover:scale-105">
          <ListingPhoto photo={listing.cover} sizes={sizes} priority={priority} />
        </div>
        {listing.difficulty ? (
          <div className="absolute top-2.5 left-2.5">
            <DifficultyBadge level={listing.difficulty} />
          </div>
        ) : null}
        <div className="absolute top-1.5 right-1.5 z-10">
          <FavoriteButton listingId={listing.id} title={title} />
        </div>
      </div>
      <p className="font-display text-sm font-bold tracking-[0.14em] text-secondary uppercase">
        {listing.sportKeys[0] ? sportName(listing.sportKeys[0]) : t(`listingType.${listing.type}`)}
      </p>
      <Heading className="line-clamp-2 font-display text-xl leading-tight font-bold uppercase">
        <Link
          href={{ pathname: '/[sport]/[place]/[slug]', params: { sport: listing.path.sportSlugs[locale] ?? listing.path.sportSlugs.es ?? '', place: listing.path.placeSlug, slug: listing.path.slug } }}
          className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
        >
          {title}
        </Link>
      </Heading>
      <p className="text-sm text-muted-foreground">{meta.join(' · ')}</p>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p>
          <Price amountMinor={listing.priceFromMinor} from />
        </p>
        {listing.rating ? (
          <p className="inline-flex items-center gap-1 text-sm font-semibold">
            <Star size={16} weight="fill" className="text-accent" aria-hidden="true" />
            <span aria-hidden="true">
              {listing.rating.average} <span className="font-normal text-muted-foreground">({listing.rating.count})</span>
            </span>
            <span className="sr-only">{t('listing.rating', { rating: listing.rating.average, count: listing.rating.count })}</span>
          </p>
        ) : null}
      </div>
    </article>
  );
}
