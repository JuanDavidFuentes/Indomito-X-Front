'use client';

import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { FormAlert } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useErrorText } from '@/lib/forms';

/**
 * Confirmación de una decisión con su motivo (ADM-01). El motivo es obligatorio cuando el
 * Guía necesita saber qué corregir; lo verá en su panel y en el correo.
 */
export function ReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  danger = false,
  reasonRequired,
  reasonLabel,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  reasonRequired: boolean;
  reasonLabel?: string;
  onConfirm: (reason: string | undefined) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const errors = useErrorText();
  const id = useId();
  const [reason, setReason] = useState('');
  const [missing, setMissing] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const close = (next: boolean) => {
    if (!next) {
      setReason('');
      setMissing(false);
      setFailure(null);
    }
    onOpenChange(next);
  };

  const confirm = async () => {
    const text = reason.trim();
    if (reasonRequired && !text) {
      setMissing(true);
      return;
    }
    setSending(true);
    setFailure(null);
    try {
      await onConfirm(text || undefined);
      close(false);
    } catch (error) {
      setFailure(errors.api(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Field data-invalid={missing || undefined}>
          <FieldLabel htmlFor={id}>{reasonLabel ?? (reasonRequired ? t('admin.reason') : t('admin.reasonOptional'))}</FieldLabel>
          <Textarea
            id={id}
            value={reason}
            rows={4}
            maxLength={1000}
            placeholder={t('admin.reasonPlaceholder')}
            onChange={(event) => {
              setReason(event.target.value);
              if (event.target.value.trim()) setMissing(false);
            }}
            aria-invalid={missing}
            aria-required={reasonRequired}
          />
          <FieldError>{missing ? errors.field('validation.reasonRequired') : undefined}</FieldError>
        </Field>
        {failure ? <FormAlert>{failure}</FormAlert> : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => close(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="button" variant={danger ? 'danger' : 'default'} onClick={confirm} disabled={sending}>
            {sending ? <Spinner aria-hidden="true" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
