'use client';

import type { ListingPhotoDto } from '@juandavidfuentes/indomitox-shared';
import { SquaresFour } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ListingPhoto } from '@/components/listings/listing-photo';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/** Celdas de la cuadrícula de escritorio (4 × 2) según cuántas fotos hay: nunca quedan huecos. */
function tileClass(index: number, count: number): string {
  if (count === 1) return 'col-span-4 row-span-2';
  if (index === 0) return 'col-span-2 row-span-2';
  if (count === 2) return 'col-span-2 row-span-2';
  if (count === 3) return 'col-span-2';
  if (count === 4 && index === 1) return 'col-span-2';
  return '';
}

/**
 * Galería del detalle. En el teléfono, un carrusel con desplazamiento nativo (sin gestos
 * propios); desde 768 px, la portada grande y cuatro fotos. "Ver las N fotos" abre todas en un
 * diálogo, una debajo de otra, con su texto alternativo.
 */
export function ListingGallery({ photos, title }: { photos: ListingPhotoDto[]; title: string }) {
  const t = useTranslations('listingDetail');
  const [open, setOpen] = useState(false);
  if (!photos.length) return null;
  const alt = (index: number) => t('photoAlt', { title, index: index + 1, total: photos.length });

  return (
    <section aria-label={t('photos')} className="relative">
      {/* Teléfono: carrusel */}
      <ul className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:hidden">
        {photos.map((photo, index) => (
          <li key={photo.id} className="w-[86%] shrink-0 snap-center overflow-hidden rounded-xl">
            <ListingPhoto photo={photo} alt={alt(index)} sizes="86vw" priority={index === 0} />
          </li>
        ))}
      </ul>
      {/* Escritorio: portada y cuatro fotos */}
      <div className="hidden h-[min(32rem,52vw)] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:grid">
        {photos.slice(0, 5).map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpen(true)}
            className={`group relative cursor-zoom-in overflow-hidden ${tileClass(index, Math.min(photos.length, 5))}`}
            aria-label={alt(index)}
          >
            <ListingPhoto
              photo={photo}
              sizes={index === 0 ? '(min-width: 1280px) 40rem, 50vw' : '(min-width: 1280px) 20rem, 25vw'}
              priority={index === 0}
              className="size-full transition-transform duration-500 ease-trail group-hover:scale-105"
            />
          </button>
        ))}
      </div>
      {photos.length > 1 ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute right-3 bottom-3 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-background/95 px-4 text-sm font-semibold text-foreground shadow-md transition-colors hover:bg-background max-md:right-1 max-md:bottom-2"
        >
          <SquaresFour size={18} aria-hidden="true" />
          {t('showAllPhotos', { count: photos.length })}
        </button>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[94dvh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="sr-only">{t('photos')}</DialogDescription>
          </DialogHeader>
          <ul className="grid gap-3">
            {photos.map((photo, index) => (
              <li key={photo.id} className="overflow-hidden rounded-xl">
                <ListingPhoto photo={photo} alt={alt(index)} sizes="(min-width: 896px) 54rem, 94vw" className="aspect-[3/2]" />
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  );
}
