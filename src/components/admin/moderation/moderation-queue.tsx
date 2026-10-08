'use client';

import {
  ADMIN_LISTING_FILTERS,
  type AdminListingFilter,
  type AdminListingItem,
  type AdminListingsResponse,
} from '@juandavidfuentes/indomitox-shared';
import { CaretRight, CheckCircle, MagnifyingGlass } from '@phosphor-icons/react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { ListingPhoto } from '@/components/listings/listing-photo';
import { ListingStatusBadge, useListingTitle, VisibilityNote } from '@/components/listings/listing-labels';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { getPathname, Link } from '@/i18n/navigation';
import type { routing } from '@/i18n/routing';
import { api } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';

export const ADMIN_LISTINGS_KEY = ['admin', 'listings'] as const;

/** ADM-02: interruptor de la aprobación previa (queda versionado y en la auditoría). */
function PreModerationToggle({ enabled }: { enabled: boolean }) {
  const t = useTranslations('moderation');
  const errors = useErrorText();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const id = useId();

  const change = async (next: boolean) => {
    setSaving(true);
    try {
      await api('/v1/admin/moderation/settings', { method: 'PUT', body: { requirePreModeration: next } });
      setValue(next);
      toast.success(next ? t('preModerationOn') : t('preModerationOff'));
      void queryClient.invalidateQueries({ queryKey: ADMIN_LISTINGS_KEY });
    } catch (error) {
      toast.error(errors.api(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <Checkbox id={id} checked={value} disabled={saving} onCheckedChange={(checked) => void change(checked === true)} className="mt-1" />
      <div>
        <label htmlFor={id} className="cursor-pointer font-semibold">
          {t('preModeration')}
        </label>
        <p className="text-sm text-muted-foreground">{t('preModerationHint')}</p>
      </div>
      {saving ? <Spinner aria-hidden="true" className="mt-1" /> : null}
    </div>
  );
}

/** Moderación de publicaciones (ADM-02): cola de aprobación, ocultas y bloqueadas por documentos. */
export function ModerationQueue({ initial, initialStatus, initialQuery }: { initial: AdminListingsResponse; initialStatus: AdminListingFilter; initialQuery: string }) {
  const t = useTranslations();
  const format = useFormatter();
  const errors = useErrorText();
  const listingTitle = useListingTitle();
  const locale = useLocale() as (typeof routing.locales)[number];
  const searchId = useId();
  const [status, setStatus] = useState<AdminListingFilter>(initialStatus);
  const [search, setSearch] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const href = getPathname({
      locale,
      href: { pathname: '/admin/moderacion', query: { ...(status !== 'MODERATION' ? { estado: status } : {}), ...(query ? { q: query } : {}) } },
    });
    window.history.replaceState(null, '', href);
  }, [locale, status, query]);

  const list = useInfiniteQuery({
    queryKey: [...ADMIN_LISTINGS_KEY, status, query],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ status, ...(query ? { q: query } : {}), ...(pageParam ? { cursor: pageParam } : {}) });
      return api<AdminListingsResponse>(`/v1/admin/listings?${params}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    initialData: status === initialStatus && query === initialQuery ? { pages: [initial], pageParams: [null] } : undefined,
    staleTime: 15_000,
  });

  const first = list.data?.pages[0] ?? initial;
  const items: AdminListingItem[] = list.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <section aria-labelledby="moderation-title" className="grid grid-cols-1 gap-6">
      <div>
        <h2 id="moderation-title" className="font-display text-4xl leading-tight font-extrabold uppercase italic">
          {t('moderation.title')}
        </h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">{t('moderation.subtitle')}</p>
      </div>
      <PreModerationToggle enabled={initial.requirePreModeration} />
      <div className="grid gap-4">
        <div role="group" aria-label={t('common.status')} className="flex flex-wrap gap-2">
          {ADMIN_LISTING_FILTERS.map((filter) => {
            const active = status === filter;
            return (
              <button
                key={filter}
                type="button"
                aria-pressed={active}
                onClick={() => setStatus(filter)}
                className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors duration-150 ${
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'
                }`}
              >
                {t(`moderation.filters.${filter}`)}
                <span className={`tabular-nums ${active ? '' : 'text-muted-foreground'}`}>{first.counts[filter]}</span>
              </button>
            );
          })}
        </div>
        <div className="relative max-w-md">
          <label htmlFor={searchId} className="sr-only">
            {t('common.search')}
          </label>
          <MagnifyingGlass size={20} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id={searchId} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('moderation.searchPlaceholder')} className="pl-10" />
        </div>
      </div>

      {list.isError ? (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 font-medium text-destructive">
          {errors.api(list.error)}{' '}
          <Button type="button" variant="link" className="h-auto p-0" onClick={() => void list.refetch()}>
            {t('common.retry')}
          </Button>
        </p>
      ) : list.isPending ? (
        <div role="status" className="grid gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
          <CheckCircle size={40} weight="duotone" className="text-success" aria-hidden="true" />
          <p className="font-semibold">{status === 'MODERATION' && !query ? t('moderation.emptyQueue') : t('admin.empty')}</p>
        </div>
      ) : (
        <>
          <ul className="grid gap-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={{ pathname: '/admin/moderacion/[id]', params: { id: item.id } }}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition-colors duration-150 hover:bg-muted"
                >
                  <ListingPhoto photo={item.cover} sizes="6rem" className="aspect-[4/3] w-24 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold [overflow-wrap:anywhere]">{listingTitle(item.title)}</p>
                    <p className="text-sm text-muted-foreground">
                      {[item.hostName, t(`listingType.${item.type}`), item.municipalityName].filter(Boolean).join(' · ')}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <ListingStatusBadge status={item.status} size="sm" />
                      <VisibilityNote visibility={item.visibility} />
                      {item.submittedAt && item.status === 'IN_MODERATION' ? (
                        <span className="text-xs text-muted-foreground">
                          {t('moderation.submittedOn', { date: format.dateTime(new Date(item.submittedAt), { dateStyle: 'medium', timeStyle: 'short' }) })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <CaretRight size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          {list.hasNextPage ? (
            <Button type="button" variant="outline" className="justify-self-center" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
              {list.isFetchingNextPage ? <Spinner aria-hidden="true" /> : null}
              {t('common.loadMore')}
            </Button>
          ) : null}
        </>
      )}
    </section>
  );
}
