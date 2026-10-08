'use client';

import {
  availableListingActions,
  HOST_LISTING_FILTERS,
  type HostListingFilter,
  type HostListingResponse,
  type HostListingsResponse,
  type HostListingSummary,
  type ListingHostAction,
  type MyHostResponse,
} from '@juandavidfuentes/indomitox-shared';
import {
  Archive,
  ArrowCounterClockwise,
  CalendarDots,
  Copy,
  DotsThreeVertical,
  Package,
  Pause,
  PencilSimple,
  Play,
  Plus,
  Rocket,
  WarningCircle,
  type Icon,
} from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getPathname, Link, useRouter } from '@/i18n/navigation';
import type { routing } from '@/i18n/routing';
import { api } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';
import { LISTINGS_KEY, transitionListing, useHostListings, useStoreListing } from '@/lib/listings';
import { useSportName } from '@/lib/catalog';
import { ListingStatusBadge, useListingTitle, usePriceLabel, VisibilityNote } from './listing-labels';
import { ListingPhoto } from './listing-photo';
import { LISTING_TYPE_ICONS } from './listing-type-icon';
import { NewListingDialog } from './new-listing-dialog';

const ACTION_ICONS: Record<ListingHostAction, Icon> = {
  PUBLISH: Rocket,
  WITHDRAW: ArrowCounterClockwise,
  PAUSE: Pause,
  RESUME: Play,
  ARCHIVE: Archive,
  RESTORE: ArrowCounterClockwise,
};

