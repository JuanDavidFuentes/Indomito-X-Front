'use client';

import { CheckCircle, CloudArrowUp, WarningCircle } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import type { AutosaveStatus } from '@/lib/host';

/** Estado del autoguardado, anunciado con cortesía a los lectores de pantalla. */
export function AutosaveIndicator({ status }: { status: AutosaveStatus }) {
  const t = useTranslations('host');
  // En reposo no ocupa espacio; aparece al guardar (un cambio provocado por el usuario).
  // Es siempre el mismo elemento para que los lectores de pantalla anuncien cada cambio.
  return (
    <p
      role="status"
      aria-live="polite"
      className={status === 'idle' ? 'sr-only' : 'inline-flex min-h-6 items-center gap-1.5 text-sm font-semibold'}
    >
      {status === 'saving' ? (
        <>
          <CloudArrowUp size={18} className="animate-pulse text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground">{t('autosaving')}</span>
        </>
      ) : status === 'saved' ? (
        <>
          <CheckCircle size={18} weight="fill" className="text-success" aria-hidden="true" />
          <span>{t('autosaved')}</span>
        </>
      ) : status === 'error' ? (
        <>
          <WarningCircle size={18} weight="fill" className="text-destructive" aria-hidden="true" />
          <span className="text-destructive">{t('autosaveError')}</span>
        </>
      ) : null}
    </p>
  );
}

/** Aviso de por qué un bloque no se puede editar. */
export function LockedNotice({ children }: { children: string }) {
  return <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">{children}</p>;
}
