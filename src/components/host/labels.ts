'use client';

import type { DocumentRequirement } from '@juandavidfuentes/indomitox-shared';
import { useTranslations } from 'next-intl';

/** Nombre de un deporte del catálogo (los creados por el administrador sin traducción: su clave). */
export function useSportName() {
  const t = useTranslations();
  return (key: string) => (t.has(`sports.${key}` as never) ? t(`sports.${key}` as never) : key);
}

/** "RUT" o "NTS · Rafting": el nombre de un requisito de documento. */
export function useRequirementLabel() {
  const t = useTranslations();
  const sportName = useSportName();
  return (requirement: Pick<DocumentRequirement, 'type' | 'sportKey'>) =>
    requirement.sportKey
      ? t('host.ntsFor', { sport: sportName(requirement.sportKey) })
      : t(`hostDocuments.${requirement.type}.title`);
}
