'use client';

import type { MeResponse, SavedParticipant, SportDto } from '@juandavidfuentes/indomitox-shared';
import {
  ArrowRight,
  CheckCircle,
  EnvelopeSimple,
  FirstAidKit,
  GoogleLogo,
  IdentificationCard,
  LockKey,
  Mountains,
  UsersThree,
  Warning,
  type Icon,
} from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { TopoPattern } from '@/components/brand/topo-pattern';
import { HostStatusBadge } from '@/components/host/status-badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { useErrorText } from '@/lib/forms';
import { ME_KEY, useMe } from './account-data';
import { EmergencySection } from './emergency-section';
import { ParticipantsSection } from './participants-section';
import { ProfileSection } from './profile-section';
import { SecuritySection } from './security-section';
import { SportsSection } from './sports-section';
import { UserAvatar } from './user-avatar';

const NAV: { id: string; icon: Icon; key: 'profile' | 'sports' | 'emergency' | 'participants' | 'security' }[] = [
  { id: 'datos', icon: IdentificationCard, key: 'profile' },
  { id: 'deportes', icon: Mountains, key: 'sports' },
  { id: 'emergencia', icon: FirstAidKit, key: 'emergency' },
  { id: 'participantes', icon: UsersThree, key: 'participants' },
  { id: 'seguridad', icon: LockKey, key: 'security' },
];

function VerifyEmailBanner({ email }: { email: string }) {
  const t = useTranslations('auth');
  const errors = useErrorText();
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);

  const resend = async () => {
    setSending(true);
    try {
      await api('/v1/auth/resend-verification', { method: 'POST' });
      toast.success(t('verificationSent'));
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_ALREADY_VERIFIED') {
        void queryClient.invalidateQueries({ queryKey: ME_KEY });
      } else {
        toast.error(errors.api(error));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="status"
      className="flex flex-col gap-4 rounded-xl border border-warning/50 bg-warning/10 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-start gap-3 font-medium">
        <EnvelopeSimple size={24} weight="duotone" className="mt-px shrink-0 text-warning" aria-hidden="true" />
        {t('verifyBanner', { email })}
      </p>
      <Button type="button" variant="outline" onClick={resend} disabled={sending} className="shrink-0">
        {sending ? <Spinner aria-hidden="true" /> : null}
        {t('resendVerification')}
      </Button>
    </div>
  );
}

/** Página "Mi cuenta" (EXP-02, AUTH-05, AUTH-06): encabezado Noche y secciones editables. */
export function AccountView({
  initialMe,
  initialParticipants,
  sports,
}: {
  initialMe: MeResponse;
  initialParticipants: SavedParticipant[];
  sports: SportDto[];
}) {
  const t = useTranslations();
  const format = useFormatter();
  const { data: me } = useMe(initialMe);
  const { user } = me;
  const firstName = user.name.split(/\s+/)[0] ?? user.name;

  return (
    <div>
      <header className="relative isolate overflow-hidden bg-night text-night-foreground clip-slope-b dark:bg-card">
        <TopoPattern variant="band" className="absolute inset-0 -z-10 size-full text-brand/25" />
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-12 pb-[calc(3.5vw+3rem)] sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <UserAvatar user={user} className="size-20 ring-4 ring-night-foreground/15 sm:size-24" textClassName="text-3xl" />
          <div className="min-w-0">
            <p className="tape">{t('account.title')}</p>
            <h1 className="mt-4 font-display text-5xl leading-[0.95] font-extrabold uppercase italic sm:text-6xl">
              {t('account.greeting', { name: firstName })}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-night-foreground/85">
              <span className="[overflow-wrap:anywhere]">{user.email}</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                {user.emailVerified ? (
                  <CheckCircle size={18} weight="fill" className="text-success" aria-hidden="true" />
                ) : (
                  <Warning size={18} weight="fill" className="text-accent" aria-hidden="true" />
                )}
                {user.emailVerified ? t('account.verified') : t('account.unverified')}
              </span>
              {user.providers.includes('GOOGLE') ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                  <GoogleLogo size={18} weight="bold" aria-hidden="true" />
                  {t('account.linkedWith', { provider: 'Google' })}
                </span>
              ) : null}
            </div>
            <p className="mt-2 font-display text-sm font-bold tracking-[0.2em] text-night-foreground/70 uppercase">
              {t('account.memberSince', {
                date: format.dateTime(new Date(user.createdAt), { month: 'long', year: 'numeric' }),
              })}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12 lg:px-8">
        <nav aria-label={t('account.title')} className="hidden lg:block">
          <ul className="sticky top-24 grid gap-1">
            {NAV.map(({ id, icon: NavIcon, key }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 leading-snug font-semibold text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                >
                  <NavIcon size={20} aria-hidden="true" />
                  {t(`account.sections.${key}`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid min-w-0 grid-cols-1 gap-8">
          {user.emailVerified ? null : <VerifyEmailBanner email={user.email} />}
          {/* AUTH-04: desde el perfil siempre se puede pasar a Guía. */}
          <div className="relative overflow-hidden rounded-xl bg-night p-6 text-night-foreground sm:p-8 dark:border dark:border-border dark:bg-card">
            <TopoPattern variant="band" className="absolute inset-0 -z-0 size-full text-brand/20" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="tape">{t('host.panelTitle')}</p>
                <h2 className="mt-4 font-display text-3xl leading-tight font-extrabold uppercase italic">
                  {user.host ? t('account.hostPanelTitle') : t('account.hostCtaTitle')}
                </h2>
                {user.host ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="font-semibold">{user.host.name ?? t('admin.unnamed')}</span>
                    <HostStatusBadge status={user.host.status} size="sm" />
                  </div>
                ) : (
                  <p className="mt-2 max-w-2xl text-night-foreground/85">{t('account.hostCtaBody')}</p>
                )}
              </div>
              <Link
                href="/panel"
                className="inline-flex h-12 shrink-0 items-center gap-2 self-start rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 sm:self-auto"
              >
                {user.host ? t('account.hostPanelButton') : t('account.hostCtaButton')}
                <ArrowRight size={20} weight="bold" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <ProfileSection me={me} />
          <SportsSection me={me} sports={sports} />
          <EmergencySection me={me} />
          <ParticipantsSection initial={initialParticipants} />
          <SecuritySection me={me} />
        </div>
      </div>
    </div>
  );
}
