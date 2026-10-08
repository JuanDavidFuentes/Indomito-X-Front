'use client';

import {
  canEditListing,
  isServiceListing,
  listingSteps,
  type HostListingResponse,
  type ListingHostAction,
  type ListingStep,
  type MyHostResponse,
  type PublishBlocker,
  type SportDto,
} from '@juandavidfuentes/indomitox-shared';
import {
  Archive,
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  DotsThreeVertical,
  Hourglass,
  Pause,
  Play,
  Rocket,
  ShieldWarning,
  WarningCircle,
} from '@phosphor-icons/react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ReasonBox } from '@/components/host/summary';
import { useRequirementLabel, useSportName } from '@/components/host/labels';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { getPathname, Link, useRouter } from '@/i18n/navigation';
import type { routing } from '@/i18n/routing';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { useErrorText } from '@/lib/forms';
import { transitionListing, useListing, useStoreListing } from '@/lib/listings';
import { ListingStatusBadge, useListingTitle, VisibilityNote } from '../listing-labels';
import { ListingTimeline } from '../listing-timeline';
import { LISTING_TYPE_ICONS } from '../listing-type-icon';
import { StepAvailability } from './step-availability';
import { StepBasics } from './step-basics';
import { StepDetails } from './step-details';
import { StepLocation } from './step-location';
import { StepPhotos } from './step-photos';
import { StepPricing } from './step-pricing';
import { StepProduct } from './step-product';
import type { StepProps } from './step-props';

/** Requisito ("RNT" o "NTS_CERTIFICATE:RAFTING") → su nombre. */
function useBlockerRequirement() {
  const requirementLabel = useRequirementLabel();
  return (id: string) => {
    const [type, sportKey] = id.split(':') as [Parameters<typeof requirementLabel>[0]['type'], string | undefined];
    return requirementLabel({ type, sportKey: sportKey ?? null });
  };
}

