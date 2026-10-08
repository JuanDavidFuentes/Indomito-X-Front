'use client';

import {
  addDays,
  AvailabilityRuleInputSchema,
  ManualSlotSchema,
  ruleIssuesForType,
  todayInPlatform,
  usesSlots,
  WEEKDAYS,
  type AvailabilityRuleDto,
  type ListingAvailabilityResponse,
  type ListingType,
  type SlotDto,
  type Weekday,
} from '@juandavidfuentes/indomitox-shared';
import { CalendarDots, CalendarPlus, Clock, PencilSimple, Plus, Trash, UsersThree, X } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { ToggleChips } from '@/components/forms/toggle-chips';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { useErrorText } from '@/lib/forms';
import { availabilityKey, CALENDAR_KEY, listingKey, LISTINGS_KEY, useListingAvailability } from '@/lib/listings';
import type { StepProps } from './step-props';

interface RuleDraft {
  weekdays: Weekday[];
  startTimes: string[];
  opensAt: string;
  closesAt: string;
  capacity: string;
  validFrom: string;
  validUntil: string;
  active: boolean;
}

const PRESETS: { key: 'everyDay' | 'weekdays' | 'weekends'; days: Weekday[] }[] = [
  { key: 'everyDay', days: [1, 2, 3, 4, 5, 6, 7] },
  { key: 'weekdays', days: [1, 2, 3, 4, 5] },
  { key: 'weekends', days: [6, 7] },
];

const toDraft = (rule?: AvailabilityRuleDto): RuleDraft => ({
  weekdays: rule?.weekdays ?? [6, 7],
  startTimes: rule?.startTimes.length ? rule.startTimes : ['08:00'],
  opensAt: rule?.opensAt ?? '08:00',
  closesAt: rule?.closesAt ?? '17:00',
  capacity: rule?.capacity ? String(rule.capacity) : '10',
  validFrom: rule?.validFrom ?? todayInPlatform(),
  validUntil: rule?.validUntil ?? '',
  active: rule?.active ?? true,
});

/** Días de una regla en texto corto: "Lun a Vie", "Sáb y Dom" o "Lun, Mié, Vie". */
function useWeekdaysLabel() {
  const t = useTranslations();
  return (days: Weekday[]) => {
    if (days.length === 7) return t('listings.availability.everyDay');
    const sorted = [...days].sort((a, b) => a - b);
    const consecutive = sorted.every((day, index) => index === 0 || day === sorted[index - 1]! + 1);
    if (consecutive && sorted.length > 2) {
      return t('listings.availability.dayRange', { from: t(`weekdaysShort.${sorted[0]!}`), to: t(`weekdaysShort.${sorted.at(-1)!}`) });
    }
    return sorted.map((day) => t(`weekdaysShort.${day}`)).join(', ');
  };
}

