'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ageOn,
  DOCUMENT_TYPES,
  EmergencyContactSchema,
  maskDocument,
  SavedParticipantSchema,
  type DocumentType,
  type SavedParticipant,
} from '@juandavidfuentes/indomitox-shared';
import { PencilSimple, Plus, Trash, UsersThree } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { TextField } from '@/components/forms/fields';
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
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api/client';
import { applyApiIssues, useErrorText } from '@/lib/forms';
import { PARTICIPANTS_KEY, useParticipants } from './account-data';
import { EmergencyFields } from './emergency-section';
import { AccountSection } from './section';

/** El contacto de emergencia del participante es opcional: si sus campos van vacíos, se guarda null. */
const ParticipantFormSchema = SavedParticipantSchema.extend({
  emergencyContact: z.preprocess((value) => {
    const contact = value as { name?: string; phone?: string; relationship?: string } | null | undefined;
    return contact && [contact.name, contact.phone, contact.relationship].some((v) => v?.trim()) ? contact : null;
  }, EmergencyContactSchema.nullable()),
});

interface ParticipantForm {
  fullName: string;
  documentType: DocumentType;
  documentNumber: string;
  birthDate: string;
  emergencyContact: { name: string; phone: string; relationship: string };
}

const today = () => new Date().toISOString().slice(0, 10);

function toForm(participant?: SavedParticipant): ParticipantForm {
  return {
    fullName: participant?.fullName ?? '',
    documentType: participant?.documentType ?? 'CC',
    documentNumber: participant?.documentNumber ?? '',
    birthDate: participant?.birthDate ?? '',
    emergencyContact: {
      name: participant?.emergencyContact?.name ?? '',
      phone: participant?.emergencyContact?.phone ?? '',
      relationship: participant?.emergencyContact?.relationship ?? '',
    },
  };
}

function ParticipantDialog({
  open,
  participant,
  onOpenChange,
}: {
  open: boolean;
  participant?: SavedParticipant;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const errors = useErrorText();
  const queryClient = useQueryClient();
  const form = useForm<ParticipantForm>({
    resolver: zodResolver(ParticipantFormSchema) as unknown as Resolver<ParticipantForm>,
    values: toForm(participant),
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const body = ParticipantFormSchema.parse(values);
      const saved = participant
        ? await api<SavedParticipant>(`/v1/me/participants/${participant.id}`, { method: 'PUT', body })
        : await api<SavedParticipant>('/v1/me/participants', { method: 'POST', body });
      queryClient.setQueryData<SavedParticipant[]>(PARTICIPANTS_KEY, (list = []) =>
        participant ? list.map((p) => (p.id === saved.id ? saved : p)) : [...list, saved],
      );
      toast.success(t('account.saved'));
      onOpenChange(false);
    } catch (error) {
      if (!applyApiIssues(error, form.setError)) toast.error(errors.api(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{participant ? t('account.editParticipant') : t('account.addParticipant')}</DialogTitle>
          <DialogDescription>{t('account.participantsHint')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <TextField control={form.control} name="fullName" label={t('account.fullName')} autoComplete="off" />
            <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
              <Controller
                control={form.control}
                name="documentType"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel htmlFor="participant-document-type">{t('account.documentType')}</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="participant-document-type" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`documentTypes.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{errors.field(fieldState.error?.message)}</FieldError>
                  </Field>
                )}
              />
              <TextField
                control={form.control}
                name="documentNumber"
                label={t('account.documentNumber')}
                autoComplete="off"
                inputMode="text"
              />
            </div>
            <TextField
              control={form.control}
              name="birthDate"
              label={t('account.birthDate')}
              type="date"
              max={today()}
              min="1900-01-01"
              className="max-w-56"
            />
            <FieldSet>
              <FieldLegend variant="label" className="text-sm font-semibold">
                {t('account.participantEmergency')}
              </FieldLegend>
              <EmergencyFields
                control={form.control}
                names={{
                  name: 'emergencyContact.name',
                  phone: 'emergencyContact.phone',
                  relationship: 'emergencyContact.relationship',
                }}
              />
            </FieldSet>
            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Spinner aria-hidden="true" /> : null}
                {t('common.save')}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** EXP-02: participantes frecuentes. Solo su dueño los ve y el documento se guarda cifrado. */
export function ParticipantsSection({ initial }: { initial: SavedParticipant[] }) {
  const t = useTranslations();
  const errors = useErrorText();
  const queryClient = useQueryClient();
  const { data: participants } = useParticipants(initial);
  const [editing, setEditing] = useState<{ open: boolean; participant?: SavedParticipant }>({ open: false });
  const [toDelete, setToDelete] = useState<SavedParticipant | null>(null);

  const remove = async (participant: SavedParticipant) => {
    try {
      await api(`/v1/me/participants/${participant.id}`, { method: 'DELETE' });
      queryClient.setQueryData<SavedParticipant[]>(PARTICIPANTS_KEY, (list = []) =>
        list.filter((p) => p.id !== participant.id),
      );
      toast.success(t('account.saved'));
    } catch (error) {
      toast.error(errors.api(error));
    }
  };

  return (
    <AccountSection
      id="participantes"
      icon={UsersThree}
      title={t('account.sections.participants')}
      hint={t('account.participantsHint')}
      action={
        <Button type="button" variant="outline" onClick={() => setEditing({ open: true })}>
          <Plus size={18} weight="bold" aria-hidden="true" />
          {t('account.addParticipant')}
        </Button>
      }
    >
      {participants.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-muted-foreground">
          {t('account.participantsEmpty')}
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {participants.map((participant) => (
            <li key={participant.id} className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{participant.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {t(`documentTypes.${participant.documentType}`)} · {maskDocument(participant.documentNumber)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('account.age', { years: ageOn(participant.birthDate) })}
                  {participant.emergencyContact ? ` · ${participant.emergencyContact.name}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing({ open: true, participant })}
                  aria-label={`${t('common.edit')}: ${participant.fullName}`}
                >
                  <PencilSimple size={16} aria-hidden="true" />
                  {t('common.edit')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setToDelete(participant)}
                  aria-label={`${t('common.delete')}: ${participant.fullName}`}
                >
                  <Trash size={16} aria-hidden="true" />
                  {t('common.delete')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ParticipantDialog
        open={editing.open}
        participant={editing.participant}
        onOpenChange={(open) => setEditing((state) => ({ ...state, open }))}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('account.deleteParticipant')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('account.deleteParticipantConfirm', { name: toDelete?.fullName ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => toDelete && void remove(toDelete)}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AccountSection>
  );
}
