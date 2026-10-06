import { APP_NAME } from '@juandavidfuentes/indomitox-shared';

/**
 * Marca "X": dos rutas que se cruzan — una de montaña (Lava) y una de río (Río).
 * Decorativa: el nombre accesible lo aporta el texto del logotipo.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <path
        d="M6 26 L13 15 L17 19 L26 6"
        fill="none"
        stroke="var(--brand)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 6 C 12 10, 14 14, 16 16 S 22 23, 26 26"
        fill="none"
        stroke="var(--secondary)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark className="size-8 shrink-0" />
      <span className="font-display text-2xl leading-none font-bold tracking-wide uppercase">
        {APP_NAME}
      </span>
    </span>
  );
}
