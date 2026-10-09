'use client';

import { localizedOr, type Locale, type SearchPlace } from '@juandavidfuentes/indomitox-shared';
import { MagnifyingGlass, MapPin, Mountains, X } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { usePlaceSuggestions } from '@/lib/search';

type Option = { kind: 'place'; place: SearchPlace } | { kind: 'text'; text: string };

/**
 * Destino con autocompletado (SRCH-01, combobox ARIA 1.2): zonas y municipios con cuántas
 * aventuras tienen, sin importar tildes. Sin texto sugiere las zonas destacadas. Enter con texto
 * libre busca ese texto (si es un lugar, la API lo reconoce).
 *
 * Dentro de un `<form>` sin JavaScript sigue funcionando: el campo se envía como `q` y el lugar
 * elegido como `place`.
 */
export function PlaceSearch({
  defaultText = '',
  defaultPlace = null,
  onSelectPlace,
  onSubmitText,
  onClear,
  onTextChange,
  inputClassName = '',
  placeholder,
  label,
  hideLabel = false,
}: {
  defaultText?: string;
  defaultPlace?: string | null;
  onSelectPlace?: (place: SearchPlace) => void;
  onSubmitText?: (text: string) => void;
  onClear?: () => void;
  /** El texto y el lugar elegido cada vez que cambian (para un formulario que envía después). */
  onTextChange?: (text: string, placeSlug: string | null) => void;
  inputClassName?: string;
  placeholder?: string;
  label: string;
  hideLabel?: boolean;
}) {
  const t = useTranslations('search');
  const locale = useLocale() as Locale;
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(defaultText);
  const [place, setPlace] = useState<string | null>(defaultPlace);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const suggestions = usePlaceSuggestions(text, open);
  const trimmed = text.trim();
  const options: Option[] = [
    ...(suggestions.data ?? []).map((item) => ({ kind: 'place' as const, place: item })),
    ...(trimmed.length >= 2 ? [{ kind: 'text' as const, text: trimmed }] : []),
  ];
  const showList = open && options.length > 0;
  const name = (item: SearchPlace) => localizedOr(item.names, locale, item.slug);

  const choose = (option: Option) => {
    setOpen(false);
    if (option.kind === 'place') {
      setText(name(option.place));
      setPlace(option.place.slug);
      onTextChange?.(name(option.place), option.place.slug);
      onSelectPlace?.(option.place);
    } else {
      setPlace(null);
      onSubmitText?.(option.text);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, Math.max(options.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      if (showList && options[active]) {
        event.preventDefault();
        choose(options[active]);
      } else if (onSubmitText) {
        event.preventDefault();
        setOpen(false);
        onSubmitText(trimmed);
      }
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'mb-0.5 block text-xs font-bold tracking-[0.08em] uppercase'}>
        {label}
      </label>
      <div className="relative flex items-center">
        <MapPin size={20} className="pointer-events-none absolute left-0 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          id={id}
          name={place ? undefined : 'q'}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          placeholder={placeholder ?? t('placePlaceholder')}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setPlace(null);
            onTextChange?.(event.target.value, null);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className={`h-9 w-full min-w-0 bg-transparent pr-9 pl-7 text-base placeholder:text-muted-foreground focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden ${inputClassName}`}
        />
        {place ? <input type="hidden" name="place" value={place} /> : null}
        {text ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setText('');
              setPlace(null);
              onTextChange?.('', null);
              onClear?.();
              inputRef.current?.focus();
            }}
            aria-label={t('clearPlace')}
            className="absolute right-0 inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            <X size={18} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <ul
        id={listId}
        role="listbox"
        aria-label={t('suggestionsLabel')}
        hidden={!showList}
        className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 min-w-64 overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl"
      >
        {options.map((option, index) => (
          <li
            key={option.kind === 'place' ? `${option.place.kind}-${option.place.slug}` : 'text'}
            id={`${id}-opt-${index}`}
            role="option"
            aria-selected={index === active}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => setActive(index)}
            onClick={() => choose(option)}
            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${index === active ? 'bg-muted' : ''}`}
          >
            {option.kind === 'place' ? (
              <>
                {option.place.kind === 'ZONE' ? (
                  <Mountains size={22} className="shrink-0 text-primary" aria-hidden="true" />
                ) : (
                  <MapPin size={22} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                <span className="min-w-0">
                  <span className="block font-semibold">{name(option.place)}</span>
                  <span className="block text-sm text-muted-foreground">
                    {option.place.departmentName} · {t('suggestionCount', { count: option.place.listingCount })}
                  </span>
                </span>
              </>
            ) : (
              <>
                <MagnifyingGlass size={22} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="font-semibold">{t('searchText', { query: option.text })}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
