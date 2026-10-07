import { BellRinging } from '@phosphor-icons/react/ssr';
import { useTranslations } from 'next-intl';
import { TopoPattern } from '@/components/brand/topo-pattern';

/** Aviso de las alertas de cercanía (solo en la app). */
export function AppCta() {
  const t = useTranslations();

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
      <div className="relative isolate flex flex-col gap-6 overflow-hidden rounded-2xl bg-tint-water p-8 text-night-foreground md:flex-row md:items-center md:p-12">
        <TopoPattern variant="band" className="absolute inset-0 -z-10 size-full text-night-foreground/15" />
        <span className="grid size-16 shrink-0 -rotate-6 place-items-center rounded-2xl bg-night text-accent">
          <BellRinging size={34} weight="bold" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-3xl leading-[0.95] font-extrabold uppercase italic sm:text-4xl">
            {t('home.appCtaTitle')}
          </h2>
          <p className="mt-2 text-lg text-night-foreground/90">{t('home.appCtaBody')}</p>
        </div>
        <p className="tape self-start md:self-auto">{t('common.comingSoon')}</p>
      </div>
    </section>
  );
}
