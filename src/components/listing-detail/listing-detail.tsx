import {
  isServiceListing,
  localizedOr,
  mapsUrl,
  pickLocalized,
  textLines,
  type ListingCardDto,
  type Locale,
  type LocalizedText,
  type PublicListingDetail,
  type SportDto,
} from '@juandavidfuentes/indomitox-shared';
import {
  Backpack,
  CalendarCheck,
  CaretRight,
  Check,
  Clock,
  Info,
  MapPin,
  NavigationArrow,
  Package,
  SealCheck,
  ShieldCheck,
  Storefront,
  Translate,
  Truck,
  Users,
  Warning,
  X,
  YoutubeLogo,
} from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { LogoMark } from '@/components/brand/logo';
import { TopoPattern } from '@/components/brand/topo-pattern';
import { DifficultyBadge, DifficultyShape } from '@/components/listing/difficulty';
import { FavoriteButton } from '@/components/listing/favorite-button';
import { ListingCard } from '@/components/listing/listing-card';
import { Price } from '@/components/listing/price';
import { LocationMap } from '@/components/maps/location-map';
import { Link } from '@/i18n/navigation';
import { durationText, type Translate as TranslateFn } from '@/lib/listing-format';
import { ListingGallery } from './listing-gallery';
import { ShareButton } from './share-button';
import { UpcomingSlots } from './upcoming-slots';

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24">
      <h2 id={id} className="font-display text-3xl leading-tight font-extrabold uppercase italic sm:text-4xl">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Texto en el idioma del visitante o el original con su aviso (I18N-02). */
function LocalizedBlock({ text, locale, t }: { text: LocalizedText; locale: Locale; t: TranslateFn }) {
  const picked = pickLocalized(text, locale);
  if (!picked) return null;
  return (
    <>
      <p lang={picked.locale} className="max-w-[70ch] text-lg leading-relaxed whitespace-pre-line">
        {picked.text}
      </p>
      {picked.locale !== locale ? (
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Translate size={18} aria-hidden="true" />
          {t(`guide.originalIn.${picked.locale}`)}
        </p>
      ) : null}
    </>
  );
}

