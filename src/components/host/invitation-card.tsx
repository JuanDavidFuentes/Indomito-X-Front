'use client';

import type { HostMembershipSummary, InvitationPreview } from '@juandavidfuentes/indomitox-shared';
import { LinkBreak, UsersThree } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { FormAlert } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { useErrorText } from '@/lib/forms';
import { SESSION_KEY, useSession } from '@/lib/session';

/** Quien abre el enlace de la invitación (HOST-07): ve el Guía y el rol, ingresa y la acepta. */
export function InvitationCard({ token, preview }: { token: string | null; preview: InvitationPreview | null }) {
  const t = useTranslations();
  const errors = useErrorText();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: user, isPending } = useSession();
  const [accepting, setAccepting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (!token || !preview || preview.state !== 'PENDING') {
    return (
      <div className="grid justify-items-center gap-4 text-center">
        <LinkBreak size={48} weight="duotone" className="text-destructive" aria-hidden="true" />
        <h2 className="font-display text-3xl font-extrabold uppercase italic">{t('invitation.invalidTitle')}</h2>
        <p className="text-muted-foreground">{t('invitation.invalidBody')}</p>
      </div>
    );
  }

  const next = `${pathname}?token=${encodeURIComponent(token)}`;
  const accept = async () => {
    setAccepting(true);
    setFailure(null);
    try {
      const membership = await api<HostMembershipSummary>('/v1/invitations/accept', { method: 'POST', body: { token } });
      toast.success(t('invitation.accepted', { host: membership.name ?? preview.hostName ?? '' }));
      await queryClient.invalidateQueries({ queryKey: SESSION_KEY });
      router.push('/panel');
      router.refresh();
    } catch (error) {
      setFailure(errors.api(error));
      setAccepting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-start gap-4">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UsersThree size={28} weight="duotone" aria-hidden="true" />
        </span>
        <div>
          <p className="text-lg">
            {t('invitation.body', {
              inviter: preview.inviterName ?? 'Indómito X',
              host: preview.hostName ?? 'Indómito X',
              role: t(`hostRoles.${preview.role}`),
            })}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t(`hostRoleHints.${preview.role}`)}</p>
        </div>
      </div>
      <p className="rounded-lg bg-muted px-4 py-3 text-sm">{t('invitation.forEmail', { email: preview.emailHint })}</p>
      {failure ? <FormAlert>{failure}</FormAlert> : null}
      {isPending ? null : user ? (
        <Button size="lg" onClick={accept} disabled={accepting}>
          {accepting ? <Spinner aria-hidden="true" /> : null}
          {t('invitation.accept')}
        </Button>
      ) : (
        <div className="grid gap-3">
          <p>{t('invitation.signInToAccept')}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={{ pathname: '/ingresar', query: { next } }}
              className="inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t('auth.submitSignIn')}
            </Link>
            <Link
              href={{ pathname: '/registro', query: { next } }}
              className="inline-flex h-11 items-center rounded-lg border border-border px-5 font-semibold hover:bg-muted"
            >
              {t('auth.submitSignUp')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
