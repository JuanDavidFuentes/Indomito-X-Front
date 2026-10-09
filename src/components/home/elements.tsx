import { ELEMENT_PHOTOS, SPORT_ELEMENTS, type SportElement } from '@juandavidfuentes/indomitox-shared';
import { Flashlight, Lightning, Mountains, Waves, Wind } from '@phosphor-icons/react/ssr';
import type { Icon } from '@phosphor-icons/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { PHOTOS } from '@/lib/photos';
import { SectionHeading } from './section-heading';

const ICONS: Record<SportElement, Icon> = {
  WATER: Waves,
  AIR: Wind,
  LAND: Mountains,
  UNDERGROUND: Flashlight,
  PARK: Lightning,
};

/** Tinte de cada elemento sobre la foto (tokens tint-*, iguales en ambos temas). */
const TINT: Record<SportElement, { fade: string; chip: string }> = {
  WATER: { fade: 'to-tint-water', chip: 'bg-tint-water' },
  AIR: { fade: 'to-tint-air', chip: 'bg-tint-air' },
  LAND: { fade: 'to-tint-land', chip: 'bg-tint-land' },
  UNDERGROUND: { fade: 'to-tint-underground', chip: 'bg-tint-underground' },
  PARK: { fade: 'to-tint-park', chip: 'bg-tint-park' },
};

export function Elements() {
  const t = useTranslations();

  return (
    <section aria-labelledby="elementos" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <SectionHeading id="elementos" title={t('home.elementsTitle')} subtitle={t('home.elementsSubtitle')} />
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {SPORT_ELEMENTS.map((element, index) => {
          const ElementIcon = ICONS[element];
          const isLast = index === SPORT_ELEMENTS.length - 1;
          return (
            <li key={element} className={isLast ? 'col-span-2 lg:col-span-1' : undefined}>
              <Link
                href={{ pathname: '/buscar', query: { element } }}
                className={`group relative isolate flex h-full flex-col justify-end overflow-hidden rounded-2xl p-4 text-night-foreground shadow-sm transition-[transform,box-shadow] duration-300 ease-trail hover:-translate-y-1 hover:shadow-xl sm:p-5 dark:ring-1 dark:ring-border ${
                  isLast ? 'aspect-[16/9] lg:aspect-[3/4]' : 'aspect-[3/4]'
                }`}
              >
                <Image
                  src={PHOTOS[ELEMENT_PHOTOS[element]]}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 15rem, (min-width: 640px) 45vw, 50vw"
                  quality={70}
                  placeholder="blur"
                  className="-z-20 object-cover transition-transform duration-700 ease-trail group-hover:scale-110"
                />
                <div
                  aria-hidden="true"
                  className={`absolute inset-0 -z-10 bg-gradient-to-b from-transparent from-20% ${TINT[element].fade}`}
                />
                <span
                  className={`absolute top-3 left-3 grid size-10 place-items-center rounded-xl ${TINT[element].chip} sm:top-4 sm:left-4`}
                >
                  <ElementIcon size={22} weight="bold" aria-hidden="true" />
                </span>
                <h3 className="font-display text-[1.375rem] leading-none font-extrabold uppercase italic min-[400px]:text-2xl sm:text-3xl">
                  {t(`elements.${element}`)}
                </h3>
                <p className="mt-1.5 text-sm font-medium">{t(`home.elementExamples.${element}`)}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