function Lines({ text, locale, icon }: { text: LocalizedText; locale: Locale; icon: 'check' | 'x' | 'bag' }) {
  const picked = pickLocalized(text, locale);
  const lines = textLines(picked?.text);
  if (!lines.length) return null;
  const Icon = icon === 'check' ? Check : icon === 'x' ? X : Backpack;
  const color = icon === 'check' ? 'text-success' : icon === 'x' ? 'text-muted-foreground' : 'text-secondary';
  return (
    <ul lang={picked?.locale} className="grid gap-2">
      {lines.map((line) => (
        <li key={line} className="flex items-start gap-2.5">
          <Icon size={20} weight="bold" className={`mt-0.5 shrink-0 ${color}`} aria-hidden="true" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Detalle público de una publicación (LIST-05, LIST-07): galería, datos de campo, qué incluye,
 * requisitos, punto de encuentro, próximas salidas o variantes, políticas y el Guía con su RNT.
 * Las reservas llegan en F5: el botón se muestra deshabilitado con su explicación.
 */
export function ListingDetail({
  listing,
  sports,
  related,
  relatedPlace,
  shareUrl,
}: {
  listing: PublicListingDetail;
  sports: SportDto[];
  related: ListingCardDto[];
  relatedPlace: { name: string; slug: string } | null;
  shareUrl: string;
}) {
  const t = useTranslations();
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const title = localizedOr(listing.title, locale, listing.slug);
  const service = isServiceListing(listing.type);
  const sport = sports.find((item) => item.key === listing.sportKeys[0]);
  const sportName = (key: string) => localizedOr(sports.find((item) => item.key === key)?.names, locale, t.has(`sports.${key}` as never) ? t(`sports.${key}` as never) : key);
  const sportSlug = listing.path.sportSlugs[locale] ?? listing.path.sportSlugs.es ?? '';
  const place = listing.municipality ? `${listing.municipality.name}, ${listing.municipality.departmentName}` : null;
  const tt = t as unknown as TranslateFn;
  const duration = durationText(tt, listing);
  const languages = listing.languages.map((language) => t(`spokenLanguages.${language}`)).join(', ');
  const hasRequirements =
    service && (listing.minAge || listing.minWeightKg || listing.maxWeightKg || listing.fitnessLevel || listing.mustSwim || pickLocalized(listing.medicalRestrictions, locale));

  const facts: { label: string; value: ReactNode; icon: ReactNode }[] = [
    ...(service ? [{ label: t('listingDetail.duration'), value: duration, icon: <Clock size={22} aria-hidden="true" /> }] : []),
    ...(listing.difficulty
      ? [{ label: t('listingDetail.difficulty'), value: t(`difficulty.${listing.difficulty}`), icon: <DifficultyShape level={listing.difficulty} className="h-4" /> }]
      : []),
    ...(languages && service ? [{ label: t('listingDetail.languages'), value: languages, icon: <Translate size={22} aria-hidden="true" /> }] : []),
    ...(place ? [{ label: t('listingDetail.location'), value: place, icon: <MapPin size={22} aria-hidden="true" /> }] : []),
    ...(listing.type === 'RENTAL' && listing.rentalUnits
      ? [{ label: t('listingType.RENTAL'), value: t('listingDetail.rentalUnits', { count: listing.rentalUnits }), icon: <Package size={22} aria-hidden="true" /> }]
      : []),
    ...(listing.minAge ? [{ label: t('listingDetail.requirements'), value: t('listingDetail.minAge', { age: listing.minAge }), icon: <Users size={22} aria-hidden="true" /> }] : []),
  ];

  return (
    <article className="pb-28 lg:pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav aria-label={t('listingDetail.breadcrumbs')}>
          <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="inline-flex min-h-6 items-center hover:text-foreground hover:underline">
                {t('listingDetail.home')}
              </Link>
            </li>
            {sport ? (
              <li className="inline-flex items-center gap-1">
                <CaretRight size={12} aria-hidden="true" />
                <Link href={{ pathname: '/[sport]', params: { sport: sportSlug } }} className="inline-flex min-h-6 items-center hover:text-foreground hover:underline">
                  {sportName(sport.key)}
                </Link>
              </li>
            ) : null}
            {sport && listing.municipality ? (
              <li className="inline-flex items-center gap-1">
                <CaretRight size={12} aria-hidden="true" />
                <Link
                  href={{ pathname: '/[sport]/[place]', params: { sport: sportSlug, place: listing.path.placeSlug } }}
                  className="inline-flex min-h-6 items-center hover:text-foreground hover:underline"
                >
                  {listing.municipality.name}
                </Link>
              </li>
            ) : null}
            <li className="inline-flex min-w-0 items-center gap-1">
              <CaretRight size={12} aria-hidden="true" />
              <span aria-current="page" className="truncate text-foreground">
                {title}
              </span>
            </li>
          </ol>
        </nav>

        <header className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="flex flex-wrap gap-x-3 font-display text-sm font-bold tracking-[0.14em] text-secondary uppercase">
              {listing.sportKeys.map((key) => (
                <span key={key}>{sportName(key)}</span>
              ))}
              <span className="text-muted-foreground">{t(`listingType.${listing.type}`)}</span>
            </p>
            <h1 className="mt-2 max-w-4xl font-display text-4xl leading-[0.95] font-extrabold uppercase italic [overflow-wrap:anywhere] sm:text-6xl">{title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-muted-foreground">
              {place ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={18} weight="fill" className="text-brand" aria-hidden="true" />
                  {place}
                </span>
              ) : null}
              {listing.difficulty ? <DifficultyBadge level={listing.difficulty} /> : null}
              {service ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={18} aria-hidden="true" />
                  {duration}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <ShareButton title={title} url={shareUrl} />
            <FavoriteButton listingId={listing.id} title={title} variant="button" />
          </div>
        </header>

        <div className="mt-6">
          <ListingGallery photos={listing.photos} title={title} />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="grid min-w-0 content-start gap-14">
            <Section id="sobre" title={service ? t('listingDetail.about') : t('listingDetail.aboutProduct')}>
              <LocalizedBlock text={listing.description} locale={locale} t={tt} />
            </Section>

            {facts.length ? (
              <section aria-labelledby="datos" className="relative overflow-hidden rounded-2xl bg-night p-6 text-night-foreground dark:border dark:border-border sm:p-8">
                <TopoPattern variant="band" className="absolute inset-0 size-full text-brand/25" />
                <h2 id="datos" className="relative font-display text-sm font-bold tracking-[0.2em] uppercase">
                  {t('listingDetail.facts')}
                </h2>
                <dl className="relative mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  {facts.map((fact) => (
                    <div key={fact.label} className="relative pl-9">
                      <dt className="font-display text-xs font-bold tracking-[0.16em] text-night-foreground/75 uppercase">
                        <span className="absolute top-1 left-0 text-brand">{fact.icon}</span>
                        {fact.label}
                      </dt>
                      <dd className="mt-0.5 text-lg font-semibold">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {pickLocalized(listing.includes, locale) || pickLocalized(listing.excludes, locale) ? (
              <div className="grid gap-10 sm:grid-cols-2">
                {pickLocalized(listing.includes, locale) ? (
                  <Section id="incluye" title={t('listingDetail.includes')}>
                    <Lines text={listing.includes} locale={locale} icon="check" />
                  </Section>
                ) : null}
                {pickLocalized(listing.excludes, locale) ? (
                  <Section id="no-incluye" title={t('listingDetail.excludes')}>
                    <Lines text={listing.excludes} locale={locale} icon="x" />
                  </Section>
                ) : null}
              </div>
            ) : null}

            {pickLocalized(listing.whatToBring, locale) || pickLocalized(listing.equipmentIncluded, locale) ? (
              <div className="grid gap-10 sm:grid-cols-2">
                {pickLocalized(listing.whatToBring, locale) ? (
                  <Section id="que-llevar" title={t('listingDetail.whatToBring')}>
                    <Lines text={listing.whatToBring} locale={locale} icon="bag" />
                  </Section>
                ) : null}
                {pickLocalized(listing.equipmentIncluded, locale) ? (
                  <Section id="equipo" title={t('listingDetail.equipmentIncluded')}>
                    <Lines text={listing.equipmentIncluded} locale={locale} icon="check" />
                  </Section>
                ) : null}
              </div>
            ) : null}

            {hasRequirements ? (
              <Section id="requisitos" title={t('listingDetail.requirements')}>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {listing.minAge ? <Requirement icon={<Users size={20} aria-hidden="true" />}>{t('listingDetail.minAge', { age: listing.minAge })}</Requirement> : null}
                  {listing.minWeightKg && listing.maxWeightKg ? (
                    <Requirement icon={<Info size={20} aria-hidden="true" />}>{t('listingDetail.weightRange', { min: listing.minWeightKg, max: listing.maxWeightKg })}</Requirement>
                  ) : listing.minWeightKg ? (
                    <Requirement icon={<Info size={20} aria-hidden="true" />}>{t('listingDetail.weightMin', { min: listing.minWeightKg })}</Requirement>
                  ) : listing.maxWeightKg ? (
                    <Requirement icon={<Info size={20} aria-hidden="true" />}>{t('listingDetail.weightMax', { max: listing.maxWeightKg })}</Requirement>
                  ) : null}
                  {listing.fitnessLevel ? (
                    <Requirement icon={<Info size={20} aria-hidden="true" />}>{t('listingDetail.fitness', { level: t(`fitnessLevel.${listing.fitnessLevel}`) })}</Requirement>
                  ) : null}
                  <Requirement icon={<Info size={20} aria-hidden="true" />}>{listing.mustSwim ? t('listingDetail.mustSwim') : t('listingDetail.noSwim')}</Requirement>
                </ul>
                {pickLocalized(listing.medicalRestrictions, locale) ? (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
                    <Warning size={22} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
                    <div>
                      <p className="font-semibold">{t('listingDetail.medical')}</p>
                      <p lang={pickLocalized(listing.medicalRestrictions, locale)!.locale} className="mt-1">
                        {pickLocalized(listing.medicalRestrictions, locale)!.text}
                      </p>
                    </div>
                  </div>
                ) : null}
              </Section>
            ) : null}

            {listing.meetingPoint ? (
              <Section id="punto" title={service ? t('listingDetail.meetingPoint') : t('listingDetail.pickupPoint')}>
                <LocationMap point={listing.meetingPoint} label={t('listingDetail.meetingMap')} className="h-72" zoom={14} />
                <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    {listing.address ? <p className="font-semibold [overflow-wrap:anywhere]">{listing.address}</p> : null}
                    {pickLocalized(listing.meetingNotes, locale) ? (
                      <p lang={pickLocalized(listing.meetingNotes, locale)!.locale} className="mt-1 text-muted-foreground">
                        {pickLocalized(listing.meetingNotes, locale)!.text}
                      </p>
                    ) : null}
                  </div>
                  <a
                    href={mapsUrl(listing.meetingPoint)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    <NavigationArrow size={18} aria-hidden="true" />
                    {t('listingDetail.openInMaps')}
                  </a>
                </div>
              </Section>
            ) : null}

            {listing.type === 'EXPERIENCE' || listing.type === 'COURSE' || listing.type === 'PACKAGE' ? (
              <Section id="salidas" title={t('listingDetail.upcoming')}>
                <p className="mb-4 text-muted-foreground">{t('listingDetail.upcomingHint')}</p>
                <UpcomingSlots slots={listing.upcoming} />
              </Section>
            ) : null}

            {listing.type === 'RENTAL' && listing.openingHours.length ? (
              <Section id="horario" title={t('listingDetail.openingHours')}>
                <ul className="grid gap-2">
                  {listing.openingHours.map((hours) => (
                    <li key={`${hours.weekdays.join()}-${hours.opensAt}`} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold">{hours.weekdays.map((day) => t(`weekdaysShort.${day}` as never)).join(', ')}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {hours.opensAt} – {hours.closesAt}
                      </span>
                    </li>
                  ))}
                </ul>
                {listing.rentalMinDuration && listing.rentalMaxDuration ? (
                  <p className="mt-3 text-muted-foreground">
                    {listing.priceUnit === 'PER_UNIT_HOUR'
                      ? t('listingDetail.rentalHours', { min: listing.rentalMinDuration, max: listing.rentalMaxDuration })
                      : t('listingDetail.rentalDays', { min: listing.rentalMinDuration, max: listing.rentalMaxDuration })}
                  </p>
                ) : null}
              </Section>
            ) : null}

            {listing.type === 'PRODUCT' && listing.variants.length ? (
              <Section id="variantes" title={t('listingDetail.variants')}>
                <ul className="flex flex-wrap gap-2">
                  {listing.variants.map((variant) => (
                    <li
                      key={variant.id}
                      className={`inline-flex min-h-11 flex-col justify-center rounded-xl border-2 px-4 py-1.5 ${variant.inStock ? 'border-border' : 'border-dashed border-border text-muted-foreground'}`}
                    >
                      <span className="font-semibold">{[variant.size, variant.color].filter(Boolean).join(' · ')}</span>
                      <span className="text-sm tabular-nums">
                        {format.number(variant.priceMinor / 100, { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                        {!variant.inStock ? ` · ${t('listingDetail.outOfStock')}` : variant.lowStock ? ` · ${t('listingDetail.lowStock', { count: variant.lowStock })}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {listing.type === 'PRODUCT' ? (
              <Section id="entrega" title={t('listingDetail.delivery')}>
                <ul className="grid gap-3">
                  {listing.pickupAvailable ? (
                    <li className="flex items-start gap-3">
                      <Storefront size={22} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
                      {t('listingDetail.pickup')}
                    </li>
                  ) : null}
                  {listing.shippingOptions.map((option) => (
                    <li key={option.id} className="flex items-start gap-3">
                      <Truck size={22} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
                      <span>
                        <span className="font-semibold">{option.name}</span>
                        {' · '}
                        {option.priceMinor === 0
                          ? t('listingDetail.freeShipping')
                          : format.number(option.priceMinor / 100, { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                        <span className="block text-sm text-muted-foreground">
                          {option.minDays === option.maxDays
                            ? t('listingDetail.shippingDaysExact', { days: option.minDays })
                            : t('listingDetail.shippingDaysRange', { min: option.minDays, max: option.maxDays })}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            <div className="grid gap-10 sm:grid-cols-2">
              <Section id="politica" title={t('listingDetail.policy')}>
                <p className="font-semibold">{t(`cancellationPolicy.${listing.cancellationPolicy}`)}</p>
                <p className="mt-1 text-muted-foreground">{t(`cancellationPolicyHint.${listing.cancellationPolicy}`)}</p>
              </Section>
              <Section id="pago" title={t('listingDetail.payment')}>
                <ul className="grid gap-3">
                  {listing.paymentModes.map((mode) => (
                    <li key={mode}>
                      <p className="font-semibold">{t(`paymentMode.${mode}`)}</p>
                      <p className="text-muted-foreground">{t(`listingDetail.paymentHint.${mode}`)}</p>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>

            {pickLocalized(listing.hostDisclaimer, locale) ? (
              <Section id="recomendaciones" title={t('listingDetail.disclaimer')}>
                <LocalizedBlock text={listing.hostDisclaimer} locale={locale} t={tt} />
              </Section>
            ) : null}

            {listing.videoUrl ? (
              <a href={listing.videoUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">
                <YoutubeLogo size={22} aria-hidden="true" />
                {t('listingDetail.watchVideo')}
              </a>
            ) : null}

            <Section id="guia" title={t('listingDetail.host')}>
              <HostCard listing={listing} />
            </Section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 grid gap-4">
              <PriceBox listing={listing} />
            </div>
          </aside>
        </div>

        {related.length && relatedPlace ? (
          <section aria-labelledby="relacionadas" className="mt-20 border-t border-border pt-12">
            <h2 id="relacionadas" className="font-display text-4xl leading-[0.95] font-extrabold uppercase italic">
              {t('listingDetail.moreIn', { place: relatedPlace.name })}
            </h2>
            <ul className="mt-8 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.id}>
                  <ListingCard listing={item} sports={sports} sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 92vw" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {/* Teléfono: barra inferior con el precio */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{t('listingDetail.priceFrom')}</p>
            <p className="truncate text-lg">
              <Price amountMinor={listing.priceFromMinor} />
            </p>
            <p className="text-xs text-muted-foreground">{t(`priceUnit.${listing.priceUnit}`)}</p>
          </div>
          <button
            type="button"
            disabled
            aria-describedby="reserva-pronto"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground opacity-60"
          >
            <CalendarCheck size={20} weight="bold" aria-hidden="true" />
            {t('listingDetail.book')}
          </button>
        </div>
        <p id="reserva-pronto" className="mx-auto mt-1 max-w-7xl text-xs text-muted-foreground">
          {t('common.comingSoon')}
        </p>
      </div>
    </article>
  );
}

function Requirement({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <span className="mt-0.5 text-secondary">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function PriceBox({ listing }: { listing: PublicListingDetail }) {
  const t = useTranslations();
  return (
    <section aria-labelledby="precio" className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-lg shadow-night/5 dark:shadow-none">
      <div>
        <p id="precio" className="text-sm font-semibold text-muted-foreground">
          {t('listingDetail.priceFrom')}
        </p>
        <p className="mt-1 text-3xl">
          <Price amountMinor={listing.priceFromMinor} approxClassName="block text-base text-muted-foreground" />
        </p>
        <p className="mt-1 text-muted-foreground">{t(`priceUnit.${listing.priceUnit}`)}</p>
      </div>
      <div>
        <button
          type="button"
          disabled
          aria-describedby="reserva-pronto-caja"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground opacity-60"
        >
          <CalendarCheck size={20} weight="bold" aria-hidden="true" />
          {t('listingDetail.book')}
        </button>
        <p id="reserva-pronto-caja" className="mt-2 text-sm text-muted-foreground">
          {t('listingDetail.bookSoon')}
        </p>
      </div>
      <p className="flex items-start gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        {t('listingDetail.chargedInCop')}
      </p>
    </section>
  );
}

/** El Guía con su RNT (LIST-07: visible en los servicios turísticos). */
function HostCard({ listing }: { listing: PublicListingDetail }) {
  const t = useTranslations();
  const format = useFormatter();
  const host = listing.host;
  return (
    <div className="grid gap-5 rounded-2xl border border-border bg-card p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
      <div className="relative size-20 overflow-hidden rounded-full bg-night">
        {host.logoUrl ? <Image src={host.logoUrl} alt="" fill sizes="5rem" className="object-cover" /> : <LogoMark className="size-full p-4" />}
      </div>
      <div className="min-w-0">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
          <SealCheck size={18} weight="fill" aria-hidden="true" />
          {t('guide.verified')}
        </p>
        <p className="mt-1 font-display text-3xl leading-tight font-extrabold uppercase italic [overflow-wrap:anywhere]">{host.name}</p>
        <p className="mt-1 text-muted-foreground">
          {[host.municipalityName, host.verifiedSince ? t('guide.verifiedSince', { date: format.dateTime(new Date(host.verifiedSince), { month: 'long', year: 'numeric' }) }) : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {host.rntNumber ? (
          <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-lg border-2 border-secondary/50 px-3 py-2">
            <ShieldCheck size={22} weight="duotone" className="text-secondary" aria-hidden="true" />
            <span className="font-display text-xl font-extrabold tracking-wide tabular-nums">{t('guide.rnt', { number: host.rntNumber })}</span>
            <span className="text-sm text-muted-foreground">{t('listingDetail.rntNotice')}</span>
          </p>
        ) : null}
        <div className="mt-4">
          <Link
            href={{ pathname: '/guias/[slug]', params: { slug: host.slug } }}
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
          >
            {t('listingDetail.viewHost')}
            <CaretRight size={16} weight="bold" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
