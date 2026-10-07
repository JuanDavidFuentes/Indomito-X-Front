'use client';

import type { HostDocumentType, HostEventDto, HostEventType, HostMemberRole } from '@juandavidfuentes/indomitox-shared';
import {
  CalendarX,
  CheckCircle,
  FileArrowUp,
  MagnifyingGlass,
  PaperPlaneTilt,
  Prohibit,
  SealCheck,
  Sparkle,
  UserMinus,
  UserPlus,
  Warning,
  XCircle,
  type Icon,
} from '@phosphor-icons/react';
import { useFormatter, useTranslations } from 'next-intl';

const EVENT_ICONS: Record<HostEventType, Icon> = {
  CREATED: Sparkle,
  SUBMITTED: PaperPlaneTilt,
  REVIEW_STARTED: MagnifyingGlass,
  APPROVED: SealCheck,
  CHANGES_REQUESTED: Warning,
  REJECTED: XCircle,
  SUSPENDED: Prohibit,
  REINSTATED: CheckCircle,
  DOCUMENT_UPLOADED: FileArrowUp,
  DOCUMENT_APPROVED: CheckCircle,
  DOCUMENT_REJECTED: XCircle,
  DOCUMENT_EXPIRING: CalendarX,
  DOCUMENT_EXPIRED: CalendarX,
  MEMBER_JOINED: UserPlus,
  MEMBER_REMOVED: UserMinus,
};

const MEMBER_EVENTS = new Set<HostEventType>(['MEMBER_JOINED', 'MEMBER_REMOVED']);

/** Historial de la verificación (HOST-03, ADM-01): quién hizo qué, cuándo y por qué. */
export function Timeline({ events, title }: { events: HostEventDto[]; title?: string }) {
  const t = useTranslations();
  const format = useFormatter();
  if (events.length === 0) return null;

  const detail = (event: HostEventDto) => {
    if (!event.detail) return null;
    if (MEMBER_EVENTS.has(event.type)) return t(`hostRoles.${event.detail as HostMemberRole}`);
    return t(`hostDocuments.${event.detail as HostDocumentType}.title`);
  };

  return (
    <section aria-labelledby="timeline-title" className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 id="timeline-title" className="font-display text-2xl font-extrabold uppercase italic">
        {title ?? t('host.timeline')}
      </h2>
      <ol className="mt-5 grid gap-0">
        {events.map((event, index) => {
          const EventIcon = EVENT_ICONS[event.type];
          const extra = detail(event);
          return (
            <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
              {index < events.length - 1 ? (
                <span aria-hidden="true" className="absolute top-9 bottom-1 left-[17px] w-px bg-border" />
              ) : null}
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                <EventIcon size={18} weight="bold" aria-hidden="true" />
              </span>
              <div className="min-w-0 pt-1">
                <p className="leading-snug">
                  <span className="font-semibold">{event.actorName ?? t('hostEvents.system')}</span>{' '}
                  <span>{t(`hostEvents.${event.type}`)}</span>
                  {extra ? <span className="text-muted-foreground"> · {extra}</span> : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  <time dateTime={event.createdAt}>
                    {format.dateTime(new Date(event.createdAt), { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </p>
                {event.reason ? (
                  <p className="mt-2 rounded-md border-l-4 border-brand bg-muted px-3 py-2 text-sm whitespace-pre-line">
                    {event.reason}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
