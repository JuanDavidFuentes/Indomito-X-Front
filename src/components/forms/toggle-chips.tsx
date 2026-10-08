'use client';

import { Check } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { FieldLegend, FieldSet } from '@/components/ui/field';

export interface ChipOption<V extends string | number> {
  value: V;
  label: string;
  /** Algo extra junto al nombre (p. ej. la insignia NTS). */
  extra?: ReactNode;
}

/**
 * Píldoras para elegir varias opciones (`checkbox`) o una (`radio`): 44 px de alto, marca de
 * elegido y el estado anunciado a los lectores de pantalla.
 */
export function ToggleChips<V extends string | number>({
  legend,
  hint,
  options,
  value,
  onChange,
  multiple = true,
  disabled = false,
  max,
  error,
}: {
  legend: string;
  hint?: ReactNode;
  options: ChipOption<V>[];
  value: V[];
  onChange: (value: V[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  max?: number;
  error?: string;
}) {
  const toggle = (option: V) => {
    if (!multiple) return onChange([option]);
    if (value.includes(option)) return onChange(value.filter((item) => item !== option));
    if (max && value.length >= max) return onChange([...value.slice(1), option]);
    onChange([...value, option]);
  };
  return (
    <FieldSet data-invalid={error ? true : undefined}>
      <FieldLegend variant="label" className="text-sm font-semibold">
        {legend}
      </FieldLegend>
      {hint ? <p className="-mt-2 text-sm text-muted-foreground">{hint}</p> : null}
      <div role={multiple ? 'group' : 'radiogroup'} aria-label={legend} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value.includes(option.value);
          return (
            <button
              key={String(option.value)}
              type="button"
              role={multiple ? 'checkbox' : 'radio'}
              aria-checked={checked}
              disabled={disabled}
              onClick={() => toggle(option.value)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
                checked ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
              }`}
            >
              {checked ? <Check size={16} weight="bold" aria-hidden="true" /> : null}
              {option.label}
              {option.extra}
            </button>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </FieldSet>
  );
}
