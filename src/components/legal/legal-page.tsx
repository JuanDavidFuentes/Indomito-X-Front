import { LEGAL_DOCUMENTS, LOCALE_TAGS, PRIVACY_CONTACT_EMAIL, type ConsentType } from '@juandavidfuentes/indomitox-shared';
import { Scales } from '@phosphor-icons/react/ssr';
import { useLocale, useTranslations } from 'next-intl';
import { TopoPattern } from '@/components/brand/topo-pattern';
import type { routing } from '@/i18n/routing';

const SECTIONS = [1, 2, 3, 4, 5, 6, 7] as const;
const NAMESPACE = { TERMS: 'terms', PRIVACY: 'privacy' } as const satisfies Record<ConsentType, string>;

/**
 * Términos y política de privacidad (AUTH-08). La versión publicada es la que se guarda con cada
 * consentimiento. Es un borrador hasta que lo revise un abogado (REQUERIMIENTOS §6).
 */
export function LegalPage({ document }: { document: ConsentType }) {
  const t = useTranslations('legal');
  const locale = useLocale() as (typeof routing.locales)[number];
  const ns = NAMESPACE[document];
  const version = LEGAL_DOCUMENTS[document].version;
  const date = new Intl.DateTimeFormat(LOCALE_TAGS[locale], { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${version}T00:00:00Z`),
  );

  return (
    <article>
      <header className="relative isolate overflow-hidden bg-night text-night-foreground clip-slope-b dark:bg-card">
        <TopoPattern variant="band" className="absolute inset-0 -z-10 size-full text-brand/25" />
        <div className="mx-auto max-w-3xl px-4 pt-16 pb-[calc(3.5vw+3.5rem)] sm:px-6">
          <p className="tape">{t('version', { date })}</p>
          <h1 className="mt-6 font-display text-5xl leading-[0.95] font-extrabold uppercase italic sm:text-6xl">
            {t(`${ns}.title`)}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-night-foreground/85">{t(`${ns}.intro`)}</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-medium">
          <Scales size={20} className="mt-px shrink-0 text-warning" aria-hidden="true" />
          {t('draftNotice')}
        </p>
        <ol className="mt-10 grid gap-10">
          {SECTIONS.map((n) => (
            <li key={n} className="grid gap-3">
              <h2 className="flex items-baseline gap-3 font-display text-3xl leading-tight font-bold uppercase">
                <span className="text-brand tabular-nums" aria-hidden="true">
                  {String(n).padStart(2, '0')}
                </span>
                {t(`${ns}.s${n}Title`)}
              </h2>
              <p className="text-lg leading-relaxed text-foreground/90">
                {t(`${ns}.s${n}Body`, { email: PRIVACY_CONTACT_EMAIL })}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-12 border-t border-border pt-6 text-muted-foreground">
          {t('contact', { email: PRIVACY_CONTACT_EMAIL })}
        </p>
      </div>
    </article>
  );
}