/** Lo que impide publicar, con el camino para resolverlo (ir al paso o a la verificación). */
function Blockers({ blockers, onGoTo }: { blockers: PublishBlocker[]; onGoTo: (step: ListingStep) => void }) {
  const t = useTranslations();
  const requirement = useBlockerRequirement();
  const sportName = useSportName();
  return (
    <section aria-labelledby="blockers-title" className="grid gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
      <h3 id="blockers-title" className="flex items-center gap-2 font-semibold">
        <WarningCircle size={20} weight="fill" className="text-warning" aria-hidden="true" />
        {t('listings.editor.blockersTitle')}
      </h3>
      <ul className="grid gap-2 text-sm">
        {blockers.map((blocker) => {
          if (blocker.code === 'INCOMPLETE') {
            return (
              <li key="incomplete" className="flex flex-wrap items-center gap-2">
                {t('listings.editor.incompleteSteps')}
                {blocker.steps.map((step) => (
                  <Button key={step} type="button" variant="outline" size="sm" onClick={() => onGoTo(step)}>
                    {t(`listings.steps.${step}.label`)}
                  </Button>
                ))}
              </li>
            );
          }
          if (blocker.code === 'HOST_NOT_APPROVED') {
            return (
              <li key="host">
                {t('listingBlock.HOST_NOT_APPROVED')}{' '}
                <Link href="/panel/verificacion" className="font-semibold text-primary underline-offset-4 hover:underline">
                  {t('listings.editor.goToVerification')}
                </Link>
              </li>
            );
          }
          if (blocker.code === 'DOCUMENTS_NOT_VALID') {
            return (
              <li key="documents">
                {t('listingBlock.DOCUMENTS_NOT_VALID', { documents: blocker.requirementIds.map(requirement).join(', ') })}{' '}
                <Link href="/panel/verificacion" className="font-semibold text-primary underline-offset-4 hover:underline">
                  {t('listings.editor.goToDocuments')}
                </Link>
              </li>
            );
          }
          return (
            <li key="sports">
              {t('listingBlock.SPORT_NOT_OFFERED', { sports: blocker.sportKeys.map(sportName).join(', ') })}{' '}
              <Link href={{ pathname: '/panel/verificacion', query: { step: 'company' } }} className="font-semibold text-primary underline-offset-4 hover:underline">
                {t('listings.fields.sportsAddMore')}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const ACTIONS = {
  PUBLISH: Rocket,
  WITHDRAW: ArrowCounterClockwise,
  PAUSE: Pause,
  RESUME: Play,
  ARCHIVE: Archive,
  RESTORE: ArrowCounterClockwise,
} as const satisfies Record<ListingHostAction, unknown>;

/** La acción principal según el estado (un solo botón destacado por pantalla, MASTER §9). */
const PRIMARY: ListingHostAction[] = ['PUBLISH', 'RESUME', 'RESTORE', 'WITHDRAW'];

/**
 * Editor de una publicación (LIST-01 a LIST-07): encabezado con el estado, lo que falta y las
 * acciones; pasos con autoguardado (el paso queda en la URL, `?step=`). Quien no gestiona
 * publicaciones (el operador) la ve sin poder cambiarla, salvo la disponibilidad.
 */
export function ListingEditor({ initial, mine, catalog }: { initial: HostListingResponse; mine: MyHostResponse; catalog: SportDto[] }) {
  const t = useTranslations();
  const locale = useLocale() as (typeof routing.locales)[number];
  const errors = useErrorText();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeListing = useStoreListing();
  const listingTitle = useListingTitle();
  const heading = useRef<HTMLHeadingElement>(null);
  const { data } = useListing(initial.listing.id, initial);
  const { listing, progress, blockers, actions, preModeration } = data;
  const steps = listingSteps(listing.type);
  const [step, setStep] = useState<ListingStep>(() => {
    const requested = searchParams.get('step') as ListingStep | null;
    if (requested && steps.includes(requested)) return requested;
    return steps.find((s) => !progress.steps[s]?.complete) ?? steps[0]!;
  });
  const [busy, setBusy] = useState<ListingHostAction | 'DUPLICATE' | null>(null);
  const canManage = mine.permissions.includes('listings.manage');
  const editable = canManage && canEditListing(listing.status);
  const index = steps.indexOf(step);
  const TypeIcon = LISTING_TYPE_ICONS[listing.type];
  const primary = PRIMARY.find((action) => actions.includes(action));
  const secondary = actions.filter((action) => action !== primary);

  const go = (next: ListingStep) => {
    setStep(next);
    window.history.replaceState(
      null,
      '',
      getPathname({ locale, href: { pathname: '/panel/publicaciones/[id]', params: { id: listing.id }, query: { step: next } } }),
    );
    requestAnimationFrame(() => heading.current?.focus());
  };

  const run = async (action: ListingHostAction) => {
    setBusy(action);
    try {
      const result = await transitionListing(listing.id, action);
      storeListing(result);
      toast.success(t(action === 'PUBLISH' && result.listing.status === 'IN_MODERATION' ? 'listings.actionDone.SUBMITTED' : `listings.actionDone.${action}`));
    } catch (error) {
      toast.error(error instanceof ApiError && error.code === 'LISTING_NOT_READY' ? t('listings.editor.notReady') : errors.api(error));
    } finally {
      setBusy(null);
    }
  };

  const duplicate = async () => {
    setBusy('DUPLICATE');
    try {
      const copy = await api<HostListingResponse>(`/v1/host/listings/${listing.id}/duplicate`, { method: 'POST' });
      storeListing(copy);
      toast.success(t('listings.duplicated'));
      router.push({ pathname: '/panel/publicaciones/[id]', params: { id: copy.listing.id } });
    } catch (error) {
      toast.error(errors.api(error));
    } finally {
      setBusy(null);
    }
  };

  const stepProps: StepProps = { data, editable, hostSportKeys: mine.host.sportKeys, catalog, mine };
  const PrimaryIcon = primary ? ACTIONS[primary] : null;

  return (
    <div className="grid grid-cols-1 gap-6">
      <Link href="/panel/publicaciones" className="inline-flex min-h-11 items-center gap-2 justify-self-start font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={18} aria-hidden="true" />
        {t('listings.editor.back')}
      </Link>

      <header className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold tracking-[0.12em] text-secondary uppercase">
            <TypeIcon size={16} weight="bold" aria-hidden="true" />
            {t(`listingType.${listing.type}`)}
          </span>
          <ListingStatusBadge status={listing.status} size="sm" />
          <VisibilityNote visibility={listing.visibility} />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="min-w-0 flex-1 font-display text-3xl leading-tight font-extrabold uppercase italic [overflow-wrap:anywhere] sm:text-4xl">
            {listingTitle(listing.title)}
          </h2>
          {canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              {primary && PrimaryIcon ? (
                <Button
                  type="button"
                  size="lg"
                  variant={primary === 'WITHDRAW' ? 'outline' : 'default'}
                  disabled={busy !== null || ((primary === 'PUBLISH' || primary === 'RESUME') && blockers.length > 0)}
                  onClick={() => void run(primary)}
                >
                  {busy === primary ? <Spinner aria-hidden="true" /> : <PrimaryIcon size={20} weight="bold" aria-hidden="true" />}
                  {primary === 'PUBLISH' && preModeration ? t('listings.actions.SUBMIT') : t(`listings.actions.${primary}`)}
                </Button>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon-lg" aria-label={t('listings.editor.more')} disabled={busy !== null}>
                    <DotsThreeVertical size={22} weight="bold" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {secondary.map((action) => {
                    const ActionIcon = ACTIONS[action];
                    return (
                      <DropdownMenuItem key={action} onSelect={() => void run(action)} className="min-h-11">
                        <ActionIcon size={18} aria-hidden="true" />
                        {t(`listings.actions.${action}`)}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuItem onSelect={() => void duplicate()} className="min-h-11">
                    <Copy size={18} aria-hidden="true" />
                    {t('listings.duplicate')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>

        {listing.status === 'IN_MODERATION' ? (
          <p className="flex items-start gap-2 rounded-lg bg-secondary/10 p-3 text-sm font-medium">
            <Hourglass size={20} className="shrink-0 text-secondary" aria-hidden="true" />
            {t('listings.editor.inModeration')}
          </p>
        ) : null}
        {listing.moderationNote && listing.status === 'DRAFT' ? (
          <div className="grid gap-2">
            <p className="font-semibold">{t('listings.editor.returnedTitle')}</p>
            <ReasonBox reason={listing.moderationNote} />
          </div>
        ) : null}
        {listing.adminHidden ? (
          <div className="grid gap-2">
            <p className="flex items-center gap-2 font-semibold text-destructive">
              <ShieldWarning size={20} aria-hidden="true" />
              {t('listings.editor.hiddenTitle')}
            </p>
            {listing.adminHidden.reason ? <ReasonBox reason={listing.adminHidden.reason} /> : null}
          </div>
        ) : null}
        {!canManage ? <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">{t('listings.editor.readOnlyRole')}</p> : null}
        {canManage && !canEditListing(listing.status) && listing.status !== 'IN_MODERATION' ? (
          <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">{t('listings.editor.archivedNotice')}</p>
        ) : null}
        {listing.status === 'PUBLISHED' ? <p className="text-sm text-muted-foreground">{t('listings.editor.publishedNotice')}</p> : null}
        {blockers.length && (listing.status === 'DRAFT' || listing.status === 'PAUSED' || listing.status === 'PUBLISHED') ? (
          <Blockers blockers={blockers} onGoTo={go} />
        ) : listing.status === 'DRAFT' && canManage ? (
          <p className="flex items-center gap-2 font-semibold text-success">
            <Check size={20} weight="bold" aria-hidden="true" />
            {preModeration ? t('listings.editor.readyModeration') : t('listings.editor.ready')}
          </p>
        ) : null}
      </header>

      <nav aria-label={t('listings.editor.stepsLabel')}>
        <ol className="flex items-start justify-between gap-1">
          {steps.map((item, position) => {
            const active = item === step;
            const complete = progress.steps[item]?.complete ?? false;
            return (
              <li key={item} className="relative flex flex-1 flex-col items-center gap-2 text-center">
                {position > 0 ? (
                  <span aria-hidden="true" className={`absolute top-[22px] right-1/2 -z-0 h-0.5 w-full ${complete || active ? 'bg-primary/60' : 'bg-border'}`} />
                ) : null}
                <button
                  type="button"
                  onClick={() => go(item)}
                  aria-current={active ? 'step' : undefined}
                  aria-label={`${position + 1}. ${t(`listings.steps.${item}.label`)} — ${complete ? t('host.stepComplete') : t('host.stepIncomplete')}`}
                  className={`relative z-10 inline-flex size-11 items-center justify-center rounded-full border-2 font-display text-lg font-bold transition-colors duration-150 ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : complete
                        ? 'border-success bg-success text-success-foreground'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/60'
                  }`}
                >
                  {complete && !active ? <Check size={20} weight="bold" aria-hidden="true" /> : position + 1}
                </button>
                <span aria-hidden="true" className={`hidden text-sm leading-tight md:block ${active ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                  {t(`listings.steps.${item}.label`)}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      <section aria-labelledby="listing-step-title" className="rounded-xl border border-border bg-card p-5 sm:p-8">
        <p className="font-display text-sm font-bold tracking-[0.2em] text-muted-foreground uppercase">
          {t('host.stepOf', { current: index + 1, total: steps.length })}
        </p>
        <h2 id="listing-step-title" ref={heading} tabIndex={-1} className="mt-1 scroll-mt-24 font-display text-4xl leading-tight font-extrabold uppercase italic outline-none">
          {t(`listings.steps.${step}.title`)}
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {t(`listings.steps.${step}.subtitle`, { kind: isServiceListing(listing.type) ? 'service' : 'product' })}
        </p>
        <div className="mt-8">
          {step === 'basics' ? <StepBasics key={step} {...stepProps} /> : null}
          {step === 'location' ? <StepLocation key={step} {...stepProps} /> : null}
          {step === 'details' ? (listing.type === 'PRODUCT' ? <StepProduct key={step} {...stepProps} /> : <StepDetails key={step} {...stepProps} />) : null}
          {step === 'photos' ? <StepPhotos key={step} {...stepProps} /> : null}
          {step === 'pricing' ? <StepPricing key={step} {...stepProps} /> : null}
          {step === 'availability' ? <StepAvailability key={step} {...stepProps} /> : null}
        </div>
        <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6">
          {index > 0 ? (
            <Button type="button" variant="outline" onClick={() => go(steps[index - 1]!)}>
              <ArrowLeft size={18} weight="bold" aria-hidden="true" />
              {t('common.previous')}
            </Button>
          ) : (
            <span />
          )}
          {index < steps.length - 1 ? (
            <Button type="button" variant="outline" onClick={() => go(steps[index + 1]!)}>
              {t('common.next')}
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </section>
      <ListingTimeline events={data.events.slice(0, 10)} />
    </div>
  );
}
