'use client';

import { pickVariant, type ListingPhotoDto } from '@juandavidfuentes/indomitox-shared';
import { ImageBroken, Image as ImageIcon } from '@phosphor-icons/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';

/**
 * Foto de una publicación desde sus variantes (WebP del bucket público; el optimizador de Next la
 * sirve en AVIF o WebP según el navegador). Mientras la API la procesa muestra la miniatura
 * difusa o un aviso; si falló, un aviso para cambiarla. Siempre con la proporción reservada (CLS).
 */
export function ListingPhoto({
  photo,
  sizes,
  alt = '',
  className = 'aspect-[4/3]',
  priority = false,
}: {
  photo: ListingPhotoDto | null;
  sizes: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  const t = useTranslations('listings');
  const variant = photo ? pickVariant(photo.variants, 1920) : null;
  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      {variant ? (
        <Image
          src={variant.url}
          alt={alt}
          fill
          sizes={sizes}
          quality={70}
          preload={priority}
          placeholder={photo?.placeholder ? 'blur' : 'empty'}
          blurDataURL={photo?.placeholder ?? undefined}
          className="object-cover"
        />
      ) : photo?.status === 'PROCESSING' ? (
        <div className="absolute inset-0 grid place-items-center">
          {photo.placeholder ? (
            // eslint-disable-next-line @next/next/no-img-element -- miniatura en data URI mientras llegan las variantes
            <img src={photo.placeholder} alt="" className="absolute inset-0 size-full scale-110 object-cover blur-md" />
          ) : null}
          <span role="status" className="relative inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold shadow-sm">
            <Spinner aria-hidden="true" />
            {t('photoProcessing')}
          </span>
        </div>
      ) : photo?.status === 'FAILED' ? (
        <div className="absolute inset-0 grid place-items-center p-3 text-center">
          <span className="inline-flex flex-col items-center gap-1 text-xs font-semibold text-destructive">
            <ImageBroken size={28} aria-hidden="true" />
            {t('photoFailed')}
          </span>
        </div>
      ) : (
        <ImageIcon size={32} className="absolute inset-0 m-auto text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  );
}
