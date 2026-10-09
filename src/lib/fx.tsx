'use client';

import {
  CURRENCY_COOKIE,
  DEFAULT_APPROX_CURRENCY,
  DisplayCurrencySchema,
  priceDisplay,
  type Currency,
  type FxRatesResponse,
  type Locale,
  type PriceDisplay,
} from '@juandavidfuentes/indomitox-shared';
import { useLocale } from 'next-intl';
import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from 'react';

/*
 * Precios en la moneda elegida (SRCH-07, I18N-03). Siempre se muestran los pesos (se cobra en
 * COP) y, al lado, el aproximado en dólares o euros con la TRM del día. La moneda vive en una
 * cookie para no volver dinámicas las páginas públicas: el servidor pinta la de su idioma y el
 * navegador la cambia al hidratar si el visitante eligió otra.
 */

const FxContext = createContext<FxRatesResponse | null>(null);

export function FxProvider({ rates, children }: { rates: FxRatesResponse | null; children: ReactNode }) {
  return <FxContext.Provider value={rates}>{children}</FxContext.Provider>;
}

const CHANGE_EVENT = 'ix:currency';

function readCookie(): Currency | null {
  const raw = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${CURRENCY_COOKIE}=`))
    ?.split('=')[1];
  const parsed = DisplayCurrencySchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
};

/** Moneda del aproximado: la elegida (cookie) o la del idioma. */
export function useCurrency(): [Currency, (currency: Currency) => void] {
  const locale = useLocale() as Locale;
  const fallback = DEFAULT_APPROX_CURRENCY[locale];
  const currency = useSyncExternalStore(
    subscribe,
    () => readCookie() ?? fallback,
    () => fallback,
  );
  const setCurrency = useCallback((next: Currency) => {
    document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return [currency, setCurrency];
}

export function useFxRates(): FxRatesResponse | null {
  return useContext(FxContext);
}

/** Pesos y aproximado de un monto en unidades menores de COP. */
export function usePrice(): (amountMinor: number) => PriceDisplay {
  const locale = useLocale() as Locale;
  const rates = useFxRates();
  const [currency] = useCurrency();
  return useCallback((amountMinor: number) => priceDisplay(amountMinor, currency, locale, rates?.rates), [currency, locale, rates]);
}
