import { DIFFICULTIES } from '@juandavidfuentes/indomitox-shared';
import { useTranslations } from 'next-intl';
import { DifficultyShape } from '@/components/listing/difficulty';
import { SectionHeading } from './section-heading';

/** Escala de dificultad estilo pistas de esquí: forma + color + texto (nunca solo color). */
export function Levels() {
  const t = useTranslations();

  return (
    <section aria-labelledby="niveles" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 md:pb-24 lg:px-8">
      <SectionHeading id="niveles" title={t('home.levelsTitle')} subtitle={t('home.levelsSubtitle')} />
      <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {DIFFICULTIES.map((level) => (
          <li key={level} className="flex flex-col gap-2 bg-card p-6">
            <DifficultyShape level={level} className="h-6" />
            <p className="mt-2 font-display text-2xl font-bold uppercase">{t(`difficulty.${level}`)}</p>
            <p className="text-muted-foreground">{t(`home.levels.${level}`)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
