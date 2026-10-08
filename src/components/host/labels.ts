'use client';

import type { DocumentRequirement } from '@juandavidfuentes/indomitox-shared';
import { useTranslations } from 'next-intl';
import { useSportName } from '@/lib/catalog';

export { useSportName };

/** "RUT" o "NTS · Rafting": el nombre de un requisito de documento. */
export function useRequirementLabel() {
  const t = useTranslations();
  const sportName = useSportName();
  return (requirement: Pick<DocumentRequirement, 'type' | 'sportKey'>) =>
    requirement.sportKey
      ? t('host.ntsFor', { sport: sportName(requirement.sportKey) })
      : t(`hostDocuments.${requirement.type}.title`);
}
