import type { HostDocumentStatus, HostStatus, RequirementState } from '@juandavidfuentes/indomitox-shared';
import {
  ArrowsClockwise,
  CheckCircle,
  Clock,
  FileDashed,
  MagnifyingGlass,
  PaperPlaneTilt,
  PencilSimple,
  Prohibit,
  SealCheck,
  Warning,
  XCircle,
} from '@phosphor-icons/react/ssr';
import type { Icon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Insignias sólidas: el contraste se cumple en ambos temas (token + su "-foreground"). */
const TONES: Record<Tone, string> = {
  neutral: 'bg-muted text-foreground ring-1 ring-border',
  info: 'bg-secondary text-secondary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  danger: 'bg-destructive text-destructive-foreground',
};

const HOST_STATUS: Record<HostStatus, { icon: Icon; tone: Tone }> = {
  DRAFT: { icon: PencilSimple, tone: 'neutral' },
  SUBMITTED: { icon: PaperPlaneTilt, tone: 'info' },
  IN_REVIEW: { icon: MagnifyingGlass, tone: 'info' },
  APPROVED: { icon: SealCheck, tone: 'success' },
  CHANGES_REQUESTED: { icon: Warning, tone: 'warning' },
  REJECTED: { icon: XCircle, tone: 'danger' },
  SUSPENDED: { icon: Prohibit, tone: 'danger' },
};

const DOCUMENT_STATE: Record<RequirementState | HostDocumentStatus, { icon: Icon; tone: Tone }> = {
  MISSING: { icon: FileDashed, tone: 'neutral' },
  PENDING: { icon: Clock, tone: 'info' },
  APPROVED: { icon: CheckCircle, tone: 'success' },
  REJECTED: { icon: XCircle, tone: 'danger' },
  EXPIRED: { icon: Warning, tone: 'warning' },
  REPLACED: { icon: ArrowsClockwise, tone: 'neutral' },
};

function Badge({ icon: BadgeIcon, tone, label, size }: { icon: Icon; tone: Tone; label: string; size: 'sm' | 'md' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${TONES[tone]} ${
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      }`}
    >
      <BadgeIcon size={size === 'sm' ? 14 : 16} weight="bold" aria-hidden="true" />
      {label}
    </span>
  );
}

/** Estado de verificación del Guía con ícono y texto (HOST-03; nunca solo color). */
export function HostStatusBadge({ status, size = 'md' }: { status: HostStatus; size?: 'sm' | 'md' }) {
  const t = useTranslations('hostStatus');
  return <Badge {...HOST_STATUS[status]} label={t(status)} size={size} />;
}

export function DocumentStateBadge({
  state,
  size = 'sm',
}: {
  state: RequirementState | HostDocumentStatus;
  size?: 'sm' | 'md';
}) {
  const t = useTranslations('documentStatus');
  return <Badge {...DOCUMENT_STATE[state]} label={t(state)} size={size} />;
}
