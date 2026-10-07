import type { Difficulty } from '@juandavidfuentes/indomitox-shared';
import Image, { type StaticImageData } from 'next/image';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';
import { Link } from '@/i18n/navigation';
import { DifficultyBadge } from './difficulty';
import { FavoriteButton } from './favorite-button';

export interface ListingCardProps {
  href: ComponentProps<typeof Link>['href'];
  photo: StaticImageData;
  sport: string;
  title: string;
  /** Zona y duración ya formateadas ("San Gil · 3 h"). */
  meta: string;
  difficulty: Difficulty;
  priceFrom: string;
  priceApprox?: string;
  /** Contenido de ejemplo (portada antes de F4): muestra la cinta "Ejemplo". */
  exampleLabel?: string;
}

/** Tarjeta de publicación (MASTER §7): foto 4:3, dificultad, deporte, título, zona y precio. */
export function ListingCard({
  href,
  photo,
  sport,
  title,
  meta,
  difficulty,
  priceFrom,
  priceApprox,
  exampleLabel,
}: ListingCardProps) {
  const t = useTranslations();
  return (
    <article className="group relative flex flex-col gap-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        <Image
          src={photo}
          alt=""
          fill
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 90vw"
          quality={70}
          placeholder="blur"
          className="object-cover transition-transform duration-500 ease-trail group-hover:scale-105"
        />
        <div className="absolute top-2.5 left-2.5">
          <DifficultyBadge level={difficulty} />
        </div>
        <div className="absolute top-1.5 right-1.5 z-10">
          <FavoriteButton label={`${t('listing.addToFavorites')}: ${title}`} />
        </div>
        {exampleLabel ? (
          <span className="tape absolute bottom-3 left-2.5 text-[0.6875rem]!">{exampleLabel}</span>
        ) : null}
      </div>
      <p className="font-display text-sm font-bold tracking-[0.14em] text-secondary uppercase">{sport}</p>
      <h3 className="line-clamp-2 font-display text-xl leading-tight font-bold uppercase">
        <Link
          href={href}
          className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
        >
          {title}
        </Link>
      </h3>
      <p className="text-sm text-muted-foreground">{meta}</p>
      <p className="tabular-nums">
        <span className="font-semibold">{t('price.from', { price: priceFrom })}</span>
        {priceApprox ? (
          <span className="text-muted-foreground"> {t('price.approx', { price: priceApprox })}</span>
        ) : null}
      </p>
    </article>
  );
}
