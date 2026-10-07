'use client';

import { Heart } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { hasSessionHint } from '@/lib/api/client';
import { useSession } from '@/lib/session';

/**
 * Corazón de favorito sobre la foto (objetivo táctil de 44 px).
 * AUTH-07: sin sesión lleva a ingresar y luego de vuelta a esta página. Con sesión, por ahora
 * solo marca en pantalla; en F4 se conecta a las listas de favoritos de la API.
 */
export function FavoriteButton({ label }: { label: string }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const { data: user } = useSession();
  const [saved, setSaved] = useState(false);

  const onClick = () => {
    if (!user && !hasSessionHint()) {
      const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      router.push({ pathname: '/ingresar', query: { next } });
      return;
    }
    setSaved((value) => !value);
    if (!saved) toast(t('favoritesSoon'));
  };

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={saved}
      onClick={onClick}
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
