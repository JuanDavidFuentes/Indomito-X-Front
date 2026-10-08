'use client';

import type { ListingEventDto, ListingEventType } from '@juandavidfuentes/indomitox-shared';
import {
  Archive,
  ArrowCounterClockwise,
  Broadcast,
  CheckCircle,
  Eye,
  Hourglass,
  Pause,
  Play,
  Prohibit,
  ShieldWarning,
  Sparkle,
  Warning,
  type Icon,
} from '@phosphor-icons/react';
import { useFormatter, useTranslations } from 'next-intl';

const EVENT_ICONS: Record<ListingEventType, Icon> = {
  CREATED: Sparkle,
  PUBLISHED: Broadcast,
  SUBMITTED: Hourglass,
  APPROVED: CheckCircle,
  REJECTED: Warning,
  WITHDRAWN: ArrowCounterClockwise,
  PAUSED: Pause,
  RESUMED: Play,
  ARCHIVED: Archive,
  RESTORED: ArrowCounterClockwise,
  HIDDEN: Prohibit,
  UNHIDDEN: Eye,
  BLOCKED: ShieldWarning,
  UNBLOCKED: CheckCircle,
};

/** Historial de una publicación: estados, moderación y bloqueos por cumplimiento, con su motivo. */
export function ListingTimeline({ events, title }: { events: ListingEventDto[]; title?: string }) {
  const t = useTranslations();
  const format = useFormatter();
  if (events.length === 0) return null;
  const reason = (event: ListingEventDto) =>
    event.type === 'BLOCKED' && event.reason ? t(`listings.blockReasonShort.${event.reason as 'HOST_NOT_APPROVED'}`) : event.reason;

  return (
    <section aria-labelledby="listing-timeline-title" className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 id="listing-timeline-title" className="font-display text-2xl font-extrabold uppercase italic">
        {title ?? t('listings.history')}
      </h2>
      <ol className="mt-5 grid gap-0">
        {events.map((event, index) => {
          const EventIcon = EVENT_ICONS[event.type];
          const extra = reason(event);
          return (
            <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
              {index < events.length - 1 ? <span aria-hidden="true" className="absolute top-9 bottom-1 left-[17px] w-px bg-border" /> : null}
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                <EventIcon size={18} weight="bold" aria-hidden="true" />
              </span>
              <div className="min-w-0 pt-1">
                <p className="leading-snug">
                  <span className="font-semibold">{event.actorName ?? t('listingEvents.system')}</span> <span>{t(`listingEvents.${event.type}`)}</span>
                </p>
                {extra ? <p className="text-sm whitespace-pre-line [overflow-wrap:anywhere]">{extra}</p> : null}
                <p className="text-sm text-muted-foreground">
                  <time dateTime={event.createdAt}>{format.dateTime(new Date(event.createdAt), { dateStyle: 'medium', timeStyle: 'short' })}</time>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
