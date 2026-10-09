'use client';

import { localizedOr, type Locale, type SportDto } from '@juandavidfuentes/indomitox-shared';
import { X } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { DifficultyBadge } from '@/components/listing/difficulty';
import { Price } from '@/components/listing/price';
import { ListingPhoto } from '@/components/listings/listing-photo';
import { Spinner } from '@/components/ui/spinner';
import { Link } from '@/i18n/navigation';
import { useSportName } from '@/lib/catalog';
import { durationText, type Translate } from '@/lib/listing-format';
import { useListingCard } from '@/lib/search';

/** Tarjeta resumen del pin seleccionado (MASTER §7: "debajo aparece una tarjeta resumen"). */
export function MapPreview({ id, sports, onClose }: { id: string | null; sports: SportDto[]; onClose: () => void }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const sportName = useSportName(sports);
  const card = useListingCard(id);
  if (!id) return null;
  const listing = card.data;

  return (
    <div className="absolute inset-x-3 bottom-20 z-10 mx-auto max-w-md animate-rise lg:bottom-4">
      <article className="relative flex gap-3 overflow-hidden rounded-xl border border-border bg-card p-2 pr-12 text-card-foreground shadow-2xl">
        {!listing ? (
          <p role="status" className="flex min-h-24 items-center gap-2 px-3 text-sm text-muted-foreground">
            <Spinner aria-hidden="true" />
            {t('common.loading')}
          </p>
        ) : (
          <>
            <div className="w-28 shrink-0 overflow-hidden rounded-lg sm:w-32">
              <ListingPhoto photo={listing.cover} sizes="8rem" className="aspect-square" />
            </div>
            <div className="grid min-w-0 content-center gap-1 py-1">
              <p className="font-display text-xs font-bold tracking-[0.14em] text-secondary uppercase">
                {listing.sportKeys[0] ? sportName(listing.sportKeys[0]) : t(`listingType.${listing.type}`)}
              </p>
              <h2 className="line-clamp-2 font-display text-lg leading-tight font-bold uppercase">
                <Link
                  href={{
                    pathname: '/[sport]/[place]/[slug]',
                    params: { sport: listing.path.sportSlugs[locale] ?? listing.path.sportSlugs.es ?? '', place: listing.path.placeSlug, slug: listing.path.slug },
                  }}
                  className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring"
                >
                  {localizedOr(listing.title, locale, listing.slug)}
                </Link>
              </h2>
              <p className="truncate text-sm text-muted-foreground">{[listing.municipality?.name, durationText(t as Translate, listing)].filter(Boolean).join(' · ')}</p>
              <p className="text-sm">
                <Price amountMinor={listing.priceFromMinor} from />
              </p>
              {listing.difficulty ? (
                <div className="mt-1">
                  <DifficultyBadge level={listing.difficulty} />
                </div>
              ) : null}
            </div>
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('search.closePreview')}
          className="absolute top-1 right-1 z-10 inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={18} weight="bold" aria-hidden="true" />
        </button>
      </article>
    </div>
  );
}
