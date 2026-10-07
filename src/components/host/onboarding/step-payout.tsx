'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  bankName,
  COLOMBIAN_BANKS,
  PAYOUT_HOLDER_DOCUMENT_TYPES,
  PayoutAccountSchema,
  type BankAccountType,
  type HostPayoutDto,
  type MyHostResponse,
  type PayoutAccountInput,
} from '@juandavidfuentes/indomitox-shared';
import { Bank, LockKey, Wallet } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';
import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { FormAlert, TextField } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api/client';
import { applyApiIssues, useErrorText } from '@/lib/forms';
import { HOST_KEY } from '@/lib/host';
import { LockedNotice } from '../autosave-indicator';
import { useHostEditing, type StepProps } from './use-editing';

interface PayoutForm {
  bank: string;
  accountType: string;
  accountNumber: string;
  holderName: string;
  holderDocumentType: string;
  holderDocumentNumber: string;
}

function SelectField({
  form,
  name,
  label,
  placeholder,
  children,
}: {
  form: ReturnType<typeof useForm<PayoutForm>>;
  name: keyof PayoutForm;
  label: string;
  placeholder?: string;
  children: React.ReactNode;
}) {
  const errors = useErrorText();
  const id = useId();
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Select value={field.value || undefined} onValueChange={field.onChange}>
            <SelectTrigger id={id} className="w-full" aria-invalid={fieldState.invalid} onBlur={field.onBlur}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>{children}</SelectContent>
          </Select>
          <FieldError>{errors.field(fieldState.error?.message)}</FieldError>
        </Field>
      )}
    />
  );
}

/** Paso 4: cuenta para recibir las liquidaciones (PAY-05). Solo el propietario la ve y la cambia. */
export function StepPayout({ mine }: StepProps) {
  const t = useTranslations();
  const errors = useErrorText();
  const queryClient = useQueryClient();
  const { can, lockedReason } = useHostEditing(mine);
  const [payout, setPayout] = useState<HostPayoutDto | null>(mine.payout);
  const [editing, setEditing] = useState(mine.payout === null);
  const [failure, setFailure] = useState<string | null>(null);
  const form = useForm<PayoutForm>({
    resolver: zodResolver(PayoutAccountSchema) as unknown as Resolver<PayoutForm>,
    defaultValues: {
      bank: '',
      accountType: '',
      accountNumber: '',
      holderName: mine.host.legalName ?? '',
      holderDocumentType: mine.host.legalType === 'LEGAL_ENTITY' ? 'NIT' : 'CC',
      holderDocumentNumber: mine.host.taxId?.split('-')[0] ?? '',
    },
    mode: 'onTouched',
  });
  const bank = useWatch({ control: form.control, name: 'bank' });
  const isWallet = COLOMBIAN_BANKS.find((b) => b.key === bank)?.wallet ?? false;

  // Nequi, Daviplata y MOVii son billeteras; los bancos, ahorros o corriente.
  useEffect(() => {
    const current = form.getValues('accountType');
    if (isWallet && current !== 'DIGITAL_WALLET') form.setValue('accountType', 'DIGITAL_WALLET');
    if (!isWallet && current === 'DIGITAL_WALLET') form.setValue('accountType', '');
  }, [form, isWallet]);

  if (!mine.permissions.includes('payout.manage')) return <LockedNotice>{t('host.payoutOwnerOnly')}</LockedNotice>;
  const locked = lockedReason('payout');

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(null);
    try {
      const saved = await api<HostPayoutDto>('/v1/host/payout', { method: 'PUT', body: values as PayoutAccountInput });
      setPayout(saved);
      setEditing(false);
      queryClient.setQueryData<MyHostResponse>(HOST_KEY, (current) => current && { ...current, payout: saved });
      await queryClient.invalidateQueries({ queryKey: HOST_KEY });
      toast.success(t('host.payoutSaved'));
    } catch (error) {
      if (!applyApiIssues(error, form.setError)) setFailure(errors.api(error));
    }
  });

  return (
    <div className="grid gap-6">
      {locked ? <LockedNotice>{locked}</LockedNotice> : null}
      {payout && !editing ? (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5">
          <span className="inline-flex size-12 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            {payout.accountType === 'DIGITAL_WALLET' ? <Wallet size={26} weight="duotone" aria-hidden="true" /> : <Bank size={26} weight="duotone" aria-hidden="true" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {t('host.payoutCurrent', {
                bank: bankName(payout.bank),
                type: t(`bankAccountTypes.${payout.accountType}`).toLowerCase(),
                last4: payout.accountLast4,
              })}
            </p>
            <p className="text-sm text-muted-foreground">{payout.holderName}</p>
          </div>
          {can('payout') ? (
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              {t('host.payoutChange')}
            </Button>
          ) : null}
        </div>
      ) : can('payout') ? (
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField form={form} name="bank" label={t('host.payoutBank')} placeholder={t('host.payoutBankPlaceholder')}>
                <SelectGroup>
                  <SelectLabel>{t('bankAccountTypes.SAVINGS')} / {t('bankAccountTypes.CHECKING')}</SelectLabel>
                  {COLOMBIAN_BANKS.filter((b) => !b.wallet).map((b) => (
                    <SelectItem key={b.key} value={b.key}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>{t('bankAccountTypes.DIGITAL_WALLET')}</SelectLabel>
                  {COLOMBIAN_BANKS.filter((b) => b.wallet).map((b) => (
                    <SelectItem key={b.key} value={b.key}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectField>
              <SelectField form={form} name="accountType" label={t('host.payoutAccountType')}>
                {(isWallet ? (['DIGITAL_WALLET'] as BankAccountType[]) : (['SAVINGS', 'CHECKING'] as BankAccountType[])).map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`bankAccountTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectField>
              <TextField
                control={form.control}
                name="accountNumber"
                label={isWallet ? t('host.payoutWalletNumber') : t('host.payoutAccountNumber')}
                inputMode="numeric"
                autoComplete="off"
              />
              <TextField control={form.control} name="holderName" label={t('host.payoutHolderName')} autoComplete="off" />
              <SelectField form={form} name="holderDocumentType" label={t('host.payoutHolderDocumentType')}>
                {PAYOUT_HOLDER_DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`documentTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectField>
              <TextField control={form.control} name="holderDocumentNumber" label={t('host.payoutHolderDocumentNumber')} autoComplete="off" />
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LockKey size={18} aria-hidden="true" />
              {t('host.payoutSecure')}
            </p>
            {failure ? <FormAlert>{failure}</FormAlert> : null}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Spinner aria-hidden="true" /> : null}
                {t('host.payoutSave')}
              </Button>
              {payout ? (
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  {t('common.cancel')}
                </Button>
              ) : null}
            </div>
          </FieldGroup>
        </form>
      ) : null}

      <div className="flex items-start gap-4 rounded-xl border border-dashed border-border p-5">
        <Wallet size={28} weight="duotone" className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
        <div>
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {t('host.mercadoPagoTitle')} <span className="tape">{t('common.comingSoon')}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t('host.mercadoPagoBody')}</p>
        </div>
      </div>
    </div>
  );
}
