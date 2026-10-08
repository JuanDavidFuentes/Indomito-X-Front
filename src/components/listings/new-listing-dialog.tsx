'use client';

import { LISTING_TYPES, type HostListingResponse, type ListingType } from '@juandavidfuentes/indomitox-shared';
import { ArrowRight } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { ChoiceCards } from '@/components/host/onboarding/choice-cards';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';
import { useStoreListing } from '@/lib/listings';
import { LISTING_TYPE_ICONS } from './listing-type-icon';

/** Elegir el tipo (no cambia después) y abrir el editor del borrador nuevo. */
export function NewListingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations();
  const errors = useErrorText();
  const router = useRouter();
  const storeListing = useStoreListing();
  const [type, setType] = useState<ListingType | null>(null);
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!type) return;
    setCreating(true);
    try {
      const created = await api<HostListingResponse>('/v1/host/listings', { method: 'POST', body: { type } });
      storeListing(created);
      router.push({ pathname: '/panel/publicaciones/[id]', params: { id: created.listing.id } });
    } catch (error) {
      toast.error(errors.api(error));
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-extrabold uppercase italic">{t('listings.newTitle')}</DialogTitle>
          <DialogDescription>{t('listings.newHint')}</DialogDescription>
        </DialogHeader>
        <ChoiceCards
          legend={t('listings.typeLegend')}
          value={type}
          onChange={setType}
          choices={LISTING_TYPES.map((value) => ({
            value,
            icon: LISTING_TYPE_ICONS[value],
            title: t(`listingType.${value}`),
            hint: t(`listings.typeHints.${value}`),
          }))}
        />
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="button" disabled={!type || creating} onClick={() => void create()}>
            {creating ? <Spinner aria-hidden="true" /> : null}
            {t('listings.create')}
            <ArrowRight weight="bold" aria-hidden="true" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
