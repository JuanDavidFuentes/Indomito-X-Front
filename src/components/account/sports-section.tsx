'use client';

import {
  DIFFICULTIES,
  SPORT_ELEMENTS,
  type Difficulty,
  type FavoriteSport,
  type MeResponse,
  type SportDto,
  type SportElement,
} from '@juandavidfuentes/indomitox-shared';
import { Check, Mountains } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { DifficultyShape } from '@/components/listing/difficulty';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';
import { useStoreMe } from './account-data';
import { AccountSection } from './section';

/** Fondo del punto de cada elemento (los tintes de foto de MASTER §2). */
const DOT: Record<SportElement, string> = {
  WATER: 'bg-tint-water',
  AIR: 'bg-tint-air',
  LAND: 'bg-tint-land',
  UNDERGROUND: 'bg-tint-underground dark:bg-muted-foreground',
  PARK: 'bg-tint-park',
};

const sameSelection = (a: FavoriteSport[], b: FavoriteSport[]) =>
  a.length === b.length && a.every((x) => b.some((y) => y.sportKey === x.sportKey && y.level === x.level));

/**
 * EXP-02: deportes favoritos con su nivel. También filtran las alertas de cercanía (PROX-05).
 * El nivel usa la misma escala que la dificultad, con forma y texto (SAFE-01).
 */
export function SportsSection({ me, sports }: { me: MeResponse; sports: SportDto[] }) {
  const t = useTranslations();
  const errors = useErrorText();
  const storeMe = useStoreMe();
  const saved = me.profile.favoriteSports;
  const [selection, setSelection] = useState<FavoriteSport[]>(saved);
  const [saving, setSaving] = useState(false);
  const dirty = !sameSelection(selection, saved);

  const sportName = (key: string) => (t.has(`sports.${key}` as never) ? t(`sports.${key}` as never) : key);
  const toggle = (key: string) =>
    setSelection((current) =>
      current.some((s) => s.sportKey === key)
        ? current.filter((s) => s.sportKey !== key)
        : [...current, { sportKey: key, level: 'BEGINNER' }],
    );
  const setLevel = (key: string, level: Difficulty) =>
    setSelection((current) => current.map((s) => (s.sportKey === key ? { ...s, level } : s)));

  const save = async () => {
    setSaving(true);
    try {
      const response = await api<MeResponse>('/v1/me/sports', { method: 'PUT', body: { sports: selection } });
      storeMe(response);
      setSelection(response.profile.favoriteSports);
      toast.success(t('account.saved'));
    } catch (error) {
      toast.error(errors.api(error));
    } finally {
      setSaving(false);
    }
  };

  // Los elegidos se listan en el orden del catálogo.
  const chosen = sports.filter((sport) => selection.some((s) => s.sportKey === sport.key));

  return (
    <AccountSection
      id="deportes"
      icon={Mountains}
      title={t('account.sections.sports')}
      hint={t('account.sportsHint')}
    >
      <div className="grid gap-6">
        {SPORT_ELEMENTS.map((element) => {
          const group = sports.filter((sport) => sport.element === element);
          if (group.length === 0) return null;
          return (
            <fieldset key={element} className="grid gap-3">
              <legend className="mb-3 flex items-center gap-2 text-sm font-bold tracking-[0.08em] uppercase">
                <span className={`size-2.5 rounded-full ${DOT[element]}`} aria-hidden="true" />
                {t(`elements.${element}`)}
              </legend>
              <div className="flex flex-wrap gap-2">
                {group.map((sport) => {
                  const checked = selection.some((s) => s.sportKey === sport.key);
                  return (
                    <button
                      key={sport.key}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => toggle(sport.key)}
                      className={`inline-flex h-11 items-center gap-2 rounded-full border-2 px-4 font-semibold transition-colors duration-150 ${
                        checked ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {checked ? <Check size={16} weight="bold" aria-hidden="true" /> : null}
                      {sportName(sport.key)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        <div className="grid gap-3 border-t border-border pt-6">
          <p className="font-semibold" aria-live="polite">
            {t('account.sportsCount', { count: selection.length })}
          </p>
          {chosen.length > 0 ? (
            <ul className="grid gap-2 md:grid-cols-2">
              {chosen.map((sport) => {
                const level = selection.find((s) => s.sportKey === sport.key)!.level;
                const id = `nivel-${sport.key}`;
                return (
                  <li key={sport.key} className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 py-2 pr-2 pl-4">
                    <label htmlFor={id} className="font-semibold">
                      {sportName(sport.key)}
                      <span className="sr-only"> — {t('account.level')}</span>
                    </label>
                    <Select value={level} onValueChange={(value) => setLevel(sport.key, value as Difficulty)}>
                      <SelectTrigger id={id} className="w-44 bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map((difficulty) => (
                          <SelectItem key={difficulty} value={difficulty}>
                            <DifficultyShape level={difficulty} className="h-3" />
                            {t(`difficulty.${difficulty}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </li>
                );
              })}
            </ul>
          ) : null}
          <div>
            <Button type="button" onClick={save} disabled={saving || !dirty}>
              {saving ? <Spinner aria-hidden="true" /> : null}
              {t('common.save')}
            </Button>
          </div>
        </div>
      </div>
    </AccountSection>
  );
}
