'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';

const subscribe = (onChange: () => void) => {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
};
const getScrolled = () => window.scrollY > 24;
const getServerScrolled = () => false;

/**
 * Marco del encabezado fijo. En la portada empieza transparente sobre la foto del hero
 * (texto claro) y se vuelve sólido al bajar; en el resto de páginas siempre es sólido.
 */
export function HeaderFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(subscribe, getScrolled, getServerScrolled);
  const overlay = pathname === '/' && !scrolled;

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color,color] duration-300 ${
        overlay
          ? 'border-transparent bg-transparent text-night-foreground'
          : 'border-border/60 bg-background/85 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/75'
      }`}
    >
      {children}
    </header>
  );
}
