'use client';

import {
  addDays,
  daysBetween,
  isBlackedOut,
  isoWeekday,
  localDate,
  localTime,
  slotRemaining,
  todayInPlatform,
  WEEKDAYS,
  type BlackoutDto,
  type CalendarListing,
  type CalendarResponse,
  type MyHostResponse,
  type SlotDto,
} from '@juandavidfuentes/indomitox-shared';
import {
  CalendarBlank,
  CalendarPlus,
  CaretLeft,
  CaretRight,
  Clock,
  CloudRain,
  LockSimple,
  LockSimpleOpen,
  Prohibit,
  Storefront,
  Trash,
  UsersThree,
} from '@phosphor-icons/react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { useListingTitle } from '@/components/listings/listing-labels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPathname, Link } from '@/i18n/navigation';
import type { routing } from '@/i18n/routing';
import { api } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';
import { CALENDAR_KEY, LISTINGS_KEY } from '@/lib/listings';
import { BlackoutDialog, SlotDialog } from './calendar-dialogs';
import { calendarRange, mondayOf, type CalendarView } from './calendar-range';

/** Color de cada publicación en el calendario (siempre acompañado de su nombre). */
const LISTING_COLORS = ['bg-tint-water', 'bg-tint-land', 'bg-tint-park', 'bg-accent', 'bg-difficulty-intermediate', 'bg-success'];

const ALL = 'ALL';

/** Una fecha "AAAA-MM-DD" al mediodía de Bogotá (para formatearla sin correrse de día). */
const noon = (date: string) => new Date(`${date}T12:00:00-05:00`);

function openingHoursOn(listing: CalendarListing, date: string) {
  const weekday = isoWeekday(date);
  return listing.openingHours.filter(
    (rule) => rule.weekdays.includes(weekday) && daysBetween(rule.validFrom, date) >= 0 && (!rule.validUntil || daysBetween(date, rule.validUntil) >= 0),
  );
}

function blackoutsOn(blackouts: BlackoutDto[], date: string, listingId?: string) {
  return blackouts.filter((blackout) => isBlackedOut(date, blackout) && (!listingId || blackout.listingIds === null || blackout.listingIds.includes(listingId)));
}

