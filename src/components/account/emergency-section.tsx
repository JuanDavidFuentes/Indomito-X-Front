'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { EmergencyContactSchema, type EmergencyContactInput, type MeResponse } from '@juandavidfuentes/indomitox-shared';
import { FirstAidKit } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, type Control, type FieldValues, type Path } from 'react-hook-form';
import { toast } from 'sonner';
import { TextField } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api/client';
import { applyApiIssues, useErrorText } from '@/lib/forms';
import { useStoreMe } from './account-data';
import { AccountSection } from './section';

/** Campos del contacto de emergencia; los usa también el formulario de participantes. */
export function EmergencyFields<T extends FieldValues>({
  control,
  names,
}: {
  control: Control<T>;
  names: Record<'name' | 'phone' | 'relationship', Path<T>>;
}) {
  const t = useTranslations();
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <TextField control={control} name={names.name} label={t('account.emergencyName')} autoComplete="off" />
      <TextField
        control={control}
        name={names.phone}
        label={t('account.emergencyPhone')}
        type="tel"
        inputMode="tel"
        autoComplete="off"
      />
      <TextField
        control={control}
        name={names.relationship}
        label={`${t('account.emergencyRelationship')} (${t('common.optional')})`}
        placeholder={t('account.emergencyRelationshipPlaceholder')}
        autoComplete="off"
      />
    </div>
  );
}

export function EmergencySection({ me }: { me: MeResponse }) {
  const t = useTranslations();
  const errors = useErrorText();
  const storeMe = useStoreMe();
  const [removing, setRemoving] = useState(false);
  const contact = me.profile.emergencyContact;
  const form = useForm<EmergencyContactInput>({
    resolver: zodResolver(EmergencyContactSchema),
    values: { name: contact?.name ?? '', phone: contact?.phone ?? '', relationship: contact?.relationship ?? '' },
    mode: 'onTouched',
  });

  const save = (emergencyContact: EmergencyContactInput | null) =>
    api<MeResponse>('/v1/me', { method: 'PATCH', body: { emergencyContact } });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      storeMe(await save(values));
      toast.success(t('account.saved'));
    } catch (error) {
      // Los errores de la API llegan como `emergencyContact.campo`.
      const mapped = applyApiIssues(error, (path, value, options) =>
        form.setError(String(path).replace(/^emergencyContact\./, '') as never, value, options),
      );
      if (!mapped) toast.error(errors.api(error));
    }
  });

  const remove = async () => {
    setRemoving(true);
    try {
      storeMe(await save(null));
      toast.success(t('account.saved'));
    } catch (error) {
      toast.error(errors.api(error));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <AccountSection
      id="emergencia"
      icon={FirstAidKit}
      title={t('account.sections.emergency')}
      hint={t('account.emergencyHint')}
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          {contact ? null : <p className="text-muted-foreground">{t('account.emergencyEmpty')}</p>}
          <EmergencyFields
            control={form.control}
            names={{ name: 'name', phone: 'phone', relationship: 'relationship' }}
          />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
              {form.formState.isSubmitting ? <Spinner aria-hidden="true" /> : null}
              {t('common.save')}
            </Button>
            {contact ? (
              <Button type="button" variant="ghost" onClick={remove} disabled={removing}>
                {removing ? <Spinner aria-hidden="true" /> : null}
                {t('account.removeContact')}
              </Button>
            ) : null}
          </div>
        </FieldGroup>
      </form>
    </AccountSection>
  );
}
