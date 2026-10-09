import type { ListingCardDto, SportDto } from '@juandavidfuentes/indomitox-shared';
import { ArrowRight } from '@phosphor-icons/react/ssr';
import { useTranslations } from 'next-intl';
import { ListingCard } from '@/components/listing/listing-card';
import { Link } from '@/i18n/navigation';
import { SectionHeading } from './section-heading';

/** Aventuras destacadas: las recomendadas de la búsqueda (F4). Sin publicaciones, la sección no aparece. */
export function Featured({ items, sports }: { items: ListingCardDto[]; sports: SportDto[] }) {
  const t = useTranslations();
  if (!items.length) return null;

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
        <ul className="mt-10 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((listing) => (
            <li key={listing.id}>
              <ListingCard listing={listing} sports={sports} sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 92vw" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
