import { addDays, isoWeekday } from '@juandavidfuentes/indomitox-shared';

export type CalendarView = 'month' | 'week';

/** Lunes de la semana de una fecha. */
export const mondayOf = (date: string) => addDays(date, 1 - isoWeekday(date));

/** Rango visible: el mes con sus semanas completas, o una semana de lunes a domingo. */
export function calendarRange(view: CalendarView, anchor: string): { from: string; to: string } {
  if (view === 'week') {
    const from = mondayOf(anchor);
    return { from, to: addDays(from, 6) };
  }
  const first = `${anchor.slice(0, 7)}-01`;
  const [year, month] = first.split('-').map(Number) as [number, number];
  const last = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return { from: mondayOf(first), to: addDays(last, 7 - isoWeekday(last)) };
}
