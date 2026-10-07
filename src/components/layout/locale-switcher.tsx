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

export function LocaleSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="relative inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors duration-150 hover:bg-current/10">
      <Translate size={20} aria-hidden="true" />
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
        className="cursor-pointer appearance-none bg-transparent pr-1 uppercase focus-visible:outline-none"
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
