import type { ReactNode } from 'react';

/** Título de sección en Barlow Condensed 800 itálica, con subtítulo y una acción opcional a la derecha. */
export function SectionHeading({
  title,
  subtitle,
  action,
  id,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h2 id={id} className="font-display text-4xl leading-[0.95] font-extrabold uppercase italic sm:text-5xl">
          {title}
        </h2>
        {subtitle ? <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
