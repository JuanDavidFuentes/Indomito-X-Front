import {
  convertMinor,
  DEMO_FEATURED,
  DEMO_FX_RATES,
  formatMoney,
} from '@juandavidfuentes/indomitox-shared';
import { ArrowRight } from '@phosphor-icons/react/ssr';
import { useLocale, useTranslations } from 'next-intl';
import { ListingCard } from '@/components/listing/listing-card';
import { Link } from '@/i18n/navigation';
import { PHOTOS } from '@/lib/photos';
import { SectionHeading } from './section-heading';

/**
 * Aventuras destacadas. EJEMPLO hasta F4: datos de shared (DEMO_FEATURED), siempre con la
 * cinta "Ejemplo" y sin calificaciones inventadas.
 */
export function Featured() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section aria-labelledby="destacadas" className="border-y border-border bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <SectionHeading
          id="destacadas"
          title={t('home.featuredTitle')}
          subtitle={t('home.featuredSubtitle')}
          action={
            <Link
              href="/buscar"
              className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full px-4 font-semibold text-primary transition-colors hover:bg-primary/10 sm:self-auto"
            >
              {t('common.seeAll')}
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </Link>
          }
        />
        <div className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {DEMO_FEATURED.map((listing) => {
            const duration =
              listing.durationMinutes >= 60
                ? t('listing.durationHours', { hours: listing.durationMinutes / 60 })
                : t('listing.durationMinutes', { minutes: listing.durationMinutes });
            const usd = convertMinor(listing.priceFromMinor, 'COP', 'USD', DEMO_FX_RATES);
            return (
              <ListingCard
                key={listing.id}
                href={{ pathname: '/buscar', query: { deporte: listing.sport } }}
                photo={PHOTOS[listing.photo]}
                sport={t(`sports.${listing.sport}`)}
                title={t(`demo.featured.${listing.id}`)}
                meta={`${listing.zone} · ${duration}`}
                difficulty={listing.difficulty}
                priceFrom={formatMoney(listing.priceFromMinor, 'COP', locale)}
                priceApprox={formatMoney(usd, 'USD', locale, { round: true })}
                exampleLabel={t('common.example')}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
