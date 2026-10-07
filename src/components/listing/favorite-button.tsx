'use client';

import { Heart } from '@phosphor-icons/react';
import { useState } from 'react';

/**
 * Corazón de favorito sobre la foto (objetivo táctil de 44 px).
 * Por ahora solo marca en pantalla; en F4 se conecta a las listas de favoritos de la API.
 */
export function FavoriteButton({ label }: { label: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={saved}
      onClick={() => setSaved((value) => !value)}
      className="inline-flex size-11 items-center justify-center rounded-full bg-night/45 text-night-foreground backdrop-blur-sm transition-transform duration-150 ease-trail hover:bg-night/60 active:scale-90"
    >
      <Heart
        size={22}
        weight={saved ? 'fill' : 'bold'}
        className={saved ? 'text-brand' : undefined}
        aria-hidden="true"
      />
    </button>
  );
}
