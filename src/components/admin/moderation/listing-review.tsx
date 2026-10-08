'use client';

import type { AdminListingDetail, ListingAdminAction } from '@juandavidfuentes/indomitox-shared';
import { ArrowLeft, CheckCircle, Eye, Prohibit, Warning, type Icon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { HostStatusBadge } from '@/components/host/status-badge';
import { ListingStatusBadge, VisibilityNote } from '@/components/listings/listing-labels';
import { ListingSummary } from '@/components/listings/listing-summary';
import { ListingTimeline } from '@/components/listings/listing-timeline';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { ReasonDialog } from '../reason-dialog';
import { ADMIN_LISTINGS_KEY } from './moderation-queue';

const ACTIONS: Record<ListingAdminAction, { icon: Icon; reasonRequired: boolean; danger: boolean; variant: 'default' | 'outline' | 'danger' }> = {
  APPROVE: { icon: CheckCircle, reasonRequired: false, danger: false, variant: 'default' },
  REJECT: { icon: Warning, reasonRequired: true, danger: false, variant: 'outline' },
  HIDE: { icon: Prohibit, reasonRequired: true, danger: true, variant: 'danger' },
  UNHIDE: { icon: Eye, reasonRequired: false, danger: false, variant: 'outline' },
};

/** Revisión de una publicación (ADM-02): la vista del Explorador, el Guía, el historial y las decisiones. */
export function ListingReview({ initial }: { initial: AdminListingDetail }) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState(initial);
  const [action, setAction] = useState<ListingAdminAction | null>(null);
  const { listing, host } = detail;

  const decide = async (chosen: ListingAdminAction, reason: string | undefined) => {
    const result = await api<AdminListingDetail>(`/v1/admin/listings/${listing.id}/decision`, { method: 'POST', body: { action: chosen, reason } });
    setDetail(result);
    void queryClient.invalidateQueries({ queryKey: ADMIN_LISTINGS_KEY });
    toast.success(t(`moderation.done.${chosen}`));
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <Link href="/admin/moderacion" className="inline-flex min-h-11 items-center gap-2 justify-self-start font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={18} aria-hidden="true" />
        {t('moderation.back')}
      </Link>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-xl border border-border bg-card p-5 sm:p-8">
          <ListingSummary listing={listing} />
        </section>
        <aside className="grid content-start gap-4">
          <section className="grid gap-3 rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <ListingStatusBadge status={listing.status} />
            </div>
            <VisibilityNote visibility={listing.visibility} />
            {listing.adminHidden?.reason ? (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm">
                <span className="font-semibold">{t('admin.reason')}:</span> {listing.adminHidden.reason}
              </p>
            ) : null}
            <div className="grid gap-2">
              {detail.availableActions.length ? (
                detail.availableActions.map((option) => {
                  const config = ACTIONS[option];
                  const ActionIcon = config.icon;
                  return (
                    <Button key={option} type="button" variant={config.variant} className="justify-start" onClick={() => setAction(option)}>
                      <ActionIcon size={18} aria-hidden="true" />
                      {t(`moderation.actions.${option}`)}
                    </Button>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">{t('admin.noActions')}</p>
              )}
            </div>
            {!detail.progress.readyToPublish ? <p className="text-sm text-warning">{t('moderation.incomplete')}</p> : null}
          </section>
          <section className="grid gap-2 rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-xl font-bold uppercase">{t('moderation.host')}</h2>
            <p className="font-semibold">{host.name ?? t('admin.unnamed')}</p>
            <HostStatusBadge status={host.status} size="sm" />
            {host.rntNumber ? <p className="text-sm">{t('guide.rnt', { number: host.rntNumber })}</p> : null}
            <Link href={{ pathname: '/admin/guias/[id]', params: { id: host.id } }} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
              {t('moderation.viewHost')}
            </Link>
          </section>
        </aside>
      </div>
      <ListingTimeline events={detail.events} />
      {action ? (
        <ReasonDialog
          open
          title={t(`moderation.actions.${action}`)}
          description={t(`moderation.actionHints.${action}`)}
          confirmLabel={t(`moderation.actions.${action}`)}
          danger={ACTIONS[action].danger}
          reasonRequired={ACTIONS[action].reasonRequired}
          onConfirm={(reason) => decide(action, reason)}
          onOpenChange={(open) => !open && setAction(null)}
        />
      ) : null}
    </div>
  );
}
