'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { HostDraftSchema, type HostDraftInput, type HostField } from '@juandavidfuentes/indomitox-shared';
import { useEffect } from 'react';
import { useForm, type DefaultValues, type FieldValues, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { applyApiIssues, useErrorText } from '@/lib/forms';
import { useHostAutosave } from '@/lib/host';

/**
 * Formulario del alta con autoguardado por campo (HOST-01): cada cambio válido se encola y se
 * guarda al dejar de escribir; un dato inválido no se envía y su error aparece al salir del
 * campo (validación al perder el foco, no en cada tecla).
 */
export function useDraftForm<T extends FieldValues>(fields: readonly HostField[], defaultValues: DefaultValues<T>) {
  const errors = useErrorText();
  const mask = Object.fromEntries(fields.map((field) => [field, true])) as Record<HostField, true>;
  const form = useForm<T>({
    resolver: zodResolver(HostDraftSchema.pick(mask)) as unknown as Resolver<T>,
    defaultValues,
    mode: 'onTouched',
  });
  const autosave = useHostAutosave({
    onError: (error) => {
      if (!applyApiIssues(error, form.setError)) toast.error(errors.api(error));
    },
  });
  const { queue } = autosave;

  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: ({ values, name, type }) => {
          if (!name || (type && type !== 'change')) return;
          const field = name.split('.')[0] as HostField;
          if (!fields.includes(field)) return;
          const parsed = HostDraftSchema.shape[field].safeParse((values as Record<string, unknown>)[field]);
          if (parsed.success) queue({ [field]: parsed.data } as HostDraftInput);
        },
      }),
    [form, fields, queue],
  );

  return { form, autosave };
}
