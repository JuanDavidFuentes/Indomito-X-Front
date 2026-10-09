import { HOME_DESTINATIONS, localizedOr, type HomeDestinationId, type Locale, type SearchPlace } from '@juandavidfuentes/indomitox-shared';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { PHOTOS } from '@/lib/photos';
import { SectionHeading } from './section-heading';

/** Posición de cada destino en la cuadrícula tipo bento (escritorio). */
const LAYOUT: Record<HomeDestinationId, string> = {
  chicamocha: 'lg:col-span-2 lg:row-span-2',
  sanGil: 'lg:col-span-1',
  barichara: 'lg:col-span-1',
  curiti: 'lg:col-span-2',
};

/** Destinos de Santander: cada uno es una zona del catálogo con sus aventuras (F4). */
export function Destinations({ places }: { places: SearchPlace[] }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const zones = new Map(places.map((place) => [place.slug, place]));

  return (
    <section id="destinos" aria-labelledby="destinos-titulo" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <SectionHeading
        id="destinos-titulo"
        title={t('home.destinationsTitle')}
        subtitle={t('home.destinationsSubtitle')}
      />
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:h-[36rem] lg:grid-cols-4 lg:grid-rows-2">
        {HOME_DESTINATIONS.map((destination) => {
          const zone = zones.get(destination.zoneSlug);
          return (
          <li key={destination.id} className={LAYOUT[destination.id]}>
            <Link
              href={{ pathname: '/buscar', query: zone ? { place: zone.slug } : { q: destination.name } }}
              className="group relative isolate flex aspect-[4/3] h-full flex-col justify-end overflow-hidden rounded-2xl p-5 text-night-foreground lg:aspect-auto"
            >
              <Image
                src={PHOTOS[destination.photo]}
                alt=""
                fill
                sizes="(min-width: 1024px) 40rem, (min-width: 640px) 50vw, 100vw"
                quality={70}
                placeholder="blur"
                className="-z-20 object-cover transition-transform duration-700 ease-trail group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-b from-night/0 from-25% via-night/45 via-60% to-night/90"
              />
              {zone ? (
                <span className="tape absolute top-4 left-4 text-[0.6875rem]!">{t('home.destinationCount', { count: zone.listingCount })}</span>
              ) : null}
              <h3 className="font-display text-3xl leading-none font-extrabold uppercase italic sm:text-4xl">
                {zone ? localizedOr(zone.names, locale, destination.name) : destination.name}
              </h3>
              <p className="mt-1.5 text-sm font-medium text-night-foreground/90 sm:text-base">
                {t(`home.destinations.${destination.id}`)}
              </p>
            </Link>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
