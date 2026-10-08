'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { ListingDraftInput } from '@juandavidfuentes/indomitox-shared';
import { useEffect, useMemo } from 'react';
import { useForm, type DefaultValues, type FieldValues, type Path, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ApiError } from '@/lib/api/errors';
import { useErrorText } from '@/lib/forms';
import { useListingAutosave } from '@/lib/listings';

/** Texto de un campo numérico → número (o null si está vacío). "1.5" y "1,5" valen igual. */
export const toNumberOrNull = (value: unknown) =>
  typeof value === 'string' ? (value.trim() === '' ? null : Number(value.replace(',', '.'))) : value;

/** Esquema de un campo numérico del editor sobre el esquema de la API. */
export const numberField = <T extends z.ZodType>(schema: T) => z.preprocess(toNumberOrNull, schema);

/**
 * Formulario de un paso del editor con autoguardado por campo (como el alta del Guía): cada
 * cambio válido se envía con `PATCH /v1/host/listings/:id`; uno inválido no se envía y su error
 * aparece al salir del campo. `fields` son los esquemas de la API por campo (con los ajustes de
 * texto a número que necesite el formulario).
 */
export function useListingForm<T extends FieldValues>(
  listingId: string,
  fields: Partial<Record<keyof T & string, z.ZodType>>,
  defaultValues: DefaultValues<T>,
  options: { disabled?: boolean } = {},
) {
  const errors = useErrorText();
  const schema = useMemo(() => z.object(fields as Record<string, z.ZodType>), [fields]);
  const form = useForm<T>({
    resolver: zodResolver(schema) as unknown as Resolver<T>,
    defaultValues,
    mode: 'onTouched',
    disabled: options.disabled,
  });
  const autosave = useListingAutosave(listingId, {
    onError: (error) => {
      if (error instanceof ApiError && error.issues.length) {
        for (const issue of error.issues) {
          const field = issue.path.split('.')[0] as Path<T>;
          if (field in fields) form.setError(field, { type: 'server', message: issue.message });
        }
        return;
      }
      if (error instanceof ApiError && error.code === 'LISTING_NOT_READY') {
        toast.error(errors.api(error), { description: undefined });
        return;
      }
      toast.error(errors.api(error));
    },
  });
  const { queue } = autosave;

  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: ({ values, name, type }) => {
          if (!name || (type && type !== 'change')) return;
          const field = name.split('.')[0] as keyof T & string;
          const fieldSchema = fields[field];
          if (!fieldSchema) return;
          const parsed = fieldSchema.safeParse((values as Record<string, unknown>)[field]);
          if (parsed.success) {
            form.clearErrors(field as Path<T>);
            queue({ [field]: parsed.data } as ListingDraftInput);
          }
        },
      }),
    [form, fields, queue],
  );

  return { form, autosave };
}
