'use client';

import { DISPLAY_CURRENCIES, type Currency } from '@juandavidfuentes/indomitox-shared';
import { CurrencyCircleDollar } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useCurrency } from '@/lib/fx';

/**
 * Moneda del precio aproximado (SRCH-07). Mismo patrón que el selector de idioma: se ve el código
 * y encima va un `select` nativo transparente (accesible y con el menú del sistema).
 */
export function CurrencySwitcher() {
  const t = useTranslations('currency');
  const [currency, setCurrency] = useCurrency();

  return (
    <label
      title={t('hint')}
      className="relative inline-flex h-11 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold uppercase transition-colors duration-150 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring hover:bg-current/10 sm:px-3"
    >
      <CurrencyCircleDollar size={20} aria-hidden="true" />
      <span aria-hidden="true">{currency}</span>
      <span className="sr-only">{t('label')}</span>
      <select
        value={currency}
        onChange={(event) => setCurrency(event.target.value as Currency)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {DISPLAY_CURRENCIES.map((option) => (
          <option key={option} value={option} className="bg-popover text-popover-foreground normal-case">
            {t(`options.${option}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
