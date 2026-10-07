'use client';

import { Translate } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LABELS: Record<(typeof routing.locales)[number], string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
};

/**
 * Selector de idioma. Se ve el nombre del idioma (o su código en el móvil, para que quepa el
 * encabezado) y encima va el `select` nativo transparente: accesible y con el menú del sistema.
 */
export function LocaleSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale() as (typeof routing.locales)[number];
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="relative inline-flex h-11 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold uppercase transition-colors duration-150 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring hover:bg-current/10 sm:px-3">
      <Translate size={20} aria-hidden="true" />
      <span aria-hidden="true">
        <span className="sm:hidden">{locale}</span>
        <span className="max-sm:hidden">{LABELS[locale]}</span>
      </span>
      <span className="sr-only">{t('language')}</span>
      <select
        value={locale}
        disabled={isPending}
        onChange={(event) => {
          const nextLocale = event.target.value as (typeof routing.locales)[number];
          startTransition(() => {
            // @ts-expect-error -- los params coinciden con la ruta actual
            router.replace({ pathname, params }, { locale: nextLocale });
          });
        }}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l} className="bg-popover text-popover-foreground normal-case">
            {LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
