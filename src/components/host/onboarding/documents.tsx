'use client';

import {
  AddHostDocumentSchema,
  todayInPlatform,
  type HostDocumentDto,
  type MyHostResponse,
  type RequirementStatus,
  type SportDto,
} from '@juandavidfuentes/indomitox-shared';
import { ArrowsClockwise, Check, Eye, FileText, Trash, UploadSimple } from '@phosphor-icons/react';
import { useFormatter, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { FormAlert } from '@/components/forms/fields';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';
import { useStoreHost } from '@/lib/host';
import { DocumentViewer } from '../document-viewer';
import { FileDrop } from '../file-drop';
import { useRequirementLabel, useSportName } from '../labels';
import { DocumentStateBadge } from '../status-badge';
import { useHostEditing } from './use-editing';

/** Fecha AAAA-MM-DD legible en el idioma (a mediodía UTC para no correr de día). */
function useFormatDay() {
  const format = useFormatter();
  return (date: string) => format.dateTime(new Date(`${date}T12:00:00Z`), { dateStyle: 'medium', timeZone: 'UTC' });
}

/** Documento en revisión que renueva al vigente de este requisito (HOST-05). */
function pendingRenewal(requirement: RequirementStatus, documents: HostDocumentDto[] | null) {
  if (requirement.state !== 'APPROVED') return null;
  return (
    documents?.find(
      (document) =>
        document.type === requirement.type &&
        document.status === 'PENDING' &&
        (!requirement.sportKey || document.sportKeys.includes(requirement.sportKey)),
    ) ?? null
  );
}

function UploadDocumentDialog({
  requirement,
  mine,
  sports,
  onClose,
}: {
  requirement: RequirementStatus | null;
  mine: MyHostResponse;
  sports: SportDto[];
  onClose: () => void;
}) {
  const t = useTranslations();
  const errors = useErrorText();
  const storeHost = useStoreHost();
  const label = useRequirementLabel();
  const sportName = useSportName();
  const id = useId();
  const [fileId, setFileId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState('');
  const [number, setNumber] = useState('');
  const [sportKeys, setSportKeys] = useState<string[]>([]);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Al abrir con otro requisito, el formulario empieza limpio.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  if (requirement && openedFor !== requirement.id) {
    setOpenedFor(requirement.id);
    setFileId(null);
    setExpiresAt('');
    setNumber('');
    setSportKeys(requirement.sportKey ? [requirement.sportKey] : []);
    setIssues({});
    setFailure(null);
  }

  const ntsSports = sports.filter((sport) => sport.requiresNts && mine.host.sportKeys.includes(sport.key));

  const save = async () => {
    if (!requirement || !fileId) return;
    const input = {
      type: requirement.type,
      fileId,
      ...(expiresAt ? { expiresAt } : {}),
      ...(number ? { number } : {}),
      ...(requirement.type === 'NTS_CERTIFICATE' ? { sportKeys } : {}),
    };
    const parsed = AddHostDocumentSchema.safeParse(input);
    if (!parsed.success) {
      setIssues(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setIssues({});
    setFailure(null);
    setSaving(true);
    try {
      storeHost(await api<MyHostResponse>('/v1/host/documents', { method: 'POST', body: input }));
      toast.success(t('host.documentSaved'));
      setOpenedFor(null);
      onClose();
    } catch (error) {
      setFailure(errors.api(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={requirement !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{requirement ? t('host.documentUploadTitle', { document: label(requirement) }) : ''}</DialogTitle>
          <DialogDescription>{requirement ? t(`hostDocuments.${requirement.type}.hint`) : ''}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5">
          <FileDrop purpose="HOST_DOCUMENT" label={t('uploads.choose')} onUploaded={({ fileId: uploaded }) => setFileId(uploaded)} />
          {requirement?.requiresExpiry ? (
            <Field data-invalid={issues.expiresAt ? true : undefined}>
              <FieldLabel htmlFor={`${id}-expires`}>{t('host.documentExpiresAt')}</FieldLabel>
              <Input
                id={`${id}-expires`}
                type="date"
                min={todayInPlatform()}
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                aria-invalid={Boolean(issues.expiresAt)}
                aria-describedby={`${id}-expires-hint`}
                className="max-w-56"
              />
              <FieldDescription id={`${id}-expires-hint`}>{t('host.documentExpiresAtHint')}</FieldDescription>
              <FieldError>{errors.field(issues.expiresAt)}</FieldError>
            </Field>
          ) : null}
          {requirement?.type === 'NTS_CERTIFICATE' ? (
            <FieldSet data-invalid={issues.sportKeys ? true : undefined}>
              <FieldLegend variant="label" className="text-sm font-semibold">
                {t('host.documentSports')}
              </FieldLegend>
              <div className="flex flex-wrap gap-2">
                {ntsSports.map((sport) => {
                  const checked = sportKeys.includes(sport.key);
                  return (
                    <button
                      key={sport.key}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() =>
                        setSportKeys((current) => (checked ? current.filter((k) => k !== sport.key) : [...current, sport.key]))
                      }
                      className={`inline-flex h-11 items-center gap-2 rounded-full border-2 px-4 font-semibold transition-colors duration-150 ${
                        checked ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {checked ? <Check size={16} weight="bold" aria-hidden="true" /> : null}
                      {sportName(sport.key)}
                    </button>
                  );
                })}
              </div>
              <FieldError>{errors.field(issues.sportKeys)}</FieldError>
            </FieldSet>
          ) : null}
          <Field>
            <FieldLabel htmlFor={`${id}-number`}>
              {t('host.documentNumber')} <span className="font-normal text-muted-foreground">({t('common.optional')})</span>
            </FieldLabel>
            <Input id={`${id}-number`} value={number} onChange={(event) => setNumber(event.target.value)} autoComplete="off" maxLength={40} />
          </Field>
          {failure ? <FormAlert>{failure}</FormAlert> : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={save} disabled={!fileId || saving}>
              {saving ? <Spinner aria-hidden="true" /> : null}
              {t('common.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Documentos exigidos con su estado, vencimiento y nota del revisor (HOST-02, HOST-05). El
 * Guía carga, reemplaza o renueva; un documento que nadie ha revisado se puede quitar.
 */
export function DocumentsManager({ mine, sports }: { mine: MyHostResponse; sports: SportDto[] }) {
  const t = useTranslations();
  const errors = useErrorText();
  const storeHost = useStoreHost();
  const label = useRequirementLabel();
  const formatDay = useFormatDay();
  const { can, lockedReason } = useHostEditing(mine);
  const [uploading, setUploading] = useState<RequirementStatus | null>(null);
  const [viewing, setViewing] = useState<HostDocumentDto | null>(null);
  const [removing, setRemoving] = useState<HostDocumentDto | null>(null);
  const editable = can('documents');
  const locked = lockedReason('documents');
  const documentById = (id: string | null) => mine.documents?.find((document) => document.id === id) ?? null;

  const remove = async () => {
    if (!removing) return;
    try {
      storeHost(await api<MyHostResponse>(`/v1/host/documents/${removing.id}`, { method: 'DELETE' }));
      toast.success(t('host.documentRemoved'));
    } catch (error) {
      toast.error(errors.api(error));
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="grid gap-4">
      {locked && mine.documents ? <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">{locked}</p> : null}
      <ul className="grid gap-3">
        {mine.requirements.map((requirement) => {
          const document = documentById(requirement.documentId);
          const renewal = pendingRenewal(requirement, mine.documents);
          const action =
            requirement.state === 'MISSING'
              ? { label: t('host.uploadDocument'), icon: UploadSimple }
              : requirement.state === 'APPROVED'
                ? { label: t('host.renewDocument'), icon: ArrowsClockwise }
                : { label: t('host.replaceDocument'), icon: ArrowsClockwise };
          const removable = document?.status === 'PENDING' && (mine.host.status === 'DRAFT' || mine.host.status === 'CHANGES_REQUESTED');
          return (
            <li key={requirement.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start gap-3">
                <FileText size={28} weight="duotone" className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{label(requirement)}</span>
                    <DocumentStateBadge state={requirement.state} />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`hostDocuments.${requirement.type}.hint`)}</p>
                  {requirement.expiresAt ? (
                    <p className={`mt-1 text-sm font-semibold ${requirement.daysToExpiry !== null && requirement.daysToExpiry <= 30 ? 'text-warning' : ''}`}>
                      {requirement.state === 'EXPIRED'
                        ? t('host.expiredOn', { date: formatDay(requirement.expiresAt) })
                        : requirement.daysToExpiry !== null && requirement.daysToExpiry <= 30
                          ? t('host.expiresInDays', { days: requirement.daysToExpiry })
                          : t('host.expiresOn', { date: formatDay(requirement.expiresAt) })}
                    </p>
                  ) : null}
                  {renewal ? (
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <DocumentStateBadge state="PENDING" />
                      {t('host.renewDocument')}
                      {renewal.expiresAt ? ` · ${t('host.expiresOn', { date: formatDay(renewal.expiresAt) })}` : ''}
                    </p>
                  ) : null}
                  {requirement.state === 'REJECTED' && requirement.reviewNote ? (
                    <div className="mt-3 rounded-md border-l-4 border-destructive bg-destructive/10 px-3 py-2 text-sm">
                      <span className="font-semibold">{t('host.reviewNote')}:</span> {requirement.reviewNote}
                    </div>
                  ) : null}
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  {document && mine.documents ? (
                    <Button type="button" variant="ghost" onClick={() => setViewing(document)}>
                      <Eye size={18} aria-hidden="true" />
                      {t('host.viewDocument')}
                    </Button>
                  ) : null}
                  {editable && !renewal ? (
                    <Button type="button" variant="outline" onClick={() => setUploading(requirement)}>
                      <action.icon size={18} aria-hidden="true" />
                      {action.label}
                    </Button>
                  ) : null}
                  {editable && removable ? (
                    <Button type="button" variant="ghost" size="icon" aria-label={t('host.removeDocument')} onClick={() => setRemoving(document)}>
                      <Trash size={18} aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <UploadDocumentDialog requirement={uploading} mine={mine} sports={sports} onClose={() => setUploading(null)} />
      <DocumentViewer
        document={viewing}
        title={viewing ? label({ type: viewing.type, sportKey: viewing.sportKeys[0] ?? null }) : ''}
        urlPath={viewing ? `/v1/host/documents/${viewing.id}/file` : null}
        onOpenChange={(open) => !open && setViewing(null)}
      />
      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('host.removeDocument')}</AlertDialogTitle>
            <AlertDialogDescription>{removing ? removing.fileName : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={() => void remove()}>
              {t('common.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
