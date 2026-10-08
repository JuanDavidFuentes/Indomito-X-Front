'use client';

import {
  formatMoney,
  pickLocalized,
  textLines,
  type HostListingDto,
  type Locale,
  type LocalizedText,
} from '@juandavidfuentes/indomitox-shared';
import { Check, Clock, MapPin, UsersThree, X } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { DifficultyBadge } from '@/components/listing/difficulty';
import { LocationMap } from '@/components/maps/location-map';
import { useSportName } from '@/lib/catalog';
import { usePriceLabel, useListingTitle } from './listing-labels';
import { ListingPhoto } from './listing-photo';

function LocalizedBlock({ title, text, list = false, negative = false }: { title: string; text: LocalizedText; list?: boolean; negative?: boolean }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const picked = pickLocalized(text, locale);
  if (!picked) return null;
  return (
    <div className="grid content-start gap-2">
      <h3 className="font-display text-xl font-bold uppercase">{title}</h3>
      {picked.locale !== locale ? <p className="text-xs text-muted-foreground">{t(`guide.originalIn.${picked.locale}`)}</p> : null}
      {list ? (
        <ul className="grid gap-1">
          {textLines(picked.text).map((line, index) => (
            <li key={index} className="flex items-start gap-2">
              {negative ? (
                <X size={18} weight="bold" className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              ) : (
                <Check size={18} weight="bold" className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
              )}
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <p className="whitespace-pre-line [overflow-wrap:anywhere]">{picked.text}</p>
      )}
    </div>
  );
}

/**
 * Vista de solo lectura de una publicación (para la moderación): fotos, datos clave, textos,
 * requisitos, punto de encuentro y, en los productos, variantes y envíos.
 */
export function ListingSummary({ listing }: { listing: HostListingDto }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const sportName = useSportName();
  const priceLabel = usePriceLabel();
  const title = useListingTitle()(listing.title);
  const facts = [
    listing.durationMinutes ? t('listings.summary.duration', { hours: Math.round((listing.durationMinutes / 60) * 10) / 10 }) : null,
    listing.durationDays ? t('listings.summary.days', { count: listing.durationDays }) : null,
    listing.sessionsCount ? t('listings.summary.sessions', { count: listing.sessionsCount }) : null,
    listing.minAge !== null ? t('listings.summary.minAge', { age: listing.minAge }) : null,
    listing.minWeightKg || listing.maxWeightKg ? t('listings.summary.weight', { min: listing.minWeightKg ?? '—', max: listing.maxWeightKg ?? '—' }) : null,
    listing.fitnessLevel ? `${t('listings.fields.fitnessLevel')}: ${t(`fitnessLevel.${listing.fitnessLevel}`)}` : null,
    listing.mustSwim ? t('listings.fields.mustSwim') : null,
  ].filter(Boolean);

  return (
    <article className="grid gap-6">
      {listing.photos.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {listing.photos.slice(0, 6).map((photo, index) => (
            <ListingPhoto key={photo.id} photo={photo} sizes="(min-width: 1024px) 18rem, 45vw" className={`rounded-lg ${index === 0 ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-[4/3]'}`} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">{t('listings.summary.noPhotos')}</p>
      )}
      <div className="grid gap-2">
        <p className="font-display text-sm font-bold tracking-[0.12em] text-secondary uppercase">
          {t(`listingType.${listing.type}`)} · {listing.sportKeys.map(sportName).join(', ')}
        </p>
        <h2 className="font-display text-3xl leading-tight font-extrabold uppercase italic [overflow-wrap:anywhere]">{title}</h2>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {listing.difficulty ? <DifficultyBadge level={listing.difficulty} /> : null}
          <span className="font-semibold tabular-nums">{priceLabel(listing.basePriceMinor, listing.priceUnit)}</span>
          {listing.municipality ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <MapPin size={16} aria-hidden="true" />
              {listing.municipality.name}, {listing.municipality.departmentName}
            </span>
          ) : null}
        </p>
        {facts.length ? (
          <ul className="flex flex-wrap gap-2 text-sm">
            {facts.map((fact) => (
              <li key={fact} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                <Clock size={14} aria-hidden="true" />
                {fact}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <LocalizedBlock title={t('listings.fields.description')} text={listing.description} />
      <div className="grid gap-6 md:grid-cols-2">
        <LocalizedBlock title={t('listings.fields.includes')} text={listing.includes} list />
        <LocalizedBlock title={t('listings.fields.excludes')} text={listing.excludes} list negative />
        <LocalizedBlock title={t('listings.fields.whatToBring')} text={listing.whatToBring} list />
        <LocalizedBlock title={t('listings.fields.equipmentIncluded')} text={listing.equipmentIncluded} list />
      </div>
      <LocalizedBlock title={t('listings.fields.medicalRestrictions')} text={listing.medicalRestrictions} />
      <LocalizedBlock title={t('listings.fields.hostDisclaimer')} text={listing.hostDisclaimer} />
      {listing.meetingPoint ? (
        <div className="grid gap-2">
          <h3 className="font-display text-xl font-bold uppercase">{t('listings.fields.meetingPoint')}</h3>
          {listing.address ? <p>{listing.address}</p> : null}
          <LocationMap point={listing.meetingPoint} label={t('listings.fields.meetingPointMap')} className="h-64" zoom={14} />
        </div>
      ) : null}
      {listing.type === 'PRODUCT' ? (
        <div className="grid gap-3">
          <h3 className="font-display text-xl font-bold uppercase">{t('listings.variants.title')}</h3>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {listing.variants.map((variant) => (
              <li key={variant.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                <span className="font-semibold">{[variant.size, variant.color].filter(Boolean).join(' · ') || t('listings.variants.single')}</span>
                <span className="flex items-center gap-3 tabular-nums text-muted-foreground">
                  {variant.priceMinor ? formatMoney(variant.priceMinor, 'COP', locale) : null}
                  <span>{t('listings.stockTotal', { count: variant.stock })}</span>
                  {variant.active ? null : <X size={16} aria-label={t('listings.variants.inactive')} />}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm">
            {[listing.pickupAvailable ? t('listings.shipping.pickup') : null, ...listing.shippingOptions.map((option) => `${option.name}: ${formatMoney(option.priceMinor, 'COP', locale)}`)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      ) : null}
      {listing.type === 'RENTAL' && listing.rentalUnits ? (
        <p className="inline-flex items-center gap-2 text-sm font-semibold">
          <UsersThree size={18} aria-hidden="true" />
          {t('listings.summary.units', { count: listing.rentalUnits })}
        </p>
      ) : null}
    </article>
  );
}