/** Acciones rápidas de una tarjeta: cambiar el estado o duplicar (LIST-04, LIST-06). */
function CardActions({ item, onDone }: { item: HostListingSummary; onDone: () => void }) {
  const t = useTranslations();
  const errors = useErrorText();
  const router = useRouter();
  const storeListing = useStoreListing();
  const title = useListingTitle()(item.title);
  // Publicar se hace desde el editor, donde se ve lo que falta.
  const actions = availableListingActions(item.status).filter((action) => action !== 'PUBLISH');

  const run = async (action: ListingHostAction) => {
    try {
      storeListing(await transitionListing(item.id, action));
      toast.success(t(`listings.actionDone.${action}`));
      onDone();
    } catch (error) {
      toast.error(errors.api(error));
    }
  };

  const duplicate = async () => {
    try {
      const copy = await api<HostListingResponse>(`/v1/host/listings/${item.id}/duplicate`, { method: 'POST' });
      storeListing(copy);
      router.push({ pathname: '/panel/publicaciones/[id]', params: { id: copy.listing.id } });
    } catch (error) {
      toast.error(errors.api(error));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={t('listings.moreActions', { title })}>
          <DotsThreeVertical size={22} weight="bold" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {actions.map((action) => {
          const ActionIcon = ACTION_ICONS[action];
          return (
            <DropdownMenuItem key={action} onSelect={() => void run(action)} className="min-h-11">
              <ActionIcon size={18} aria-hidden="true" />
              {t(`listings.actions.${action}`)}
            </DropdownMenuItem>
          );
        })}
        {actions.length ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem onSelect={() => void duplicate()} className="min-h-11">
          <Copy size={18} aria-hidden="true" />
          {t('listings.duplicate')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ListingCardRow({ item, canManage, onChanged }: { item: HostListingSummary; canManage: boolean; onChanged: () => void }) {
  const t = useTranslations();
  const format = useFormatter();
  const listingTitle = useListingTitle();
  const priceLabel = usePriceLabel();
  const sportName = useSportName();
  const TypeIcon = LISTING_TYPE_ICONS[item.type];
  const title = listingTitle(item.title);

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow duration-200 hover:shadow-md">
      <ListingPhoto photo={item.cover} sizes="(min-width: 1280px) 22rem, (min-width: 640px) 45vw, 90vw" className="aspect-[16/10]" />
      <div className="absolute top-3 right-3">
        <ListingStatusBadge status={item.status} size="sm" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="flex items-center gap-1.5 font-display text-sm font-bold tracking-[0.12em] text-secondary uppercase">
          <TypeIcon size={16} weight="bold" aria-hidden="true" />
          {t(`listingType.${item.type}`)}
          {item.sportKeys[0] ? <span className="text-muted-foreground">· {sportName(item.sportKeys[0])}</span> : null}
        </p>
        <h3 className="line-clamp-2 font-display text-xl leading-tight font-bold uppercase [overflow-wrap:anywhere]">
          <Link
            href={{ pathname: '/panel/publicaciones/[id]', params: { id: item.id } }}
            className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
          >
            {title}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">
          {[item.municipalityName, priceLabel(item.basePriceMinor, item.priceUnit)].filter(Boolean).join(' · ')}
        </p>
        <p className="flex items-center gap-1.5 text-sm">
          {item.type === 'PRODUCT' ? (
            <>
              <Package size={18} className="text-muted-foreground" aria-hidden="true" />
              {t('listings.stockTotal', { count: item.totalStock ?? 0 })}
            </>
          ) : item.nextSlotAt ? (
            <>
              <CalendarDots size={18} className="text-muted-foreground" aria-hidden="true" />
              {t('listings.nextSlot', {
                date: format.dateTime(new Date(item.nextSlotAt), { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }),
                count: item.upcomingSlotCount,
              })}
            </>
          ) : item.type === 'RENTAL' ? (
            <>
              <CalendarDots size={18} className="text-muted-foreground" aria-hidden="true" />
              {t('listings.rentalAvailability')}
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-warning">
              <WarningCircle size={18} weight="fill" aria-hidden="true" />
              {t('listings.noSlots')}
            </span>
          )}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          {item.status === 'DRAFT' && !item.readyToPublish ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <PencilSimple size={18} aria-hidden="true" />
              {t('listings.incomplete')}
            </span>
          ) : (
            <VisibilityNote visibility={item.visibility} />
          )}
          {canManage ? (
            <div className="relative z-10">
              <CardActions item={item} onDone={onChanged} />
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/**
 * /panel/publicaciones: las publicaciones del Guía por estado, con su portada, el próximo horario
 * o el stock y si los Exploradores las ven. El filtro queda en la URL.
 */
export function ListingsView({
  mine,
  initial,
  initialFilter,
}: {
  mine: MyHostResponse;
  initial: HostListingsResponse;
  initialFilter: HostListingFilter;
}) {
  const t = useTranslations();
  const locale = useLocale() as (typeof routing.locales)[number];
  const errors = useErrorText();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<HostListingFilter>(initialFilter);
  const [creating, setCreating] = useState(false);
  const list = useHostListings(filter, filter === initialFilter ? initial : undefined);
  const canManage = mine.permissions.includes('listings.manage');
  const counts = list.data?.counts ?? initial.counts;
  const total = counts.DRAFT + counts.IN_MODERATION + counts.PUBLISHED + counts.PAUSED;

  useEffect(() => {
    const href = getPathname({ locale, href: { pathname: '/panel/publicaciones', query: filter === 'ALL' ? {} : { estado: filter } } });
    window.history.replaceState(null, '', href);
  }, [locale, filter]);

  const countFor = (value: HostListingFilter) => (value === 'ALL' ? total : counts[value]);
  const items = list.data?.items ?? [];

  return (
    <section aria-labelledby="listings-title" className="grid grid-cols-1 gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="listings-title" className="font-display text-4xl leading-tight font-extrabold uppercase italic">
            {t('listings.title')}
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t('listings.subtitle')}</p>
        </div>
        {canManage ? (
          <Button type="button" size="lg" onClick={() => setCreating(true)}>
            <Plus weight="bold" aria-hidden="true" />
            {t('listings.new')}
          </Button>
        ) : null}
      </div>

      {mine.host.status !== 'APPROVED' ? (
        <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-4 font-medium">
          <WarningCircle size={22} weight="fill" className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
          {t('host.publishBlocked')}
        </p>
      ) : null}

      <div role="group" aria-label={t('common.status')} className="flex flex-wrap gap-2">
        {HOST_LISTING_FILTERS.map((value) => {
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(value)}
              className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors duration-150 ${
                active ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'
              }`}
            >
              {value === 'ALL' ? t('listings.filterAll') : t(`listingStatus.${value}`)}
              <span className={`tabular-nums ${active ? '' : 'text-muted-foreground'}`}>{countFor(value)}</span>
            </button>
          );
        })}
      </div>

      {list.isError ? (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 font-medium text-destructive">
          {errors.api(list.error)}{' '}
          <Button type="button" variant="link" className="h-auto p-0" onClick={() => void list.refetch()}>
            {t('common.retry')}
          </Button>
        </p>
      ) : list.isPending ? (
        <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
          ))}
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
          <Rocket size={44} weight="duotone" className="text-primary" aria-hidden="true" />
          <p className="font-display text-2xl font-extrabold uppercase italic">{filter === 'ALL' ? t('listings.emptyTitle') : t('listings.emptyFilter')}</p>
          {filter === 'ALL' ? <p className="max-w-md text-muted-foreground">{t('listings.emptyBody')}</p> : null}
          {canManage && filter === 'ALL' ? (
            <Button type="button" onClick={() => setCreating(true)}>
              <Plus weight="bold" aria-hidden="true" />
              {t('listings.new')}
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ListingCardRow
              key={item.id}
              item={item}
              canManage={canManage}
              onChanged={() => void queryClient.invalidateQueries({ queryKey: LISTINGS_KEY })}
            />
          ))}
        </ul>
      )}
      {creating ? <NewListingDialog open onOpenChange={setCreating} /> : null}
    </section>
  );
}
