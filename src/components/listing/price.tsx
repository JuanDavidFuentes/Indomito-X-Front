'use client';

import { useTranslations } from 'next-intl';
import { usePrice } from '@/lib/fx';

/**
 * Precio en pesos con su aproximado ("Desde $80.000 ≈ US$25"). Es un componente de cliente para
 * que el aproximado siga la moneda que eligió el visitante sin volver dinámica la página.
 */
export function Price({
  amountMinor,
  from = false,
  approxClassName = 'text-muted-foreground',
}: {
  amountMinor: number;
  /** "Desde $80.000" en vez de solo el monto. */
  from?: boolean;
  approxClassName?: string;
}) {
  const t = useTranslations('price');
  const price = usePrice()(amountMinor);
  return (
    <>
      <span className="font-semibold tabular-nums">{from ? t('from', { price: price.cop }) : price.cop}</span>
      {price.approx ? <span className={`tabular-nums ${approxClassName}`}> {t('approx', { price: price.approx })}</span> : null}
    </>
  );
}
