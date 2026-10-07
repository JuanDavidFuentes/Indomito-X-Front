/**
 * Marca "Cumbre": la X es una persona con los brazos en alto cuyo cuerpo es la montaña;
 * el sol es la cabeza y el corte de la base, el sendero (un hueco real: sirve sobre cualquier fondo).
 * Fuente: shared/design-system/indomito-x/marca/marca.svg. Decorativa: el nombre accesible
 * lo aporta el texto del logotipo o el enlace que la contiene.
 */
export function LogoMark({ className, mono = false }: { className?: string; mono?: boolean }) {
  const body = mono ? 'currentColor' : 'var(--brand)';
  const sun = mono ? 'currentColor' : 'var(--accent)';
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <path d="M2 61 L32 24 L62 61 Z M22 61 L32 49 L42 61 Z" fill={body} fillRule="evenodd" />
      <path
        d="M32 30 L11 8 M32 30 L53 8"
        fill="none"
        stroke={body}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="32" cy="9.5" r="7" fill={sun} />
    </svg>
  );
}

/** Logotipo: marca + "INDÓMITO X" en Barlow Condensed 800 itálica (toma el color del texto). */
export function Logo({ className, markClassName = 'size-8' }: { className?: string; markClassName?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark className={`shrink-0 ${markClassName}`} />
      <span className="font-display text-2xl leading-none font-extrabold tracking-[0.01em] uppercase italic">
        Indómito <span className="text-brand">X</span>
      </span>
    </span>
  );
}
