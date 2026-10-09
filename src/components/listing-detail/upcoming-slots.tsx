'use client';

import { localDate, type PublicSlot } from '@juandavidfuentes/indomitox-shared';
import { CalendarBlank } from '@phosphor-icons/react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const FIRST_DAYS = 6;

/** Próximas salidas con cupo, agrupadas por día (hora de Bogotá). Muestra seis días y "Ver más fechas". */
export function UpcomingSlots({ slots }: { slots: PublicSlot[] }) {
  const t = useTranslations('listingDetail');
  const format = useFormatter();
  const [all, setAll] = useState(false);
  const days = new Map<string, PublicSlot[]>();
  for (const slot of slots) {
    const day = localDate(slot.startsAt);
    days.set(day, [...(days.get(day) ?? []), slot]);
  }
  const entries = [...days.entries()];
  const visible = all ? entries : entries.slice(0, FIRST_DAYS);

  if (!entries.length) return <p className="text-muted-foreground">{t('upcomingEmpty')}</p>;

  return (
    <div className="grid gap-4">
      <ul className="grid gap-2 sm:grid-cols-2">
        {visible.map(([day, daySlots]) => (
          <li key={day} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <CalendarBlank size={22} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-semibold first-letter:uppercase">
                {format.dateTime(new Date(daySlots[0]!.startsAt), { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <ul className="mt-1 grid gap-1">
                {daySlots.map((slot) => (
                  <li key={slot.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-semibold tabular-nums">{format.dateTime(new Date(slot.startsAt), { hour: 'numeric', minute: '2-digit' })}</span>
                    <span className={slot.remaining <= 3 ? 'font-semibold text-warning' : 'text-muted-foreground'}>
                      {t('spotsLeft', { count: slot.remaining })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
      {entries.length > FIRST_DAYS ? (
        <Button type="button" variant="outline" className="justify-self-start" aria-expanded={all} onClick={() => setAll((value) => !value)}>
          {all ? t('showFewerDates') : t('showMoreDates')}
        </Button>
      ) : null}
    </div>
  );
}
