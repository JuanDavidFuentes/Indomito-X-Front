'use client';

import { Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useErrorText } from '@/lib/forms';

type InputProps = Omit<ComponentProps<'input'>, 'name' | 'defaultValue' | 'value' | 'onChange' | 'onBlur'>;

interface BaseProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: ReactNode;
}

const describedBy = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(' ') || undefined;

/** Campo de texto con etiqueta visible, ayuda y error conectado por aria-describedby. */
export function TextField<T extends FieldValues>({ control, name, label, description, ...input }: BaseProps<T> & InputProps) {
  const errors = useErrorText();
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            {...input}
            {...field}
            value={(field.value as string | null | undefined) ?? ''}
            id={id}
            aria-invalid={fieldState.invalid}
            aria-describedby={describedBy(description !== undefined && `${id}-desc`, fieldState.invalid && `${id}-error`)}
          />
          {description !== undefined ? <FieldDescription id={`${id}-desc`}>{description}</FieldDescription> : null}
          <FieldError id={`${id}-error`}>{errors.field(fieldState.error?.message)}</FieldError>
        </Field>
      )}
    />
  );
}

/** Contraseña con botón para mostrarla. Permite pegar y los gestores de contraseñas (WCAG 3.3.8). */
export function PasswordField<T extends FieldValues>({
  autoComplete = 'current-password',
  ...props
}: BaseProps<T> & { autoComplete?: 'current-password' | 'new-password'; labelAction?: ReactNode }) {
  const t = useTranslations('auth');
  const errors = useErrorText();
  const id = useId();
  const [visible, setVisible] = useState(false);
  const { control, name, label, description, labelAction } = props;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <div className="flex items-baseline justify-between gap-3">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {labelAction}
          </div>
          <div className="relative">
            <Input
              {...field}
              value={(field.value as string | undefined) ?? ''}
              id={id}
              type={visible ? 'text' : 'password'}
              autoComplete={autoComplete}
              autoCapitalize="none"
              spellCheck={false}
              className="pr-12"
              aria-invalid={fieldState.invalid}
              aria-describedby={describedBy(description !== undefined && `${id}-desc`, fieldState.invalid && `${id}-error`)}
            />
            <button
              type="button"
              onClick={() => setVisible((value) => !value)}
              aria-label={visible ? t('hidePassword') : t('showPassword')}
              aria-pressed={visible}
              aria-controls={id}
              className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-md text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {visible ? <EyeSlash size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
            </button>
          </div>
          {description !== undefined ? <FieldDescription id={`${id}-desc`}>{description}</FieldDescription> : null}
          <FieldError id={`${id}-error`}>{errors.field(fieldState.error?.message)}</FieldError>
        </Field>
      )}
    />
  );
}

/** Casilla con su texto (p. ej. los consentimientos) y un enlace opcional al documento. */
export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  link,
}: Omit<BaseProps<T>, 'description'> & { link?: ReactNode }) {
  const errors = useErrorText();
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} className="gap-1.5">
          <div className="flex items-start gap-3">
            <Checkbox
              id={id}
              ref={field.ref}
              checked={field.value === true}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.invalid ? `${id}-error` : undefined}
              className="mt-0.5"
            />
            <div className="text-sm leading-snug text-foreground">
              <label htmlFor={id} className="cursor-pointer">
                {label}
              </label>{' '}
              {link}
            </div>
          </div>
          <FieldError id={`${id}-error`} className="pl-8">
            {errors.field(fieldState.error?.message)}
          </FieldError>
        </Field>
      )}
    />
  );
}

/** Error general del formulario (p. ej. credenciales inválidas): se anuncia al aparecer. */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm font-medium text-destructive"
    >
      <WarningCircle size={20} weight="fill" className="mt-px shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
