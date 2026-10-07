import type { Difficulty } from '@juandavidfuentes/indomitox-shared';
import { useTranslations } from 'next-intl';

/** Color de cada nivel (tokens). La forma y el texto acompañan siempre al color (MASTER §2). */
const COLOR: Record<Difficulty, string> = {
  BEGINNER: 'text-difficulty-beginner',
  INTERMEDIATE: 'text-difficulty-intermediate',
  ADVANCED: 'text-difficulty-advanced',
  EXPERT: 'text-difficulty-expert',
};

/** Forma estilo pistas de esquí: ● principiante, ■ intermedio, ◆ avanzado, ◆◆ experto. */
export function DifficultyShape({ level, className = 'h-3' }: { level: Difficulty; className?: string }) {
  const diamond = (x: number) => <rect x={x + 2.2} y="2.2" width="7.6" height="7.6" rx="0.8" transform={`rotate(45 ${x + 6} 6)`} />;
  return (
    <svg
      viewBox={level === 'EXPERT' ? '0 0 24 12' : '0 0 12 12'}
      className={`${COLOR[level]} ${className} w-auto shrink-0`}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {level === 'BEGINNER' && <circle cx="6" cy="6" r="5" />}
      {level === 'INTERMEDIATE' && <rect x="1.5" y="1.5" width="9" height="9" rx="1" />}
      {level === 'ADVANCED' && diamond(0)}
      {level === 'EXPERT' && (
        <>
          {diamond(0)}
          {diamond(12)}
        </>
      )}
    </svg>
  );
}

/** Insignia de dificultad para tarjetas sobre foto. */
export function DifficultyBadge({ level }: { level: Difficulty }) {
  const t = useTranslations('difficulty');
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/95 px-2.5 py-1 text-xs font-bold text-foreground shadow-sm">
      <DifficultyShape level={level} className="h-2.5" />
      {t(level)}
    </span>
  );
}
