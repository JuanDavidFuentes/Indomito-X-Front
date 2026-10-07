import type { Icon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

/** Bloque de la página de cuenta: ícono, título en Barlow Condensed itálica, ayuda y contenido. */
export function AccountSection({
  id,
  icon: SectionIcon,
  title,
  hint,
  action,
  tone = 'default',
  children,
}: {
  id: string;
  icon: Icon;
  title: string;
  hint?: string;
  action?: ReactNode;
  tone?: 'default' | 'danger';
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`scroll-mt-24 rounded-xl border bg-card p-5 text-card-foreground sm:p-8 ${
        tone === 'danger' ? 'border-destructive/50' : 'border-border'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${
              tone === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            }`}
          >
            <SectionIcon size={22} weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <h2 id={`${id}-title`} className="font-display text-3xl leading-tight font-extrabold uppercase italic">
              {title}
            </h2>
            {hint ? <p className="mt-1 max-w-2xl text-muted-foreground">{hint}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
