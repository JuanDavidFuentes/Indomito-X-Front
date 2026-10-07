'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  INVITABLE_ROLES,
  InviteMemberSchema,
  type HostInvitationDto,
  type HostMemberDto,
  type HostTeamResponse,
  type InvitableRole,
  type InviteMemberInput,
  type MyHostResponse,
} from '@juandavidfuentes/indomitox-shared';
import { EnvelopeSimple, PaperPlaneTilt, SignOut, Trash, UserPlus, UsersThree } from '@phosphor-icons/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/account/user-avatar';
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
import { Field, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { applyApiIssues, useErrorText } from '@/lib/forms';
import { useMyHost } from '@/lib/host';
import { SESSION_KEY, useSession } from '@/lib/session';
import { LockedNotice } from './autosave-indicator';

const TEAM_KEY = ['host', 'team'] as const;

function RoleSelect({ value, onChange, id, label }: { value: InvitableRole; onChange: (role: InvitableRole) => void; id?: string; label?: string }) {
  const t = useTranslations();
  return (
    <Select value={value} onValueChange={(role) => onChange(role as InvitableRole)}>
      <SelectTrigger id={id} aria-label={label} className="w-full sm:w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {INVITABLE_ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {t(`hostRoles.${role}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function InviteForm({ onInvited }: { onInvited: () => void }) {
  const t = useTranslations();
  const errors = useErrorText();
  const roleId = useId();
  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(InviteMemberSchema) as unknown as Resolver<InviteMemberInput>,
    defaultValues: { email: '', role: 'STAFF' },
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await api<HostInvitationDto>('/v1/host/invitations', { method: 'POST', body: values });
      toast.success(t('team.inviteSent', { email: values.email }));
      form.reset({ email: '', role: values.role });
      onInvited();
    } catch (error) {
      if (!applyApiIssues(error, form.setError)) toast.error(errors.api(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 rounded-xl border border-border bg-muted/40 p-5">
      <div>
        <h3 className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase italic">
          <UserPlus size={24} weight="duotone" className="text-primary" aria-hidden="true" />
          {t('team.inviteTitle')}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('team.inviteBody')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <TextField control={form.control} name="email" label={t('team.inviteEmail')} type="email" inputMode="email" autoComplete="off" />
        <Controller
          control={form.control}
          name="role"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={roleId}>{t('team.inviteRole')}</FieldLabel>
              <RoleSelect id={roleId} value={field.value} onChange={field.onChange} />
            </Field>
          )}
        />
      </div>
      <div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Spinner aria-hidden="true" /> : <PaperPlaneTilt size={18} weight="bold" aria-hidden="true" />}
          {t('team.invite')}
        </Button>
      </div>
    </form>
  );
}