/** Un horario en el panel del día: cupos, cerrar o abrir y borrar (si es suelto). */
function SlotRow({ slot, listing, color, canEdit, onChanged }: { slot: SlotDto; listing?: CalendarListing; color: string; canEdit: boolean; onChanged: () => void }) {
  const t = useTranslations();
  const errors = useErrorText();
  const listingTitle = useListingTitle();
  const id = useId();
  const [capacity, setCapacity] = useState(String(slot.capacity));
  const [saving, setSaving] = useState(false);
  const closed = slot.status === 'CLOSED';

  const patch = async (body: { capacity?: number; status?: 'OPEN' | 'CLOSED' }) => {
    setSaving(true);
    try {
      await api(`/v1/host/slots/${slot.id}`, { method: 'PATCH', body });
      toast.success(t('calendar.slotUpdated'));
      onChanged();
    } catch (error) {
      toast.error(errors.api(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api(`/v1/host/slots/${slot.id}`, { method: 'DELETE' });
      toast.success(t('calendar.slotDeleted'));
      onChanged();
    } catch (error) {
      toast.error(errors.api(error));
    }
  };

  return (
    <li className={`grid gap-3 rounded-xl border border-border p-4 ${closed || slot.blackedOut ? 'bg-muted/60' : 'bg-card'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold">
            <span className={`size-2.5 shrink-0 rounded-full ${color}`} aria-hidden="true" />
            <span className="tabular-nums">
              {localTime(slot.startsAt)} – {localTime(slot.endsAt)}
            </span>
          </p>
          <p className="text-sm [overflow-wrap:anywhere]">
            {listing ? (
              <Link href={{ pathname: '/panel/publicaciones/[id]', params: { id: listing.id } }} className="underline-offset-4 hover:underline">
                {listingTitle(listing.title)}
              </Link>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {closed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-bold ring-1 ring-border">
              <LockSimple size={14} weight="bold" aria-hidden="true" />
              {t('calendar.closed')}
            </span>
          ) : null}
          {slot.blackedOut ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-1 text-xs font-bold text-warning-foreground">
              <Prohibit size={14} weight="bold" aria-hidden="true" />
              {t('listings.availability.blackedOut')}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
            <UsersThree size={16} aria-hidden="true" />
            {t('calendar.remaining', { remaining: slotRemaining(slot), capacity: slot.capacity })}
          </span>
        </div>
      </div>
      {canEdit ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1">
            <label htmlFor={`${id}-capacity`} className="text-xs font-semibold text-muted-foreground">
              {t('listings.availability.capacity')}
            </label>
            <Input id={`${id}-capacity`} inputMode="numeric" value={capacity} onChange={(event) => setCapacity(event.target.value)} className="h-10 w-24" />
          </div>
          <Button type="button" variant="outline" size="sm" className="h-10" disabled={saving || Number(capacity) === slot.capacity || !Number(capacity)} onClick={() => void patch({ capacity: Number(capacity) })}>
            {t('common.save')}
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-10" disabled={saving} onClick={() => void patch({ status: closed ? 'OPEN' : 'CLOSED' })}>
            {closed ? <LockSimpleOpen size={16} aria-hidden="true" /> : <LockSimple size={16} aria-hidden="true" />}
            {closed ? t('calendar.reopen') : t('calendar.close')}
          </Button>
          {slot.source === 'MANUAL' ? (
            <Button type="button" variant="ghost" size="sm" className="h-10" onClick={() => void remove()}>
              <Trash size={16} aria-hidden="true" />
              {t('common.delete')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

/**
 * Calendario del Guía (AVAIL-04): mes o semana con los horarios, sus cupos y los bloqueos, y el
 * panel del día para cerrar horarios, cambiar cupos, agregar un horario suelto o bloquear fechas.
 * La vista, la fecha y el filtro quedan en la URL.
 */
export function HostCalendar({
  mine,
  initial,
  initialView,
  initialAnchor,
  initialListing,
}: {
  mine: MyHostResponse;
  initial: CalendarResponse | null;
  initialView: CalendarView;
  initialAnchor: string;
  initialListing: string | null;
}) {
  const t = useTranslations();
  const format = useFormatter();
  const locale = useLocale() as (typeof routing.locales)[number];
  const errors = useErrorText();
  const listingTitle = useListingTitle();
  const queryClient = useQueryClient();
  const today = todayInPlatform();
  const [view, setView] = useState<CalendarView>(initialView);
  const [anchor, setAnchor] = useState(initialAnchor);
  const [listingId, setListingId] = useState(initialListing ?? ALL);
  const [selected, setSelected] = useState(() => {
    const range = calendarRange(initialView, initialAnchor);
    return daysBetween(range.from, today) >= 0 && daysBetween(today, range.to) >= 0 ? today : initialAnchor;
  });
  const [dialog, setDialog] = useState<'blackout' | 'slot' | null>(null);
  const range = calendarRange(view, anchor);
  const canEdit = mine.permissions.includes('calendar.manage');
  const firstRange = calendarRange(initialView, initialAnchor);

  const calendar = useQuery({
    queryKey: [...CALENDAR_KEY, range.from, range.to, listingId],
    queryFn: () =>
      api<CalendarResponse>(`/v1/host/calendar?from=${range.from}&to=${range.to}${listingId === ALL ? '' : `&listingId=${listingId}`}`),
    initialData:
      initial && range.from === firstRange.from && range.to === firstRange.to && listingId === (initialListing ?? ALL) ? initial : undefined,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  useEffect(() => {
    const query: Record<string, string> = { mes: anchor.slice(0, 7) };
    if (view === 'week') Object.assign(query, { vista: 'semana', dia: anchor });
    if (listingId !== ALL) query.publicacion = listingId;
    window.history.replaceState(null, '', getPathname({ locale, href: { pathname: '/panel/calendario', query } }));
  }, [locale, view, anchor, listingId]);

  const data = calendar.data;
  // El filtro lista todas las publicaciones con horarios; los datos de la vista pueden venir filtrados.
  const allListings = useQuery({
    queryKey: [...CALENDAR_KEY, 'listings'],
    queryFn: () => api<CalendarResponse>(`/v1/host/calendar?from=${today}&to=${today}`),
    initialData: initial && !initialListing ? initial : undefined,
    staleTime: 60_000,
  }).data?.listings;
  const listings = data?.listings ?? [];
  const colorOf = (id: string) => LISTING_COLORS[Math.max(0, (allListings ?? listings).findIndex((listing) => listing.id === id)) % LISTING_COLORS.length]!;
  const slotsByDay = new Map<string, SlotDto[]>();
  for (const slot of data?.slots ?? []) {
    const day = localDate(slot.startsAt);
    slotsByDay.set(day, [...(slotsByDay.get(day) ?? []), slot]);
  }
  const blackouts = data?.blackouts ?? [];
  const days = Array.from({ length: daysBetween(range.from, range.to) + 1 }, (_, i) => addDays(range.from, i));

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: CALENDAR_KEY });
    void queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
  };

  const move = (direction: 1 | -1) => {
    if (view === 'week') {
      const next = addDays(mondayOf(anchor), 7 * direction);
      setAnchor(next);
      setSelected(next);
    } else {
      const [year, month] = anchor.split('-').map(Number) as [number, number];
      const next = new Date(Date.UTC(year, month - 1 + direction, 1)).toISOString().slice(0, 10);
      setAnchor(next);
      setSelected(next);
    }
  };

  const goToday = () => {
    setAnchor(view === 'week' ? mondayOf(today) : `${today.slice(0, 7)}-01`);
    setSelected(today);
  };

  const removeBlackout = async (blackout: BlackoutDto) => {
    try {
      await api(`/v1/host/blackouts/${blackout.id}`, { method: 'DELETE' });
      toast.success(t('calendar.blackoutRemoved'));
      refresh();
    } catch (error) {
      toast.error(errors.api(error));
    }
  };

  const title =
    view === 'month'
      ? format.dateTime(noon(`${anchor.slice(0, 7)}-15`), { month: 'long', year: 'numeric' })
      : t('calendar.weekOf', { date: format.dateTime(noon(range.from), { day: 'numeric', month: 'long' }) });
  const daySlots = (slotsByDay.get(selected) ?? []).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const dayBlackouts = blackoutsOn(blackouts, selected);
  const dayOpenings = listings.flatMap((listing) => openingHoursOn(listing, selected).map((rule) => ({ listing, rule })));

  return (
    <section aria-labelledby="calendar-title" className="grid grid-cols-1 gap-6">
      <div>
        <h2 id="calendar-title" className="font-display text-4xl leading-tight font-extrabold uppercase italic">
          {t('calendar.title')}
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t('calendar.subtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="icon" aria-label={view === 'month' ? t('calendar.previousMonth') : t('calendar.previousWeek')} onClick={() => move(-1)}>
            <CaretLeft size={20} aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" size="icon" aria-label={view === 'month' ? t('calendar.nextMonth') : t('calendar.nextWeek')} onClick={() => move(1)}>
            <CaretRight size={20} aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" onClick={goToday}>
            {t('calendar.today')}
          </Button>
          <p aria-live="polite" className="ml-2 font-display text-2xl font-bold first-letter:uppercase">
            {title}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label={t('calendar.view')} className="inline-flex rounded-lg border border-border p-0.5">
            {(['month', 'week'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => {
                  setView(option);
                  setAnchor(option === 'week' ? mondayOf(selected) : `${selected.slice(0, 7)}-01`);
                }}
                className={`inline-flex min-h-10 items-center rounded-md px-3 text-sm font-semibold transition-colors duration-150 ${
                  view === option ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                {t(`calendar.views.${option}`)}
              </button>
            ))}
          </div>
          <Select value={listingId} onValueChange={setListingId}>
            <SelectTrigger className="w-64 max-w-full" aria-label={t('calendar.filter')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('calendar.allListings')}</SelectItem>
              {(allListings ?? listings).map((listing) => (
                <SelectItem key={listing.id} value={listing.id}>
                  {listingTitle(listing.title)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {calendar.isError ? (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 font-medium text-destructive">
          {errors.api(calendar.error)}{' '}
          <Button type="button" variant="link" className="h-auto p-0" onClick={() => void calendar.refetch()}>
            {t('common.retry')}
          </Button>
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className={`grid content-start gap-3 ${calendar.isFetching ? 'opacity-80' : ''}`} aria-busy={calendar.isFetching}>
          {(allListings ?? listings).length > 1 ? (
            <ul aria-label={t('calendar.legend')} className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {(allListings ?? listings).map((listing) => (
                <li key={listing.id} className="flex items-center gap-1.5">
                  <span className={`size-2.5 rounded-full ${colorOf(listing.id)}`} aria-hidden="true" />
                  {listingTitle(listing.title)}
                </li>
              ))}
            </ul>
          ) : null}
          {view === 'month' ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="grid grid-cols-7 border-b border-border bg-muted text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="py-2">
                    <span className="sm:hidden">{t(`weekdaysShort.${day}`).slice(0, 1)}</span>
                    <span className="max-sm:hidden">{t(`weekdaysShort.${day}`)}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day) => {
                  const slots = (slotsByDay.get(day) ?? []).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
                  const blocked = blackoutsOn(blackouts, day).length > 0;
                  const outside = day.slice(0, 7) !== anchor.slice(0, 7);
                  const isSelected = day === selected;
                  const label = `${format.dateTime(noon(day), { weekday: 'long', day: 'numeric', month: 'long' })}: ${t('calendar.daySummary', { count: slots.length })}${blocked ? `, ${t('calendar.blocked')}` : ''}`;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelected(day)}
                      aria-pressed={isSelected}
                      aria-label={label}
                      className={`relative flex min-h-16 flex-col items-stretch gap-1 border-r border-b border-border p-1 text-left transition-colors duration-150 sm:min-h-28 sm:p-1.5 [&:nth-child(7n)]:border-r-0 ${
                        outside ? 'bg-muted/40 text-muted-foreground' : ''
                      } ${blocked ? 'bg-warning/10' : ''} ${isSelected ? 'ring-2 ring-primary ring-inset' : 'hover:bg-muted/60'}`}
                    >
                      <span
                        className={`inline-flex size-7 items-center justify-center self-start rounded-full text-sm font-bold tabular-nums ${
                          day === today ? 'bg-primary text-primary-foreground' : ''
                        }`}
                        aria-hidden="true"
                      >
                        {Number(day.slice(8))}
                      </span>
                      {blocked ? (
                        <span aria-hidden="true" className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-warning max-sm:justify-center">
                          <Prohibit size={12} weight="bold" />
                          <span className="max-lg:hidden">{t('calendar.blocked')}</span>
                        </span>
                      ) : null}
                      {/* Teléfono: puntos; desde 640 px, la hora de cada horario con el color de su publicación. */}
                      <span aria-hidden="true" className="flex flex-wrap gap-0.5 sm:hidden">
                        {slots.slice(0, 4).map((slot) => (
                          <span key={slot.id} className={`size-1.5 rounded-full ${slot.status === 'CLOSED' ? 'bg-muted-foreground' : colorOf(slot.listingId)}`} />
                        ))}
                      </span>
                      <span aria-hidden="true" className="grid gap-0.5 max-sm:hidden">
                        {slots.slice(0, 3).map((slot) => (
                          <span
                            key={slot.id}
                            className={`flex items-center gap-1 rounded px-1 py-0.5 text-[0.7rem] leading-tight font-semibold tabular-nums ${
                              slot.status === 'CLOSED' || slot.blackedOut ? 'text-muted-foreground line-through' : 'bg-muted/70'
                            }`}
                          >
                            <span className={`size-1.5 shrink-0 rounded-full ${colorOf(slot.listingId)}`} />
                            {localTime(slot.startsAt)}
                          </span>
                        ))}
                        {slots.length > 3 ? <span className="px-1 text-[0.7rem] font-semibold text-muted-foreground">{t('calendar.more', { count: slots.length - 3 })}</span> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <ol className="grid gap-2">
              {days.map((day) => {
                const slots = (slotsByDay.get(day) ?? []).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
                const blocked = blackoutsOn(blackouts, day).length > 0;
                const openings = listings.flatMap((listing) => openingHoursOn(listing, day).map((rule) => ({ listing, rule })));
                const isSelected = day === selected;
                return (
                  <li key={day}>
                    <button
                      type="button"
                      onClick={() => setSelected(day)}
                      aria-pressed={isSelected}
                      className={`grid w-full gap-2 rounded-xl border p-3 text-left transition-colors duration-150 sm:grid-cols-[8rem_minmax(0,1fr)] ${
                        isSelected ? 'border-primary ring-2 ring-primary/40' : 'border-border hover:bg-muted/60'
                      } ${blocked ? 'bg-warning/10' : 'bg-card'}`}
                    >
                      <span className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0.5">
                        <span className="font-display text-lg font-bold first-letter:uppercase">{format.dateTime(noon(day), { weekday: 'long' })}</span>
                        <span className={`text-sm tabular-nums ${day === today ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                          {format.dateTime(noon(day), { day: 'numeric', month: 'short' })}
                          {day === today ? ` · ${t('calendar.today')}` : ''}
                        </span>
                        {blocked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-warning">
                            <Prohibit size={12} weight="bold" aria-hidden="true" />
                            {t('calendar.blocked')}
                          </span>
                        ) : null}
                      </span>
                      <span className="flex flex-wrap content-start gap-2">
                        {slots.map((slot) => (
                          <span
                            key={slot.id}
                            className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-sm ${
                              slot.status === 'CLOSED' || slot.blackedOut ? 'text-muted-foreground line-through' : 'bg-background'
                            }`}
                          >
                            <span className={`size-2 shrink-0 rounded-full ${colorOf(slot.listingId)}`} aria-hidden="true" />
                            <span className="font-semibold tabular-nums">{localTime(slot.startsAt)}</span>
                            <span className="truncate">{listingTitle(listings.find((listing) => listing.id === slot.listingId)?.title ?? {})}</span>
                            <span className="shrink-0 text-muted-foreground tabular-nums">
                              {slotRemaining(slot)}/{slot.capacity}
                            </span>
                          </span>
                        ))}
                        {openings.map(({ listing, rule }, index) => (
                          <span key={`${listing.id}-${index}`} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-dashed border-border px-2 py-1 text-sm">
                            <Storefront size={14} className="shrink-0" aria-hidden="true" />
                            <span className="truncate">{listingTitle(listing.title)}</span>
                            <span className="shrink-0 text-muted-foreground tabular-nums">
                              {rule.opensAt}–{rule.closesAt}
                            </span>
                          </span>
                        ))}
                        {slots.length === 0 && openings.length === 0 ? <span className="text-sm text-muted-foreground">{t('calendar.emptyDay')}</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <aside aria-labelledby="day-title" className="grid content-start gap-4 rounded-xl border border-border bg-card p-5">
          <div>
            <h3 id="day-title" className="font-display text-2xl font-extrabold uppercase italic first-letter:uppercase">
              {format.dateTime(noon(selected), { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <p className="text-sm text-muted-foreground">{t('calendar.daySummary', { count: daySlots.length })}</p>
          </div>
          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" disabled={daysBetween(today, selected) < 0} onClick={() => setDialog('slot')}>
                <CalendarPlus size={16} aria-hidden="true" />
                {t('calendar.addSlot')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setDialog('blackout')}>
                <CloudRain size={16} aria-hidden="true" />
                {t('calendar.blockDay')}
              </Button>
            </div>
          ) : null}
          {dayBlackouts.map((blackout) => (
            <div key={blackout.id} className="grid gap-2 rounded-xl border border-warning/50 bg-warning/10 p-3 text-sm">
              <p className="flex items-center gap-2 font-semibold">
                <Prohibit size={18} className="text-warning" aria-hidden="true" />
                {t(`blackoutReason.${blackout.reason}`)}
                {blackout.startsOn !== blackout.endsOn
                  ? ` · ${format.dateTime(noon(blackout.startsOn), { day: 'numeric', month: 'short' })} – ${format.dateTime(noon(blackout.endsOn), { day: 'numeric', month: 'short' })}`
                  : null}
              </p>
              {blackout.note ? <p className="text-muted-foreground">{blackout.note}</p> : null}
              <p className="text-muted-foreground">
                {blackout.listingIds === null
                  ? t('calendar.allListings')
                  : blackout.listingIds.map((id) => listingTitle((allListings ?? listings).find((l) => l.id === id)?.title ?? {})).join(', ')}
              </p>
              {canEdit ? (
                <Button type="button" variant="ghost" size="sm" className="justify-self-start" onClick={() => void removeBlackout(blackout)}>
                  <Trash size={16} aria-hidden="true" />
                  {t('calendar.removeBlackout')}
                </Button>
              ) : null}
            </div>
          ))}
          {dayOpenings.length ? (
            <ul className="grid gap-2">
              {dayOpenings.map(({ listing, rule }, index) => (
                <li key={`${listing.id}-${index}`} className="flex items-center gap-2 rounded-xl border border-dashed border-border p-3 text-sm">
                  <Clock size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span>
                    <span className="font-semibold">{listingTitle(listing.title)}</span> · {t('calendar.openFromTo', { from: rule.opensAt, to: rule.closesAt })}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {daySlots.length ? (
            <ul className="grid gap-3">
              {daySlots.map((slot) => (
                <SlotRow
                  key={`${slot.id}-${slot.capacity}-${slot.status}`}
                  slot={slot}
                  listing={listings.find((listing) => listing.id === slot.listingId)}
                  color={colorOf(slot.listingId)}
                  canEdit={canEdit}
                  onChanged={refresh}
                />
              ))}
            </ul>
          ) : dayOpenings.length === 0 ? (
            <div className="grid justify-items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              <CalendarBlank size={32} weight="duotone" aria-hidden="true" />
              {t('calendar.emptyDay')}
            </div>
          ) : null}
        </aside>
      </div>

      {dialog === 'blackout' ? (
        <BlackoutDialog open onOpenChange={(open) => !open && setDialog(null)} listings={allListings ?? listings} date={selected} onSaved={refresh} />
      ) : null}
      {dialog === 'slot' ? (
        <SlotDialog open onOpenChange={(open) => !open && setDialog(null)} listings={allListings ?? listings} date={selected} onSaved={refresh} />
      ) : null}
    </section>
  );
}
