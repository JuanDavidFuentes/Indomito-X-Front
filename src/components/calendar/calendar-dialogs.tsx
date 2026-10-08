'use client';

import {
  BLACKOUT_REASONS,
  BlackoutInputSchema,
  ManualSlotSchema,
  usesSlots,
  type BlackoutReason,
  type CalendarListing,
} from '@juandavidfuentes/indomitox-shared';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { ToggleChips } from '@/components/forms/toggle-chips';
import { useListingTitle } from '@/components/listings/listing-labels';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';

/** Bloquear fechas (AVAIL-02): un rango, el motivo y todas o algunas publicaciones. */
export function BlackoutDialog({
  open,
  onOpenChange,
  listings,
  date,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listings: CalendarListing[];
  date: string;
  onSaved: () => void;
}) {
  const t = useTranslations();
  const errors = useErrorText();
  const listingTitle = useListingTitle();
  const id = useId();
  const [startsOn, setStartsOn] = useState(date);
  const [endsOn, setEndsOn] = useState(date);
  const [reason, setReason] = useState<BlackoutReason>('WEATHER');
  const [note, setNote] = useState('');
  const [all, setAll] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const body = { startsOn, endsOn, reason, note: note || undefined, ...(all ? {} : { listingIds: selected }) };
    const parsed = BlackoutInputSchema.safeParse(body);
    if (!parsed.success || (!all && selected.length === 0)) {
      setProblem(parsed.success ? errors.field('validation.selectAtLeastOne')! : (errors.field(parsed.error.issues[0]?.message) ?? null));
      return;
    }
    setSaving(true);
    try {
      await api('/v1/host/blackouts', { method: 'POST', body });
      toast.success(t('calendar.blackoutSaved'));
      onSaved();
      onOpenChange(false);
    } catch (error) {
      setProblem(errors.api(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold uppercase italic">{t('calendar.blockTitle')}</DialogTitle>
          <DialogDescription>{t('calendar.blockHint')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`${id}-from`}>{t('calendar.from')}</FieldLabel>
              <Input id={`${id}-from`} type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-to`}>{t('calendar.to')}</FieldLabel>
              <Input id={`${id}-to`} type="date" min={startsOn} value={endsOn} onChange={(event) => setEndsOn(event.target.value)} />
            </Field>
          </div>
          <ToggleChips
            legend={t('calendar.reason')}
            multiple={false}
            options={BLACKOUT_REASONS.map((value) => ({ value, label: t(`blackoutReason.${value}`) }))}
            value={[reason]}
            onChange={(value) => setReason(value[0] ?? 'OTHER')}
          />
          <Field>
            <FieldLabel htmlFor={`${id}-note`}>{`${t('calendar.note')} (${t('common.optional')})`}</FieldLabel>
            <Textarea id={`${id}-note`} rows={2} maxLength={200} value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <FieldSet>
            <FieldLegend variant="label" className="text-sm font-semibold">
              {t('calendar.appliesTo')}
            </FieldLegend>
            <label className="flex items-center gap-3 text-sm font-medium">
              <Checkbox checked={all} onCheckedChange={(checked) => setAll(checked === true)} />
              {t('calendar.allListings')}
            </label>
            {all ? null : (
              <div className="grid gap-2 pl-1">
                {listings.map((listing) => (
                  <label key={listing.id} className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={selected.includes(listing.id)}
                      onCheckedChange={(checked) =>
                        setSelected((current) => (checked === true ? [...current, listing.id] : current.filter((item) => item !== listing.id)))
                      }
                    />
                    {listingTitle(listing.title)}
                  </label>
                ))}
              </div>
            )}
          </FieldSet>
          {problem ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {problem}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="button" disabled={saving} onClick={() => void save()}>
              {saving ? <Spinner aria-hidden="true" /> : null}
              {t('calendar.block')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Agregar un horario suelto desde el calendario (AVAIL-01). */
export function SlotDialog({
  open,
  onOpenChange,
  listings,
  date,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listings: CalendarListing[];
  date: string;
  onSaved: () => void;
}) {
  const t = useTranslations();
  const errors = useErrorText();
  const listingTitle = useListingTitle();
  const id = useId();
  const candidates = listings.filter((listing) => usesSlots(listing.type) && listing.status !== 'ARCHIVED');
  const [listingId, setListingId] = useState(candidates[0]?.id ?? '');
  const [time, setTime] = useState('09:00');
  const [capacity, setCapacity] = useState('8');
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const body = { date, time, capacity: Number(capacity) };
    const parsed = ManualSlotSchema.safeParse(body);
    if (!listingId || !parsed.success) {
      setProblem(parsed.success ? errors.field('validation.required')! : (errors.field(parsed.error.issues[0]?.message) ?? null));
      return;
    }
    setSaving(true);
    try {
      await api(`/v1/host/listings/${listingId}/slots`, { method: 'POST', body });
      toast.success(t('listings.availability.slotAdded'));
      onSaved();
      onOpenChange(false);
    } catch (error) {
      setProblem(errors.api(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold uppercase italic">{t('calendar.addSlotTitle')}</DialogTitle>
          <DialogDescription>{t('calendar.addSlotHint', { date })}</DialogDescription>
        </DialogHeader>
        {candidates.length === 0 ? (
          <p className="text-muted-foreground">{t('calendar.noSlotListings')}</p>
        ) : (
          <div className="grid gap-4">
            <Field>
              <FieldLabel htmlFor={`${id}-listing`}>{t('calendar.listing')}</FieldLabel>
              <Select value={listingId} onValueChange={setListingId}>
                <SelectTrigger id={`${id}-listing`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((listing) => (
                    <SelectItem key={listing.id} value={listing.id}>
                      {listingTitle(listing.title)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`${id}-time`}>{t('listings.availability.time')}</FieldLabel>
                <Input id={`${id}-time`} type="time" value={time} onChange={(event) => setTime(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${id}-capacity`}>{t('listings.availability.capacity')}</FieldLabel>
                <Input id={`${id}-capacity`} inputMode="numeric" value={capacity} onChange={(event) => setCapacity(event.target.value)} />
              </Field>
            </div>
            {problem ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {problem}
              </p>
            ) : null}
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          {candidates.length ? (
            <Button type="button" disabled={saving} onClick={() => void save()}>
              {saving ? <Spinner aria-hidden="true" /> : null}
              {t('listings.availability.addSlot')}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
