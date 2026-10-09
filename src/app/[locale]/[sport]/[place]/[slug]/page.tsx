import {
  isServiceListing,
  landingWebPath,
  listingWebPath,
  localizedAlternates,
  localizedOr,
  pickLocalized,
  pickVariant,
  shareImageVariant,
  webPath,
  type Locale,
  type PublicListingDetail,
} from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { ListingDetail } from '@/components/listing-detail/listing-detail';
import { routing } from '@/i18n/routing';
import { getListing, getSports, searchListings, WEB_URL } from '@/lib/api/public';

/** Detalle bajo demanda (ISR): se genera la primera vez que se visita y se renueva cada 5 minutos. */
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type Props = PageProps<'/[locale]/[sport]/[place]/[slug]'>;

function descriptionOf(listing: PublicListingDetail, locale: Locale): string | null {
  const text = pickLocalized(listing.description, locale)?.text;
  if (!text) return null;
  return text.length > 158 ? `${text.slice(0, 155).trimEnd()}…` : text;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const listing = await getListing(slug);
  if (!listing) return {};
  const t = await getTranslations({ locale, namespace: 'listingDetail' });
  const title = localizedOr(listing.title, locale, listing.slug);
  const place = listing.municipality?.name ?? 'Colombia';
  const description = descriptionOf(listing, locale) ?? t('metaDescription', { title, place, host: listing.host.name });
  const image = listing.photos[0] ? shareImageVariant(listing.photos[0].variants) : null;
  const languages = localizedAlternates((l) => listingWebPath(listing.path, l));
  return {
    title: `${title} · ${place}`,
    description,
    alternates: { canonical: languages[locale], languages: { ...languages, 'x-default': languages.es } },
    openGraph: {
      title,
      description,
      type: 'website',
      locale,
      url: languages[locale],
      ...(image ? { images: [{ url: image.url, width: image.width, height: image.height, alt: title }] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description, ...(image ? { images: [image.url] } : {}) },
  };
}

/** Datos estructurados (schema.org): `TouristTrip` o `Product`, con su oferta, el Guía y las migas. */
function jsonLd(listing: PublicListingDetail, locale: Locale, sportName: string | null): object[] {
  const url = `${WEB_URL}${listingWebPath(listing.path, locale)}`;
  const title = localizedOr(listing.title, locale, listing.slug);
  const description = pickLocalized(listing.description, locale)?.text;
  const images = listing.photos.map((photo) => pickVariant(photo.variants, 1280)?.url).filter(Boolean);
  const inStock = listing.type === 'PRODUCT' ? listing.variants.some((variant) => variant.inStock) : listing.type === 'RENTAL' || listing.upcoming.length > 0;
  const offer = {
    '@type': 'Offer',
    url,
    price: (listing.priceFromMinor / 100).toFixed(0),
    priceCurrency: 'COP',
    availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
  };
  const provider = {
    '@type': 'TravelAgency',
    name: listing.host.name,
    url: `${WEB_URL}${webPath('/guias/[slug]', locale, { slug: listing.host.slug })}`,
    ...(listing.host.logoUrl ? { logo: listing.host.logoUrl } : {}),
    ...(listing.host.rntNumber ? { identifier: { '@type': 'PropertyValue', propertyID: 'RNT', value: listing.host.rntNumber } } : {}),
  };
  const rating = listing.rating
    ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: listing.rating.average, reviewCount: listing.rating.count, bestRating: 5 } }
    : {};
  const main = isServiceListing(listing.type)
    ? {
        '@context': 'https://schema.org',
        '@type': 'TouristTrip',
        name: title,
        ...(description ? { description } : {}),
        url,
        image: images,
        provider,
        offers: offer,
        ...(listing.meetingPoint
          ? {
              itinerary: {
                '@type': 'Place',
                name: listing.municipality?.name,
                ...(listing.address ? { address: listing.address } : {}),
                geo: { '@type': 'GeoCoordinates', latitude: listing.meetingPoint.lat, longitude: listing.meetingPoint.lng },
              },
            }
          : {}),
        ...rating,
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title,
        ...(description ? { description } : {}),
        url,
        image: images,
        brand: { '@type': 'Brand', name: listing.host.name },
        offers: { ...offer, seller: provider },
        ...rating,
      };
  const crumbs = [
    { name: 'Indómito X', item: `${WEB_URL}/${locale}` },
    ...(sportName ? [{ name: sportName, item: `${WEB_URL}${landingWebPath(listing.path.sportSlugs, locale)}` }] : []),
    ...(sportName && listing.municipality
      ? [{ name: listing.municipality.name, item: `${WEB_URL}${landingWebPath(listing.path.sportSlugs, locale, listing.path.placeSlug)}` }]
      : []),
    { name: title, item: url },
  ];
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })),
  };
  return [main, breadcrumb];
}

/** LIST-05: `/{idioma}/{deporte}/{ciudad}/{slug}`. Otra combinación de deporte o ciudad redirige a la canónica. */
export default async function ListingPage({ params }: Props) {
  const { locale, sport, place, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const listing = await getListing(slug);
  if (!listing) notFound();
  const canonical = listingWebPath(listing.path, locale);
  if (`/${locale}/${sport}/${place}/${slug}` !== canonical) permanentRedirect(canonical);

  const [sports, nearby] = await Promise.all([getSports(), searchListings({ place: listing.path.placeSlug }, 300)]);
  const sportEntry = sports.find((item) => item.key === listing.sportKeys[0]);
  const sportName = sportEntry ? localizedOr(sportEntry.names, locale, sportEntry.key) : null;
  const related = (nearby?.items ?? []).filter((item) => item.id !== listing.id).slice(0, 4);
  const relatedPlace = nearby?.place ? { name: localizedOr(nearby.place.names, locale, nearby.place.slug), slug: nearby.place.slug } : null;

  return (
    <>
      {jsonLd(listing, locale, sportName).map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
      ))}
      <ListingDetail listing={listing} sports={sports} related={related} relatedPlace={relatedPlace} shareUrl={`${WEB_URL}${canonical}`} />
    </>
  );
}
