'use client';

import { Desktop, Moon, Sun } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

const ORDER = ['system', 'light', 'dark'] as const;
type ThemeChoice = (typeof ORDER)[number];

// Evita discrepancias de hidratación: el tema real solo se conoce en el cliente.
const subscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

export function ThemeToggle() {
  const t = useTranslations('common');
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();
  const current: ThemeChoice = isClient && ORDER.includes(theme as ThemeChoice) ? (theme as ThemeChoice) : 'system';

  const labels: Record<ThemeChoice, string> = {
    system: t('themeSystem'),
    light: t('themeLight'),
    dark: t('themeDark'),
  };
  const Icon = current === 'light' ? Sun : current === 'dark' ? Moon : Desktop;
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]!;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="inline-flex size-11 items-center justify-center rounded-full text-foreground transition-colors duration-150 hover:bg-muted"
      aria-label={`${t('theme')}: ${labels[current]}`}
      title={`${t('theme')}: ${labels[current]}`}
    >
      <Icon size={22} aria-hidden="true" />
    </button>
  );
}
