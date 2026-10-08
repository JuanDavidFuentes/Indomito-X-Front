'use client';

import { municipalityLabel, type MunicipalityDto } from '@juandavidfuentes/indomitox-shared';
import { MagnifyingGlass, MapPin, X } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useMunicipality, useMunicipalitySearch } from '@/lib/catalog';

/**
 * Municipio del DANE con autocompletado (combobox ARIA 1.2): se escribe el nombre sin importar
 * tildes, se elige con el mouse o con ↑ ↓ y Enter, y Escape cierra sin cambiar nada. Al salir del
 * campo sin elegir, vuelve a mostrar el municipio que estaba.
 */
export function MunicipalityCombobox({
  value,
  onChange,
  label,
  description,
  error,
  disabled = false,
  onBlur,
}: {
  value: string | null;
  onChange: (code: string | null, municipality: MunicipalityDto | null) => void;
  label: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  onBlur?: () => void;
}) {
  const t = useTranslations('catalog');
  const id = useId();
  const listId = `${id}-list`;
  const selected = useMunicipality(value);
  const selectedLabel = selected.data ? municipalityLabel(selected.data) : '';
  const [text, setText] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = useMunicipalitySearch(text ?? '');
  const options = results.data ?? [];
  const inputRef = useRef<HTMLInputElement>(null);

  const choose = (municipality: MunicipalityDto) => {
    onChange(municipality.code, municipality);
    setText(null);
    setOpen(false);
  };

  const close = () => {
    setText(null);
    setOpen(false);
    onBlur?.();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, Math.max(options.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && open && options[active]) {
      event.preventDefault();
      choose(options[active]);
    } else if (event.key === 'Escape') {
      if (open || text !== null) event.preventDefault();
      setText(null);
      setOpen(false);
    }
  };

  const showList = open && text !== null && text.trim().length >= 2;
  const describedBy = [description ? `${id}-desc` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <MapPin size={20} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && options[active] ? `${id}-opt-${options[active].code}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          placeholder={t('municipalityPlaceholder')}
          value={text ?? selectedLabel}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => {
            if (text === null && !value) setOpen(true);
          }}
          onBlur={close}
          onKeyDown={onKeyDown}
          className="pr-11 pl-10"
        />
        {value && !disabled ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange(null, null);
              setText('');
              inputRef.current?.focus();
            }}
            aria-label={t('clearMunicipality')}
            className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-md text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            <X size={18} aria-hidden="true" />
          </button>
        ) : null}
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          hidden={!showList}
          className="absolute inset-x-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          {results.isFetching && options.length === 0 ? (
            <li role="presentation" className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
              <Spinner aria-hidden="true" />
              {t('searching')}
            </li>
          ) : options.length === 0 ? (
            <li role="presentation" className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
              <MagnifyingGlass size={16} aria-hidden="true" />
              {t('noMunicipality')}
            </li>
          ) : (
            options.map((municipality, index) => (
              <li
                key={municipality.code}
                id={`${id}-opt-${municipality.code}`}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(municipality)}
                className={`flex min-h-11 cursor-pointer flex-col justify-center rounded-md px-3 py-1.5 ${
                  index === active ? 'bg-muted' : ''
                }`}
              >
                <span className="font-semibold">{municipality.name}</span>
                <span className="text-xs text-muted-foreground">{municipality.departmentName}</span>
              </li>
            ))
          )}
        </ul>
      </div>
      {description ? <FieldDescription id={`${id}-desc`}>{description}</FieldDescription> : null}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}
