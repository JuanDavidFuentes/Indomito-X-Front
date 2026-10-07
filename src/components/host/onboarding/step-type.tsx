'use client';

import type { HostLegalType } from '@juandavidfuentes/indomitox-shared';
import { Buildings, Compass, Storefront, User } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { useErrorText } from '@/lib/forms';
import { useHostAutosave } from '@/lib/host';
import { AutosaveIndicator, LockedNotice } from '../autosave-indicator';
import { ChoiceCards } from './choice-cards';
import { useHostEditing, type StepProps } from './use-editing';

/** Paso 1: persona natural o jurídica, y si presta servicios turísticos o solo vende productos (HOST-06). */
export function StepType({ mine }: StepProps) {
  const t = useTranslations();
  const errors = useErrorText();
  const { can, lockedReason } = useHostEditing(mine);
  const autosave = useHostAutosave({ onError: (error) => toast.error(errors.api(error)) });
  const [legalType, setLegalType] = useState<HostLegalType | null>(mine.host.legalType);
  const [offers, setOffers] = useState<'services' | 'products'>(mine.host.offersTourismServices ? 'services' : 'products');
  const editable = can('type');
  const locked = lockedReason('type');

  return (
    <div className="grid gap-8">
      <AutosaveIndicator status={autosave.status} />
      {locked ? <LockedNotice>{locked}</LockedNotice> : null}
      <ChoiceCards<HostLegalType>
        legend={t('host.legalTypeTitle')}
        value={legalType}
        disabled={!editable}
        onChange={(value) => {
          setLegalType(value);
          autosave.queue({ legalType: value }, true);
        }}
        choices={[
          { value: 'NATURAL_PERSON', icon: User, title: t('hostLegalTypes.NATURAL_PERSON'), hint: t('hostLegalTypeHints.NATURAL_PERSON') },
          { value: 'LEGAL_ENTITY', icon: Buildings, title: t('hostLegalTypes.LEGAL_ENTITY'), hint: t('hostLegalTypeHints.LEGAL_ENTITY') },
        ]}
      />
      <ChoiceCards<'services' | 'products'>
        legend={t('host.offersTitle')}
        value={offers}
        disabled={!editable}
        onChange={(value) => {
          setOffers(value);
          autosave.queue({ offersTourismServices: value === 'services' }, true);
        }}
        choices={[
          { value: 'services', icon: Compass, title: t('host.offersServices'), hint: t('host.offersServicesHint') },
          { value: 'products', icon: Storefront, title: t('host.offersProductsOnly'), hint: t('host.offersProductsOnlyHint') },
        ]}
      />
    </div>
  );
}