/** Formulario de una regla: días, horas de salida y cupos (o el horario de atención de un alquiler). */
function RuleForm({
  listingId,
  type,
  rule,
  onDone,
}: {
  listingId: string;
  type: ListingType;
  rule?: AvailabilityRuleDto;
  onDone: (result: ListingAvailabilityResponse | null) => void;
}) {
  const t = useTranslations();
  const errors = useErrorText();
  const id = useId();
  const slots = usesSlots(type);
  const [draft, setDraft] = useState<RuleDraft>(() => toDraft(rule));
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<RuleDraft>) => setDraft((current) => ({ ...current, ...patch }));

  const save = async () => {
    const body = {
      weekdays: draft.weekdays,
      startTimes: slots ? draft.startTimes.filter(Boolean) : [],
      opensAt: slots ? null : draft.opensAt,
      closesAt: slots ? null : draft.closesAt,
      capacity: slots ? Number(draft.capacity) || null : null,
      validFrom: draft.validFrom,
      validUntil: draft.validUntil || null,
      active: draft.active,
    };
    const parsed = AvailabilityRuleInputSchema.safeParse(body);
    const found: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) found[String(issue.path[0])] ??= errors.field(issue.message) ?? '';
    } else {
      for (const issue of ruleIssuesForType(type, parsed.data)) found[issue.path] ??= errors.field(issue.message) ?? '';
    }
    setIssues(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      const result = await api<ListingAvailabilityResponse>(
        rule ? `/v1/host/listings/${listingId}/rules/${rule.id}` : `/v1/host/listings/${listingId}/rules`,
        { method: rule ? 'PUT' : 'POST', body },
      );
      toast.success(t('listings.availability.ruleSaved'));
      onDone(result);
    } catch (error) {
      if (error instanceof ApiError && error.issues.length) {
        setIssues(Object.fromEntries(error.issues.map((issue) => [issue.path.split('.')[0], errors.field(issue.message) ?? ''])));
      } else toast.error(errors.api(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 rounded-xl border-2 border-primary/40 bg-primary/5 p-5">
      <div className="grid gap-3">
        <ToggleChips
          legend={t('listings.availability.days')}
          options={WEEKDAYS.map((day) => ({ value: day, label: t(`weekdaysShort.${day}`) }))}
          value={draft.weekdays}
          onChange={(weekdays) => set({ weekdays: [...weekdays].sort((a, b) => a - b) })}
          error={issues.weekdays}
        />
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button key={preset.key} type="button" variant="ghost" size="sm" onClick={() => set({ weekdays: preset.days })}>
              {t(`listings.availability.presets.${preset.key}`)}
            </Button>
          ))}
        </div>
      </div>

      {slots ? (
        <div className="grid gap-5 md:grid-cols-[1fr_12rem]">
          <FieldSet>
            <FieldLegend variant="label" className="text-sm font-semibold">
              {t('listings.availability.startTimes')}
            </FieldLegend>
            <div className="flex flex-wrap items-center gap-2">
              {draft.startTimes.map((time, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Input
                    type="time"
                    value={time}
                    aria-label={t('listings.availability.startTime', { index: index + 1 })}
                    onChange={(event) => set({ startTimes: draft.startTimes.map((value, i) => (i === index ? event.target.value : value)) })}
                    className="w-32"
                  />
                  {draft.startTimes.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t('listings.availability.removeTime', { time })}
                      onClick={() => set({ startTimes: draft.startTimes.filter((_, i) => i !== index) })}
                    >
                      <X size={16} aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => set({ startTimes: [...draft.startTimes, ''] })}>
                <Plus weight="bold" aria-hidden="true" />
                {t('listings.availability.addTime')}
              </Button>
            </div>
            {issues.startTimes ? <FieldError>{issues.startTimes}</FieldError> : null}
          </FieldSet>
          <Field data-invalid={issues.capacity ? true : undefined}>
            <FieldLabel htmlFor={`${id}-capacity`}>{t('listings.availability.capacity')}</FieldLabel>
            <Input id={`${id}-capacity`} inputMode="numeric" value={draft.capacity} onChange={(event) => set({ capacity: event.target.value })} />
            {issues.capacity ? <FieldError>{issues.capacity}</FieldError> : null}
          </Field>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={issues.opensAt ? true : undefined}>
            <FieldLabel htmlFor={`${id}-opens`}>{t('listings.availability.opensAt')}</FieldLabel>
            <Input id={`${id}-opens`} type="time" value={draft.opensAt} onChange={(event) => set({ opensAt: event.target.value })} />
            {issues.opensAt ? <FieldError>{issues.opensAt}</FieldError> : null}
          </Field>
          <Field data-invalid={issues.closesAt ? true : undefined}>
            <FieldLabel htmlFor={`${id}-closes`}>{t('listings.availability.closesAt')}</FieldLabel>
            <Input id={`${id}-closes`} type="time" value={draft.closesAt} onChange={(event) => set({ closesAt: event.target.value })} />
            {issues.closesAt ? <FieldError>{issues.closesAt}</FieldError> : null}
          </Field>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={issues.validFrom ? true : undefined}>
          <FieldLabel htmlFor={`${id}-from`}>{t('listings.availability.validFrom')}</FieldLabel>
          <Input id={`${id}-from`} type="date" value={draft.validFrom} onChange={(event) => set({ validFrom: event.target.value })} />
          {issues.validFrom ? <FieldError>{issues.validFrom}</FieldError> : null}
        </Field>
        <Field data-invalid={issues.validUntil ? true : undefined}>
          <FieldLabel htmlFor={`${id}-until`}>{`${t('listings.availability.validUntil')} (${t('common.optional')})`}</FieldLabel>
          <Input id={`${id}-until`} type="date" value={draft.validUntil} min={draft.validFrom} onChange={(event) => set({ validUntil: event.target.value })} />
          {issues.validUntil ? <FieldError>{issues.validUntil}</FieldError> : null}
        </Field>
      </div>
      <label className="flex items-center gap-3 text-sm font-medium">
        <Checkbox checked={draft.active} onCheckedChange={(checked) => set({ active: checked === true })} />
        {t('listings.availability.ruleActive')}
      </label>
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => onDone(null)}>
          {t('common.cancel')}
        </Button>
        <Button type="button" disabled={saving} onClick={() => void save()}>
          {saving ? <Spinner aria-hidden="true" /> : null}
          {t('listings.availability.saveRule')}
        </Button>
      </div>
    </div>
  );
}

/** Horario suelto: una fecha y hora fuera de las reglas (p. ej. una salida especial). */
function ManualSlotForm({ listingId, onDone }: { listingId: string; onDone: (result: ListingAvailabilityResponse | null) => void }) {
  const t = useTranslations();
  const errors = useErrorText();
  const id = useId();
  const [draft, setDraft] = useState({ date: addDays(todayInPlatform(), 1), time: '09:00', capacity: '8' });
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const body = { date: draft.date, time: draft.time, capacity: Number(draft.capacity) };
    const parsed = ManualSlotSchema.safeParse(body);
    if (!parsed.success) {
      setProblem(errors.field(parsed.error.issues[0]?.message) ?? null);
      return;
    }
    setSaving(true);
    try {
      const result = await api<ListingAvailabilityResponse>(`/v1/host/listings/${listingId}/slots`, { method: 'POST', body });
      toast.success(t('listings.availability.slotAdded'));
      onDone(result);
    } catch (error) {
      setProblem(errors.api(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 rounded-xl border-2 border-primary/40 bg-primary/5 p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel htmlFor={`${id}-date`}>{t('listings.availability.date')}</FieldLabel>
          <Input id={`${id}-date`} type="date" min={todayInPlatform()} value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-time`}>{t('listings.availability.time')}</FieldLabel>
          <Input id={`${id}-time`} type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-capacity`}>{t('listings.availability.capacity')}</FieldLabel>
          <Input id={`${id}-capacity`} inputMode="numeric" value={draft.capacity} onChange={(event) => setDraft({ ...draft, capacity: event.target.value })} />
        </Field>
      </div>
      {problem ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {problem}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => onDone(null)}>
          {t('common.cancel')}
        </Button>
        <Button type="button" disabled={saving} onClick={() => void save()}>
          {saving ? <Spinner aria-hidden="true" /> : null}
          {t('listings.availability.addSlot')}
        </Button>
      </div>
    </div>
  );
}

function SlotLine({ slot }: { slot: SlotDto }) {
  const t = useTranslations('listings.availability');
  const format = useFormatter();
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <span className="flex items-center gap-2 font-semibold">
        <Clock size={18} className="text-muted-foreground" aria-hidden="true" />
        {format.dateTime(new Date(slot.startsAt), { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
      </span>
      <span className="flex items-center gap-3 text-sm text-muted-foreground">
        {slot.source === 'MANUAL' ? <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold ring-1 ring-border">{t('manual')}</span> : null}
        {slot.blackedOut ? <span className="rounded-full bg-warning px-2 py-0.5 text-xs font-bold text-warning-foreground">{t('blackedOut')}</span> : null}
        <span className="inline-flex items-center gap-1 tabular-nums">
          <UsersThree size={16} aria-hidden="true" />
          {t('spots', { booked: slot.booked, capacity: slot.capacity })}
        </span>
      </span>
    </li>
  );
}

/** Paso 6: cuándo se puede reservar (AVAIL-01, AVAIL-05). Los productos usan stock. */
export function StepAvailability({ data, editable, mine }: StepProps) {
  const t = useTranslations();
  const format = useFormatter();
  const day = (date: string) => format.dateTime(new Date(`${date}T12:00:00-05:00`), { day: 'numeric', month: 'short', year: 'numeric' });
  const errors = useErrorText();
  const weekdaysLabel = useWeekdaysLabel();
  const queryClient = useQueryClient();
  const { listing } = data;
  const slots = usesSlots(listing.type);
  const canEdit = editable || mine.permissions.includes('calendar.manage');
  const availability = useListingAvailability(listing.id);
  const [editing, setEditing] = useState<AvailabilityRuleDto | 'new' | null>(null);
  const [addingSlot, setAddingSlot] = useState(false);

  const refresh = (result: ListingAvailabilityResponse | null) => {
    if (result) queryClient.setQueryData(availabilityKey(listing.id), result);
    // El progreso y lo que impide publicar dependen de los horarios.
    void queryClient.invalidateQueries({ queryKey: listingKey(listing.id) });
    void queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
    void queryClient.invalidateQueries({ queryKey: CALENDAR_KEY });
  };

  const removeRule = async (rule: AvailabilityRuleDto) => {
    try {
      refresh(await api<ListingAvailabilityResponse>(`/v1/host/listings/${listing.id}/rules/${rule.id}`, { method: 'DELETE' }));
      toast.success(t('listings.availability.ruleDeleted'));
    } catch (error) {
      toast.error(errors.api(error));
    }
  };

  if (availability.isPending) {
    return (
      <div role="status" className="grid gap-3">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    );
  }
  if (availability.isError) {
    return (
      <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 font-medium text-destructive">
        {errors.api(availability.error)}{' '}
        <Button type="button" variant="link" className="h-auto p-0" onClick={() => void availability.refetch()}>
          {t('common.retry')}
        </Button>
      </p>
    );
  }
  const { rules, manualSlots, upcoming, upcomingCount } = availability.data;

  return (
    <div className="grid gap-10">
      <section aria-labelledby="rules-title" className="grid gap-4">
        <div>
          <h3 id="rules-title" className="font-display text-2xl font-extrabold uppercase italic">
            {slots ? t('listings.availability.rulesTitle') : t('listings.availability.openingTitle')}
          </h3>
          <p className="text-muted-foreground">{slots ? t('listings.availability.rulesHint') : t('listings.availability.openingHint')}</p>
        </div>
        {rules.length ? (
          <ul className="grid gap-3">
            {rules.map((rule) =>
              editing !== 'new' && editing?.id === rule.id ? (
                <li key={rule.id}>
                  <RuleForm listingId={listing.id} type={listing.type} rule={rule} onDone={(result) => { refresh(result); setEditing(null); }} />
                </li>
              ) : (
                <li key={rule.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 ${rule.active ? 'bg-card' : 'bg-muted/50'}`}>
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {weekdaysLabel(rule.weekdays)} · {slots ? rule.startTimes.join(', ') : `${rule.opensAt} – ${rule.closesAt}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[
                        slots ? t('listings.availability.capacityValue', { count: rule.capacity ?? 0 }) : null,
                        rule.validUntil
                          ? t('listings.availability.validRange', { from: day(rule.validFrom), to: day(rule.validUntil) })
                          : t('listings.availability.validFromValue', { from: day(rule.validFrom) }),
                        rule.active ? null : t('listings.availability.inactive'),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  {canEdit ? (
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon" aria-label={t('listings.availability.editRule')} onClick={() => setEditing(rule)}>
                        <PencilSimple size={18} aria-hidden="true" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" aria-label={t('listings.availability.deleteRule')} onClick={() => void removeRule(rule)}>
                        <Trash size={18} aria-hidden="true" />
                      </Button>
                    </div>
                  ) : null}
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">{t('listings.availability.noRules')}</p>
        )}
        {editing === 'new' ? (
          <RuleForm listingId={listing.id} type={listing.type} onDone={(result) => { refresh(result); setEditing(null); }} />
        ) : canEdit ? (
          <Button type="button" variant="outline" className="justify-self-start" onClick={() => setEditing('new')}>
            <Plus weight="bold" aria-hidden="true" />
            {slots ? t('listings.availability.addRule') : t('listings.availability.addOpening')}
          </Button>
        ) : null}
      </section>

      {slots ? (
        <section aria-labelledby="manual-title" className="grid gap-4">
          <div>
            <h3 id="manual-title" className="font-display text-2xl font-extrabold uppercase italic">
              {t('listings.availability.manualTitle')}
            </h3>
            <p className="text-muted-foreground">{t('listings.availability.manualHint')}</p>
          </div>
          {manualSlots.length ? (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {manualSlots.map((slot) => (
                <SlotLine key={slot.id} slot={slot} />
              ))}
            </ul>
          ) : null}
          {addingSlot ? (
            <ManualSlotForm listingId={listing.id} onDone={(result) => { refresh(result); setAddingSlot(false); }} />
          ) : canEdit ? (
            <Button type="button" variant="outline" className="justify-self-start" onClick={() => setAddingSlot(true)}>
              <CalendarPlus size={18} aria-hidden="true" />
              {t('listings.availability.addSlot')}
            </Button>
          ) : null}
        </section>
      ) : null}

      {slots ? (
        <section aria-labelledby="upcoming-title" className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 id="upcoming-title" className="font-display text-2xl font-extrabold uppercase italic">
                {t('listings.availability.upcomingTitle')}
              </h3>
              <p className="text-muted-foreground">{t('listings.availability.upcomingHint', { count: upcomingCount })}</p>
            </div>
            <Link
              href={{ pathname: '/panel/calendario', query: { publicacion: listing.id } }}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-4 font-semibold transition-colors duration-150 hover:bg-muted"
            >
              <CalendarDots size={18} aria-hidden="true" />
              {t('listings.availability.openCalendar')}
            </Link>
          </div>
          {upcoming.length ? (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {upcoming.map((slot) => (
                <SlotLine key={slot.id} slot={slot} />
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">{t('listings.availability.noUpcoming')}</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
