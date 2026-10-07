'use client';

import {
  canEditHostSection,
  hostCan,
  SUPPORT_EMAIL,
  type HostPermission,
  type HostSection,
  type MyHostResponse,
  type SportDto,
} from '@juandavidfuentes/indomitox-shared';
import { useTranslations } from 'next-intl';

export interface StepProps {
  mine: MyHostResponse;
  sports: SportDto[];
}

const SECTION_PERMISSION: Partial<Record<HostSection, HostPermission>> = {
  documents: 'documents.manage',
  payout: 'payout.manage',
};

/**
 * ¿Se puede editar este grupo de datos? Depende del estado del alta (HOST-03) y del rol en el
 * equipo (HOST-07). Si no, el motivo para mostrarlo junto al bloque.
 */
export function useHostEditing(mine: MyHostResponse) {
  const t = useTranslations('host');
  const { status } = mine.host;

  const allowedByRole = (section: HostSection) => hostCan(mine.role, SECTION_PERMISSION[section] ?? 'host.edit');
  const can = (section: HostSection) => allowedByRole(section) && canEditHostSection(status, section);
  const lockedReason = (section: HostSection): string | null => {
    if (can(section)) return null;
    if (!allowedByRole(section)) return t('lockedRole');
    if (status === 'APPROVED' || status === 'SUSPENDED') return t('lockedApproved', { email: SUPPORT_EMAIL });
    return t('lockedReview');
  };
  return { can, lockedReason };
}
