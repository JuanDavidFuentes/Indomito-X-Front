'use client';

import {
  bankName,
  departmentName,
  HOST_ONBOARDING_STEPS,
  HOST_TRANSITIONS,
  LOCALES,
  SOCIAL_NETWORKS,
  type AdminHostDetail,
  type HostAdminAction,
  type HostDocumentDto,
  type RequirementStatus,
  type SportDto,
} from '@juandavidfuentes/indomitox-shared';
import {
  ArrowLeft,
  ArrowSquareOut,
  CheckCircle,
  Circle,
  Eye,
  SealCheck,
  ShieldCheck,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useFormatter, useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/account/user-avatar';
import { DocumentViewer } from '@/components/host/document-viewer';
import { useRequirementLabel, useSportName } from '@/components/host/labels';
import { DocumentStateBadge, HostStatusBadge } from '@/components/host/status-badge';
import { Timeline } from '@/components/host/timeline';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';
import { ReasonDialog } from './reason-dialog';

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 rounded-xl border border-border bg-card p-5 sm:p-6">
      <h3 id={`${id}-title`} className="font-display text-2xl font-extrabold uppercase italic">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Facts({ items }: { items: [string, ReactNode][] }) {
  const t = useTranslations('common');
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="font-medium [overflow-wrap:anywhere]">{value || <span className="text-muted-foreground">{t('notProvided')}</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Una sola acción principal (aprobar o reactivar); las destructivas, en su variante suave y confirmadas en el diálogo. */
const ACTION_STYLE: Record<HostAdminAction, { variant: 'default' | 'outline' | 'destructive'; danger: boolean }> = {
  START_REVIEW: { variant: 'outline', danger: false },
  APPROVE: { variant: 'default', danger: false },
  REQUEST_CHANGES: { variant: 'outline', danger: false },
  REJECT: { variant: 'destructive', danger: true },
  SUSPEND: { variant: 'destructive', danger: true },
  REINSTATE: { variant: 'default', danger: false },
};

/** Revisión de un Guía (ADM-01): documentos con visor, datos, historial y la decisión con motivo. */
export function HostReview({ initial, sports }: { initial: AdminHostDetail; sports: SportDto[] }) {
  const t = useTranslations();
  const format = useFormatter();
  const errors = useErrorText();
  const queryClient = useQueryClient();
  const requirementLabel = useRequirementLabel();
  const sportName = useSportName();
  const hostId = initial.host.id;
  const key = ['admin', 'host', hostId] as const;
  const { data: detail } = useQuery({
    queryKey: key,
    queryFn: () => api<AdminHostDetail>(`/v1/admin/hosts/${hostId}`),
    initialData: initial,
  });
  const [viewing, setViewing] = useState<HostDocumentDto | null>(null);
  const [rejecting, setRejecting] = useState<HostDocumentDto | null>(null);
  const [deciding, setDeciding] = useState<HostAdminAction | null>(null);
  const [approvingDoc, setApprovingDoc] = useState<string | null>(null);
  const { host, progress } = detail;
  const ntsSports = new Set(sports.filter((sport) => sport.requiresNts).map((sport) => sport.key));

  const store = (next: AdminHostDetail) => {
    queryClient.setQueryData(key, next);
    void queryClient.invalidateQueries({ queryKey: ['admin', 'hosts'] });
  };

  const reviewDocument = async (document: HostDocumentDto, decision: 'APPROVED' | 'REJECTED', note?: string) => {
    store(
      await api<AdminHostDetail>(`/v1/admin/hosts/${hostId}/documents/${document.id}/review`, {
        method: 'POST',
        body: { decision, ...(note ? { note } : {}) },
      }),
    );
    toast.success(t('admin.documentReviewed'));
    setViewing(null);
  };

  const approveDocument = async (document: HostDocumentDto) => {
    setApprovingDoc(document.id);
    try {
      await reviewDocument(document, 'APPROVED');
    } catch (error) {
      toast.error(errors.api(error));
    } finally {
      setApprovingDoc(null);
    }
  };

  const decide = async (action: HostAdminAction, reason?: string) => {
    store(await api<AdminHostDetail>(`/v1/admin/hosts/${hostId}/decision`, { method: 'POST', body: { action, ...(reason ? { reason } : {}) } }));
    toast.success(t('admin.decisionDone'));
  };

  const documentsFor = (requirement: RequirementStatus) =>
    detail.documents.filter(
      (document) =>
        document.type === requirement.type &&
        document.status !== 'REPLACED' &&
        (!requirement.sportKey || document.sportKeys.includes(requirement.sportKey)),
    );
  const history = detail.documents.filter((document) => document.status === 'REPLACED');
  const documentTitle = (document: HostDocumentDto) =>
    requirementLabel({ type: document.type, sportKey: document.type === 'NTS_CERTIFICATE' ? (document.sportKeys[0] ?? null) : null });
  const day = (date: string) => format.dateTime(new Date(`${date}T12:00:00Z`), { dateStyle: 'medium', timeZone: 'UTC' });

  const documentActions = (document: HostDocumentDto, inViewer = false) => (
    <>
      {inViewer ? null : (
        <Button type="button" variant="ghost" size="sm" onClick={() => setViewing(document)}>
          <Eye size={16} aria-hidden="true" />
          {t('common.view')}
        </Button>
      )}
      {document.status === 'PENDING' ? (
        <>
          <Button type="button" size="sm" variant="outline" disabled={approvingDoc === document.id} onClick={() => void approveDocument(document)}>
            {approvingDoc === document.id ? <Spinner aria-hidden="true" /> : <CheckCircle size={16} weight="bold" className="text-success" aria-hidden="true" />}
            {t('admin.approveDocument')}
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={() => setRejecting(document)}>
            <XCircle size={16} weight="bold" aria-hidden="true" />
            {t('admin.rejectDocument')}
          </Button>
        </>
      ) : null}
    </>
  );

  return (
    <div className="grid grid-cols-1 gap-6">
      <Link href="/admin/guias" className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={18} aria-hidden="true" />
        {t('admin.backToList')}
      </Link>

      <header className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-muted">
          {host.logoUrl ? <Image src={host.logoUrl} alt="" fill sizes="5rem" className="object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-4xl leading-tight font-extrabold uppercase italic [overflow-wrap:anywhere]">
            {host.tradeName ?? host.legalName ?? t('admin.unnamed')}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <HostStatusBadge status={host.status} />
            {host.legalType ? <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">{t(`hostLegalTypes.${host.legalType}`)}</span> : null}
            {host.submittedAt ? (
              <span className="text-sm text-muted-foreground">
                {t('admin.columns.submitted')}: {format.dateTime(new Date(host.submittedAt), { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            ) : null}
          </div>
        </div>
        {host.status === 'APPROVED' && host.slug ? (
          <Link
            href={{ pathname: '/guias/[slug]', params: { slug: host.slug } }}
            className="inline-flex h-11 items-center gap-2 self-start rounded-lg border border-border px-4 font-semibold text-secondary hover:bg-muted sm:self-auto"
          >
            <ArrowSquareOut size={18} aria-hidden="true" />
            {t('host.pagePreview')}
          </Link>
        ) : null}
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="grid min-w-0 gap-6">
          <Block id="documentos" title={t('admin.sections.documents')}>
            <p className="mb-4 text-sm text-muted-foreground">{t('admin.viewerAudit')}</p>
            <ul className="grid gap-3">
              {detail.requirements.map((requirement) => {
                const documents = documentsFor(requirement);
                return (
                  <li key={requirement.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{requirementLabel(requirement)}</span>
                      <DocumentStateBadge state={requirement.state} />
                    </div>
                    {documents.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">{t('admin.noDocument')}</p>
                    ) : (
                      <ul className="mt-3 grid gap-2">
                        {documents.map((document) => (
                          <li key={document.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
                            <DocumentStateBadge state={document.status} />
                            <span className="text-muted-foreground">{t('admin.uploadedOn', { date: format.dateTime(new Date(document.createdAt), { dateStyle: 'medium' }) })}</span>
                            {document.expiresAt ? <span className="font-semibold">{t('host.expiresOn', { date: day(document.expiresAt) })}</span> : null}
                            {document.number ? <span>Nº {document.number}</span> : null}
                            {document.reviewNote ? <span className="w-full text-destructive">{t('host.reviewNote')}: {document.reviewNote}</span> : null}
                            <span className="ml-auto flex flex-wrap gap-2">
                              {documentActions(document)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
            {history.length ? (
              <details className="mt-4 rounded-lg border border-border p-4">
                <summary className="cursor-pointer font-semibold">
                  {t('admin.previousVersions')} ({history.length})
                </summary>
                <ul className="mt-3 grid gap-2">
                  {history.map((document) => (
                    <li key={document.id} className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-medium">{documentTitle(document)}</span>
                      <span className="text-muted-foreground">{format.dateTime(new Date(document.createdAt), { dateStyle: 'medium' })}</span>
                      {document.reviewNote ? <span className="text-muted-foreground">· {document.reviewNote}</span> : null}
                      <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={() => setViewing(document)}>
                        <Eye size={16} aria-hidden="true" />
                        {t('common.view')}
                      </Button>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </Block>

          <Block id="empresa" title={t('admin.sections.company')}>
            <Facts
              items={[
                [t('host.legalName'), host.legalName],
                [t('host.tradeName'), host.tradeName],
                [t('host.taxId'), host.taxId ? <span className="tabular-nums">{host.taxId}</span> : null],
                [t('host.rntNumber'), host.offersTourismServices ? host.rntNumber : t('host.offersProductsOnly')],
                [t('host.offersTitle'), host.offersTourismServices ? t('host.offersServices') : t('host.offersProductsOnly')],
                [t('host.slug'), host.slug],
              ]}
            />
          </Block>

          <Block id="contacto" title={t('admin.sections.contact')}>
            <Facts
              items={[
                [t('host.contactPhone'), host.contactPhone],
                [t('host.contactEmail'), host.contactEmail],
                [t('host.address'), host.address],
                [t('host.city'), [host.city, departmentName(host.department)].filter(Boolean).join(', ')],
              ]}
            />
          </Block>

          <Block id="actividades" title={t('admin.sections.activities')}>
            {host.sportKeys.length ? (
              <ul className="flex flex-wrap gap-2">
                {host.sportKeys.map((sportKey) => (
                  <li key={sportKey} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-semibold">
                    {sportName(sportKey)}
                    {ntsSports.has(sportKey) ? <ShieldCheck size={16} className="text-secondary" aria-label={t('host.ntsBadge')} /> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">{t('common.notProvided')}</p>
            )}
          </Block>

          <Block id="pagina" title={t('admin.sections.page')}>
            {host.coverUrl ? (
              <div className="relative mb-4 aspect-[16/6] overflow-hidden rounded-lg bg-muted">
                <Image src={host.coverUrl} alt="" fill sizes="(min-width: 1280px) 48rem, 100vw" className="object-cover" />
              </div>
            ) : null}
            <div className="grid gap-4">
              {LOCALES.filter((locale) => host.description[locale]).map((locale) => (
                <div key={locale}>
                  <p className="text-sm font-semibold text-muted-foreground uppercase">{locale}</p>
                  <p lang={locale} className="whitespace-pre-line">{host.description[locale]}</p>
                </div>
              ))}
              <Facts
                items={[
                  [t('host.languagesServed'), host.languages.map((language) => t(`spokenLanguages.${language}`)).join(', ')],
                  ...SOCIAL_NETWORKS.filter((network) => host.socialLinks[network]).map(
                    (network) => [t(`socialNetworks.${network}`), host.socialLinks[network]] as [string, ReactNode],
                  ),
                ]}
              />
            </div>
          </Block>

          <Block id="pago" title={t('admin.sections.payout')}>
            {detail.payout ? (
              <Facts
                items={[
                  [t('host.payoutBank'), bankName(detail.payout.bank)],
                  [t('host.payoutAccountType'), t(`bankAccountTypes.${detail.payout.accountType}`)],
                  [t('host.payoutAccountNumber'), <span key="n" className="tabular-nums">•••• {detail.payout.accountLast4}</span>],
                  [t('host.payoutHolderName'), `${detail.payout.holderName} (${t(`documentTypes.${detail.payout.holderDocumentType}`)})`],
                ]}
              />
            ) : (
              <p className="text-muted-foreground">{t('admin.noPayout')}</p>
            )}
          </Block>

          <Block id="equipo" title={t('admin.sections.team')}>
            <ul className="grid gap-3">
              {detail.members.map((member) => (
                <li key={member.userId} className="flex flex-wrap items-center gap-3">
                  <UserAvatar user={member} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm break-all text-muted-foreground">{member.email}</p>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">{t(`hostRoles.${member.role}`)}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Timeline events={detail.events} title={t('admin.sections.history')} />
        </div>

        <aside className="grid content-start gap-4 xl:sticky xl:top-24 xl:self-start">
          <section aria-labelledby="decision-title" className="rounded-xl border-2 border-primary/40 bg-card p-5">
            <h3 id="decision-title" className="font-display text-2xl font-extrabold uppercase italic">
              {t('admin.sections.decision')}
            </h3>
            {detail.availableActions.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t('admin.noActions')}</p>
            ) : (
              <div className="mt-4 grid gap-2">
                {detail.availableActions.map((action) => {
                  const blocked = action === 'APPROVE' && !progress.documentsApproved;
                  return (
                    <Button key={action} type="button" variant={ACTION_STYLE[action].variant} disabled={blocked} onClick={() => setDeciding(action)} className="w-full">
                      {action === 'APPROVE' ? <SealCheck size={18} weight="bold" aria-hidden="true" /> : null}
                      {t(`admin.actions.${action}`)}
                    </Button>
                  );
                })}
                {detail.availableActions.includes('APPROVE') && !progress.documentsApproved ? (
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <WarningCircle size={18} className="mt-px shrink-0 text-warning" aria-hidden="true" />
                    {t('admin.approveBlocked')}
                  </p>
                ) : null}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-xl font-extrabold uppercase italic">{t('host.stepsLabel')}</h3>
            <ul className="mt-3 grid gap-2">
              {HOST_ONBOARDING_STEPS.map((step) => (
                <li key={step} className="flex items-center gap-2 text-sm">
                  {progress.steps[step].complete ? (
                    <CheckCircle size={18} weight="fill" className="text-success" aria-hidden="true" />
                  ) : (
                    <Circle size={18} className="text-muted-foreground" aria-hidden="true" />
                  )}
                  <span>{t(`hostSteps.${step}.label`)}</span>
                  <span className="sr-only">{progress.steps[step].complete ? t('host.stepComplete') : t('host.stepIncomplete')}</span>
                </li>
              ))}
            </ul>
          </section>

          {detail.owner ? (
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-xl font-extrabold uppercase italic">{t('admin.owner')}</h3>
              <p className="mt-2 font-semibold">{detail.owner.name}</p>
              <p className="text-sm break-all text-muted-foreground">{detail.owner.email}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold">
                {detail.owner.emailVerified ? (
                  <CheckCircle size={16} weight="fill" className="text-success" aria-hidden="true" />
                ) : (
                  <WarningCircle size={16} weight="fill" className="text-warning" aria-hidden="true" />
                )}
                {detail.owner.emailVerified ? t('admin.emailVerified') : t('admin.emailNotVerified')}
              </p>
            </section>
          ) : null}
        </aside>
      </div>

      <DocumentViewer
        document={viewing}
        title={viewing ? documentTitle(viewing) : ''}
        note={viewing?.expiresAt ? t('host.expiresOn', { date: day(viewing.expiresAt) }) : undefined}
        urlPath={viewing ? `/v1/admin/hosts/${hostId}/documents/${viewing.id}/file` : null}
        actions={viewing && viewing.status === 'PENDING' ? documentActions(viewing, true) : null}
        onOpenChange={(open) => !open && setViewing(null)}
      />

      <ReasonDialog
        open={rejecting !== null}
        title={rejecting ? t('admin.rejectDocumentTitle', { document: documentTitle(rejecting) }) : ''}
        description={t('admin.actionHints.REQUEST_CHANGES')}
        confirmLabel={t('admin.rejectDocument')}
        danger
        reasonRequired
        reasonLabel={t('admin.documentNote')}
        onConfirm={async (note) => {
          if (rejecting) await reviewDocument(rejecting, 'REJECTED', note);
        }}
        onOpenChange={(open) => !open && setRejecting(null)}
      />

      <ReasonDialog
        open={deciding !== null}
        title={deciding ? t(`admin.actions.${deciding}`) : ''}
        description={deciding ? t(`admin.actionHints.${deciding}`) : ''}
        confirmLabel={deciding ? t(`admin.actions.${deciding}`) : ''}
        danger={deciding ? ACTION_STYLE[deciding].danger : false}
        reasonRequired={deciding ? HOST_TRANSITIONS[deciding].reasonRequired : false}
        onConfirm={async (reason) => {
          if (deciding) await decide(deciding, reason);
        }}
        onOpenChange={(open) => !open && setDeciding(null)}
      />
    </div>
  );
}
