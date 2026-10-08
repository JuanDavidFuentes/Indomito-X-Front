'use client';

import {
  formatMoney,
  pickLocalized,
  type ListingStatus,
  type ListingVisibility,
  type Locale,
  type LocalizedText,
  type PriceUnit,
} from '@juandavidfuentes/indomitox-shared';
import { Archive, Eye, EyeSlash, Hourglass, PauseCircle, PencilSimple, Prohibit, Broadcast, type Icon } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<Tone, string> = {
  neutral: 'bg-muted text-foreground ring-1 ring-border',
  info: 'bg-secondary text-secondary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  danger: 'bg-destructive text-destructive-foreground',
};

const STATUS: Record<ListingStatus, { icon: Icon; tone: Tone }> = {
  DRAFT: { icon: PencilSimple, tone: 'neutral' },
  IN_MODERATION: { icon: Hourglass, tone: 'info' },
  PUBLISHED: { icon: Broadcast, tone: 'success' },
  PAUSED: { icon: PauseCircle, tone: 'warning' },
  ARCHIVED: { icon: Archive, tone: 'neutral' },
};

/** Estado de una publicación con ícono y texto (nunca solo color). */
export function ListingStatusBadge({ status, size = 'md' }: { status: ListingStatus; size?: 'sm' | 'md' }) {
  const t = useTranslations('listingStatus');
  const { icon: BadgeIcon, tone } = STATUS[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${TONES[tone]} ${
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      }`}
    >
      <BadgeIcon size={size === 'sm' ? 14 : 16} weight="bold" aria-hidden="true" />
      {t(status)}
    </span>
  );
}

const VISIBILITY: Record<ListingVisibility, { icon: Icon; className: string }> = {
  PUBLIC: { icon: Eye, className: 'text-success' },
  NOT_PUBLISHED: { icon: EyeSlash, className: 'text-muted-foreground' },
  HIDDEN_BY_ADMIN: { icon: Prohibit, className: 'text-destructive' },
  BLOCKED: { icon: Prohibit, className: 'text-warning' },
};

/** Si los Exploradores la ven o no, y por qué. */
export function VisibilityNote({ visibility }: { visibility: ListingVisibility }) {
  const t = useTranslations('listingVisibility');
  const { icon: VisibilityIcon, className } = VISIBILITY[visibility];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${className}`}>
      <VisibilityIcon size={18} weight="bold" aria-hidden="true" />
      {t(visibility)}
    </span>
  );
}

/** Título en el idioma de la interfaz (o el original) o "Sin título". */
export function useListingTitle() {
  const t = useTranslations('listings');
  const locale = useLocale() as Locale;
  return (title: LocalizedText) => pickLocalized(title, locale)?.text || t('untitled');
}

/** "$80.000 por persona" con el formato del idioma (o "Sin precio"). */
export function usePriceLabel() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  return (minor: number | null, unit: PriceUnit) =>
    minor === null ? t('listings.noPrice') : `${formatMoney(minor, 'COP', locale)} ${t(`priceUnit.${unit}`)}`;
}