/** Equipo del Guía (HOST-07): miembros con su rol, invitaciones pendientes y salir del equipo. */
export function TeamView({ initialHost, initialTeam }: { initialHost: MyHostResponse; initialTeam: HostTeamResponse }) {
  const t = useTranslations();
  const format = useFormatter();
  const errors = useErrorText();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { data: mine } = useMyHost(initialHost);
  const { data: team } = useQuery({
    queryKey: TEAM_KEY,
    queryFn: () => api<HostTeamResponse>('/v1/host/team'),
    initialData: initialTeam,
  });
  const [removing, setRemoving] = useState<HostMemberDto | null>(null);
  const manages = mine.permissions.includes('team.manage');
  const refresh = () => void queryClient.invalidateQueries({ queryKey: TEAM_KEY });

  const changeRole = async (member: HostMemberDto, role: InvitableRole) => {
    try {
      queryClient.setQueryData(TEAM_KEY, await api<HostTeamResponse>(`/v1/host/members/${member.userId}`, { method: 'PATCH', body: { role } }));
      toast.success(t('team.roleChanged'));
    } catch (error) {
      toast.error(errors.api(error));
    }
  };

  const revoke = async (invitation: HostInvitationDto) => {
    try {
      await api(`/v1/host/invitations/${invitation.id}`, { method: 'DELETE' });
      toast.success(t('team.revoked'));
      refresh();
    } catch (error) {
      toast.error(errors.api(error));
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    const self = removing.userId === session?.id;
    try {
      await api(`/v1/host/members/${removing.userId}`, { method: 'DELETE' });
      if (self) {
        toast.success(t('team.left'));
        await queryClient.invalidateQueries({ queryKey: SESSION_KEY });
        router.push('/cuenta');
        router.refresh();
      } else {
        toast.success(t('team.removed', { name: removing.name }));
        refresh();
      }
    } catch (error) {
      toast.error(errors.api(error));
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <section aria-labelledby="team-title" className="rounded-xl border border-border bg-card p-5 sm:p-8">
        <h2 id="team-title" className="flex items-center gap-3 font-display text-4xl leading-tight font-extrabold uppercase italic">
          <UsersThree size={32} weight="duotone" className="text-primary" aria-hidden="true" />
          {t('team.title')}
        </h2>
        <p className="mt-2 text-muted-foreground">{t('team.hint')}</p>

        <h3 className="mt-8 text-sm font-semibold tracking-wide text-muted-foreground uppercase">{t('team.members')}</h3>
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
          {team.members.map((member) => {
            const isYou = member.userId === session?.id;
            const isOwner = member.role === 'OWNER';
            return (
              <li key={member.userId} className="flex flex-wrap items-center gap-4 p-4">
                <UserAvatar user={member} className="size-11" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold [overflow-wrap:anywhere]">
                    {member.name} {isYou ? <span className="text-sm font-normal text-muted-foreground">({t('team.you')})</span> : null}
                  </p>
                  <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{member.email}</p>
                </div>
                {manages && !isOwner && !isYou ? (
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <RoleSelect value={member.role as InvitableRole} label={t('team.changeRole')} onChange={(role) => void changeRole(member, role)} />
                    <Button type="button" variant="ghost" size="icon" aria-label={t('team.remove')} onClick={() => setRemoving(member)}>
                      <Trash size={18} aria-hidden="true" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold" title={t(`hostRoleHints.${member.role}`)}>
                      {t(`hostRoles.${member.role}`)}
                    </span>
                    {isYou && !isOwner ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => setRemoving(member)}>
                        <SignOut size={16} aria-hidden="true" />
                        {t('team.leave')}
                      </Button>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <ul className="mt-4 grid gap-1 text-sm text-muted-foreground">
          {(['OWNER', 'MANAGER', 'STAFF'] as const).map((role) => (
            <li key={role}>
              <span className="font-semibold text-foreground">{t(`hostRoles.${role}`)}:</span> {t(`hostRoleHints.${role}`)}
            </li>
          ))}
        </ul>
      </section>

      {manages ? (
        <>
          <InviteForm onInvited={refresh} />
          <section aria-labelledby="invitations-title" className="rounded-xl border border-border bg-card p-5 sm:p-8">
            <h2 id="invitations-title" className="font-display text-2xl font-extrabold uppercase italic">
              {t('team.invitations')}
            </h2>
            {team.invitations.length === 0 ? (
              <p className="mt-3 text-muted-foreground">{t('team.noInvitations')}</p>
            ) : (
              <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
                {team.invitations.map((invitation) => (
                  <li key={invitation.id} className="flex flex-wrap items-center gap-4 p-4">
                    <EnvelopeSimple size={24} className="text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold [overflow-wrap:anywhere]">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {t(`hostRoles.${invitation.role}`)} ·{' '}
                        {t('team.inviteExpires', { date: format.dateTime(new Date(invitation.expiresAt), { dateStyle: 'medium' }) })}
                        {invitation.invitedByName ? ` · ${t('team.invitedBy', { name: invitation.invitedByName })}` : ''}
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => void revoke(invitation)}>
                      {t('team.revoke')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <LockedNotice>{t('team.ownerOnly')}</LockedNotice>
      )}

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{removing?.userId === session?.id ? t('team.leave') : t('team.remove')}</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.userId === session?.id
                ? t('team.leaveConfirm', { host: mine.host.tradeName ?? '' })
                : t('team.removeConfirm', { name: removing?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={() => void confirmRemove()}>
              {removing?.userId === session?.id ? t('team.leave') : t('team.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
