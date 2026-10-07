'use client';

import type { Icon } from '@phosphor-icons/react';
import { useId } from 'react';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface Choice<T extends string> {
  value: T;
  icon: Icon;
  title: string;
  hint: string;
}

/** Opciones grandes con ícono, título y explicación (como "explorar / ofrecer aventuras" del registro). */
export function ChoiceCards<T extends string>({
  legend,
  value,
  choices,
  onChange,
  disabled = false,
}: {
  legend: string;
  value: T | null;
  choices: Choice<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <FieldSet>
      <FieldLegend variant="label" className="text-base font-semibold">
        {legend}
      </FieldLegend>
      <RadioGroup
        value={value ?? ''}
        onValueChange={(next) => onChange(next as T)}
        disabled={disabled}
        className="grid gap-3 sm:grid-cols-2"
      >
        {choices.map(({ value: option, icon: ChoiceIcon, title, hint }) => (
          <label
            key={option}
            className={`group relative flex flex-col gap-2 rounded-xl border-2 border-border p-5 transition-colors duration-150 has-data-checked:border-primary has-data-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 ${
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary/50'
            }`}
          >
            <span className="flex items-center justify-between">
              <ChoiceIcon size={30} weight="duotone" className="text-primary" aria-hidden="true" />
              <RadioGroupItem value={option} aria-describedby={`${id}-${option}`} />
            </span>
            <span className="font-display text-2xl leading-tight font-bold uppercase">{title}</span>
            <span id={`${id}-${option}`} className="text-sm text-muted-foreground">
              {hint}
            </span>
          </label>
        ))}
      </RadioGroup>
    </FieldSet>
  );
}
