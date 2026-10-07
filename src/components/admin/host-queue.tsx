'use client';

import {
  ADMIN_HOST_FILTERS,
  departmentName,
  type AdminHostFilter,
  type AdminHostListItem,
  type AdminHostListResponse,
} from '@juandavidfuentes/indomitox-shared';
import { CaretRight, CheckCircle, FileMagnifyingGlass, MagnifyingGlass } from '@phosphor-icons/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { HostStatusBadge } from '@/components/host/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { getPathname, Link } from '@/i18n/navigation';
import type { routing } from '@/i18n/routing';
import { api } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';

function useFilterLabel() {
  const t = useTranslations();
  return (filter: AdminHostFilter) => (filter === 'QUEUE' ? t('admin.queue') : t(`hostStatus.${filter}`));
}

function PendingDocs({ count }: { count: number }) {
  const t = useTranslations('admin');
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${count ? 'text-foreground' : 'text-muted-foreground'}`}>
      {count ? <FileMagnifyingGlass size={18} className="text-secondary" aria-hidden="true" /> : <CheckCircle size={18} aria-hidden="true" />}
      {t('pendingDocuments', { count })}
    </span>
  );
}

/**
 * Cola de verificación (ADM-01): por defecto, lo que espera revisión (lo más antiguo primero).
 * El filtro y la búsqueda quedan en la URL; la lista se carga por páginas (cursor).
 */
export function HostQueue({
  initial,
  initialStatus,
  initialQuery,
}: {
  initial: AdminHostListResponse;
  initialStatus: AdminHostFilter;
  initialQuery: string;
}) {
  const t = useTranslations();
  const format = useFormatter();
  const errors = useErrorText();
  const filterLabel = useFilterLabel();
  const locale = useLocale() as (typeof routing.locales)[number];
  const searchId = useId();
  const [status, setStatus] = useState<AdminHostFilter>(initialStatus);
  const [search, setSearch] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);

  // Búsqueda con espera corta: no consulta en cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // El filtro queda en la URL (compartible y se conserva al volver) sin volver a pedir la página.
  useEffect(() => {
    const href = getPathname({
      locale,
      href: { pathname: '/admin/guias', query: { ...(status !== 'QUEUE' ? { status } : {}), ...(query ? { q: query } : {}) } },
    });
    window.history.replaceState(null, '', href);
  }, [locale, status, query]);

  const list = useInfiniteQuery({
    queryKey: ['admin', 'hosts', status, query],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ status, ...(query ? { q: query } : {}), ...(pageParam ? { cursor: pageParam } : {}) });
      return api<AdminHostListResponse>(`/v1/admin/hosts?${params}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    initialData:
      status === initialStatus && query === initialQuery ? { pages: [initial], pageParams: [null] } : undefined,
    staleTime: 15_000,
  });

  const counts = list.data?.pages[0]?.counts ?? initial.counts;
  const queueCount = list.data?.pages[0]?.queueCount ?? initial.queueCount;
  const items: AdminHostListItem[] = list.data?.pages.flatMap((page) => page.items) ?? [];
  const location = (item: AdminHostListItem) =>
    [item.city, departmentName(item.department)].filter(Boolean).join(', ') || t('common.notProvided');
  const name = (item: AdminHostListItem) => item.tradeName ?? item.legalName ?? t('admin.unnamed');
  const submitted = (item: AdminHostListItem) =>
    item.submittedAt ? format.dateTime(new Date(item.submittedAt), { dateStyle: 'medium' }) : '—';

  return (
    <section aria-labelledby="hosts-title" className="grid grid-cols-1 gap-6">
      <div>
        <h2 id="hosts-title" className="font-display text-4xl leading-tight font-extrabold uppercase italic">
          {t('admin.hostsTitle')}
        </h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">{t('admin.hostsHint')}</p>
      </div>

      <div className="grid gap-4">
        <div role="group" aria-label={t('common.status')} className="flex flex-wrap gap-2">
          {ADMIN_HOST_FILTERS.map((filter) => {
            const count = filter === 'QUEUE' ? queueCount : counts[filter];
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
                {filterLabel(filter)}
                <span className={`tabular-nums ${active ? '' : 'text-muted-foreground'}`}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative max-w-md">
          <label htmlFor={searchId} className="sr-only">
            {t('common.search')}
          </label>
          <MagnifyingGlass size={20} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id={searchId}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('admin.searchPlaceholder')}
            className="pl-10"
          />
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
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
          <CheckCircle size={40} weight="duotone" className="text-success" aria-hidden="true" />
          <p className="font-semibold">{status === 'QUEUE' && !query ? t('admin.emptyQueue') : t('admin.empty')}</p>
        </div>
      ) : (
        <>
          {/* Escritorio: tabla densa. */}
          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('admin.columns.host')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('admin.columns.owner')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('admin.columns.location')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('admin.columns.status')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('admin.columns.documents')}</th>
                  <th scope="col" className="px-4 py-3 font-semibold">{t('admin.columns.submitted')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors duration-150 hover:bg-muted/60">
                    <td className="px-4 py-3">
                      <Link
                        href={{ pathname: '/admin/guias/[id]', params: { id: item.id } }}
                        className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
                      >
                        {name(item)}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.legalType ? t(`hostLegalTypes.${item.legalType}`) : '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{item.ownerName ?? '—'}</p>
                      <p className="text-xs break-all text-muted-foreground">{item.ownerEmail}</p>
                    </td>
                    <td className="px-4 py-3">{location(item)}</td>
                    <td className="px-4 py-3">
                      <HostStatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <PendingDocs count={item.pendingDocuments} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">{submitted(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Teléfono: tarjetas. */}
          <ul className="grid gap-3 md:hidden">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={{ pathname: '/admin/guias/[id]', params: { id: item.id } }}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors duration-150 hover:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{name(item)}</p>
                    <p className="text-sm text-muted-foreground">{location(item)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <HostStatusBadge status={item.status} size="sm" />
                      <PendingDocs count={item.pendingDocuments} />
                    </div>
                  </div>
                  <CaretRight size={20} className="mt-1 shrink-0 text-muted-foreground" aria-hidden="true" />
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
