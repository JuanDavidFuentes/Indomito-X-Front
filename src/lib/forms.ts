'use client';

import { VALIDATION_PARAMS } from '@juandavidfuentes/indomitox-shared';
import { useTranslations } from 'next-intl';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError, errorCode } from './api/errors';

/** Traductor sin el tipado estricto de claves: aquí las claves llegan en tiempo de ejecución. */
type LooseTranslator = { (key: string, values?: Record<string, string | number>): string; has(key: string): boolean };

/**
 * Traduce los errores: los esquemas Zod de shared usan claves `validation.*` como mensaje
 * y la API responde con códigos `errors.*`.
 */
export function useErrorText() {
  const t = useTranslations() as unknown as LooseTranslator;
  return {
    field(message: string | undefined): string | undefined {
      if (!message) return undefined;
      return t(t.has(message) ? message : 'validation.invalid', VALIDATION_PARAMS);
    },
    api(error: unknown): string {
      return t(`errors.${errorCode(error)}`);
    },
  };
}

/**
 * Lleva los errores de validación de la API a los campos del formulario. Devuelve true si
 * pudo ubicarlos todos (entonces no hace falta un aviso general).
 */
export function applyApiIssues<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): boolean {
  if (!(error instanceof ApiError) || error.issues.length === 0) return false;
  let first = true;
  for (const issue of error.issues) {
    setError(issue.path as Path<T>, { type: 'server', message: issue.message }, { shouldFocus: first });
    first = false;
  }
  return true;
}
