'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChangePasswordSchema,
  PASSWORD_MIN_LENGTH,
  type ChangePasswordInput,
  type MeResponse,
} from '@juandavidfuentes/indomitox-shared';
import { Devices, LockKey, SignOut, Trash, Warning } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormAlert, PasswordField } from '@/components/forms/fields';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { getPathname } from '@/i18n/navigation';
import type { routing } from '@/i18n/routing';
import { api } from '@/lib/api/client';
import { applyApiIssues, useErrorText } from '@/lib/forms';
import { useSetSessionUser, useSignOut } from '@/lib/session';
import { AccountSection } from './section';

const PROVIDER_NAMES = { GOOGLE: 'Google', APPLE: 'Apple' } as const;

function ChangePasswordForm({ me }: { me: MeResponse }) {
  const t = useTranslations();
  const errors = useErrorText();
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
    mode: 'onTouched',
  });
  const hasPassword = me.user.hasPassword;
  const provider = me.user.providers[0];

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await api('/v1/auth/change-password', {
        method: 'POST',
        body: hasPassword ? values : { newPassword: values.newPassword },
      });
      form.reset();
      toast.success(t('account.passwordChanged'));
    } catch (error) {
      if (!applyApiIssues(error, form.setError)) {
        const code = (error as { code?: string }).code;
        if (code === 'PASSWORD_INCORRECT') form.setError('currentPassword', { message: 'errors.PASSWORD_INCORRECT' });
        else toast.error(errors.api(error));
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <h3 className="text-lg font-semibold">{hasPassword ? t('account.changePassword') : t('account.setPassword')}</h3>
      {!hasPassword && provider ? (
        <p className="text-muted-foreground">{t('account.setPasswordHint', { provider: PROVIDER_NAMES[provider] })}</p>
      ) : null}
      <FieldGroup className="max-w-md">
        {hasPassword ? (
          <PasswordField control={form.control} name="currentPassword" label={t('account.currentPassword')} />
        ) : null}
        <PasswordField
          control={form.control}
          name="newPassword"
          label={t('auth.newPassword')}
          autoComplete="new-password"
          description={t('auth.passwordHint', { min: PASSWORD_MIN_LENGTH })}
        />
        <div>
          <Button type="submit" variant="outline" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Spinner aria-hidden="true" /> : <LockKey size={18} aria-hidden="true" />}
            {hasPassword ? t('account.changePassword') : t('account.setPassword')}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

/** AUTH-06: confirmación con la contraseña o, si la cuenta no tiene, escribiendo el correo. */
function DeleteAccountDialog({ me, open, onOpenChange }: { me: MeResponse; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations();
  const errors = useErrorText();
  const router = useRouter();
  const locale = useLocale() as (typeof routing.locales)[number];
  const setUser = useSetSessionUser();
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasPassword = me.user.hasPassword;

  const confirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api('/v1/me', {
        method: 'DELETE',
        body: hasPassword ? { password: confirmation } : { confirmEmail: confirmation },
      });
      setUser(null);
      toast.success(t('account.accountDeleted'));
      router.replace(getPathname({ href: '/', locale }));
      router.refresh();
    } catch (apiError) {
      setError(errors.api(apiError));
      setDeleting(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setConfirmation('');
          setError(null);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('account.deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('account.deleteConfirmBody')}</AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor="delete-confirmation">
            {hasPassword ? t('account.deleteConfirmPassword') : t('account.deleteConfirmEmail', { email: me.user.email })}
          </FieldLabel>
          <Input
            id="delete-confirmation"
            type={hasPassword ? 'password' : 'email'}
            autoComplete={hasPassword ? 'current-password' : 'off'}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </Field>
        {error ? <FormAlert>{error}</FormAlert> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <Button type="button" variant="danger" onClick={confirm} disabled={deleting || confirmation.trim() === ''}>
            {deleting ? <Spinner aria-hidden="true" /> : <Trash size={18} aria-hidden="true" />}
            {t('account.deleteConfirmButton')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SecuritySection({ me }: { me: MeResponse }) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale() as (typeof routing.locales)[number];
  const signOut = useSignOut();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const leave = (everywhere: boolean) =>
    signOut.mutate(
      { everywhere },
      {
        onSuccess: () => {
          toast(everywhere ? t('account.signedOutAll') : t('auth.signedOut'));
          router.replace(getPathname({ href: '/', locale }));
        },
      },
    );

  return (
    <>
      <AccountSection id="seguridad" icon={LockKey} title={t('account.sections.security')}>
        <div className="grid gap-8">
          <ChangePasswordForm me={me} />
          <div className="grid gap-3 border-t border-border pt-6">
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 py-2 whitespace-normal"
                onClick={() => leave(false)} disabled={signOut.isPending}>
                <SignOut size={18} aria-hidden="true" />
                {t('account.signOut')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 py-2 whitespace-normal"
                onClick={() => leave(true)} disabled={signOut.isPending}>
                <Devices size={18} aria-hidden="true" />
                {t('account.signOutAll')}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{t('account.signOutAllHint')}</p>
          </div>
        </div>
      </AccountSection>

      {/* Zona de peligro: separada y en rojo (destructive-nav-separation). */}
      <AccountSection
        id="eliminar"
        icon={Warning}
        tone="danger"
        title={t('account.deleteAccount')}
        hint={t('account.deleteAccountHint')}
      >
        <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
          <Trash size={18} aria-hidden="true" />
          {t('account.deleteAccount')}
        </Button>
        <DeleteAccountDialog me={me} open={deleteOpen} onOpenChange={setDeleteOpen} />
      </AccountSection>
    </>
  );
}
