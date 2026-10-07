import type { HostTeamResponse } from '@juandavidfuentes/indomitox-shared';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { loadHostOr } from '@/components/host/panel-fallbacks';
import { TeamView } from '@/components/host/team-view';
import { routing } from '@/i18n/routing';
import { serverApi } from '@/lib/api/server';

export async function generateMetadata({ params }: PageProps<'/[locale]/panel/equipo'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'host.nav' });
  return { title: t('team') };
}

/** Equipo del Guía (HOST-07). */
export default async function TeamPage() {
  const loaded = await loadHostOr('/panel/equipo');
  if ('fallback' in loaded) return loaded.fallback;
  const team = await serverApi<HostTeamResponse>('/v1/host/team');
  return <TeamView initialHost={loaded.mine} initialTeam={team.ok ? team.data : { members: [], invitations: [] }} />;
}
