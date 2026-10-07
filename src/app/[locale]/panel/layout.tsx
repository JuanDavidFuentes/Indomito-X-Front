import type { Metadata } from 'next';
import Image from 'next/image';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { LogoMark } from '@/components/brand/logo';
import { TopoPattern } from '@/components/brand/topo-pattern';
import { PanelNav } from '@/components/host/panel-nav';
import { HostStatusBadge } from '@/components/host/status-badge';
import { routing } from '@/i18n/routing';
import { getMyHost } from '@/lib/api/host-server';

export async function generateMetadata({ params }: LayoutProps<'/[locale]/panel'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'host' });
  return { title: { default: t('panelTitle'), template: `%s · ${t('panelTitle')}` }, robots: { index: false } };
}

/** Panel del Guía: encabezado Noche con su marca y estado, y navegación lateral desde 1024 px. */
export default async function PanelLayout({ children }: LayoutProps<'/[locale]/panel'>) {
  const t = await getTranslations();
  const result = await getMyHost();
  const mine = result.ok ? result.data : null;

  return (
    <div>
      <header className="relative isolate overflow-hidden bg-night text-night-foreground clip-slope-b dark:bg-card">
        <TopoPattern variant="band" className="absolute inset-0 -z-10 size-full text-brand/25" />
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 pt-10 pb-[calc(3.5vw+2.5rem)] sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="size-20 shrink-0 overflow-hidden rounded-full bg-night ring-4 ring-night-foreground/15 sm:size-24">
            {mine?.host.logoUrl ? (
              <Image src={mine.host.logoUrl} alt="" width={96} height={96} className="size-full object-cover" />
            ) : (
              <LogoMark className="size-full p-3" />
            )}
          </div>
          <div className="min-w-0">
            <p className="tape">{t('host.panelTitle')}</p>
            <h1 className="mt-4 font-display text-4xl leading-[0.95] font-extrabold uppercase italic [overflow-wrap:anywhere] sm:text-5xl">
              {mine ? (mine.host.tradeName ?? mine.host.legalName ?? t('host.startTitle')) : t('host.startEyebrow')}
            </h1>
            {mine ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <HostStatusBadge status={mine.host.status} />
                <span className="text-night-foreground/85">{t(`hostStatusHint.${mine.host.status}`)}</span>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      {/* Sin cuenta de Guía todas las secciones llevan a "Conviértete en Guía": no se muestra la navegación. */}
      <div
        className={`mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:gap-12 lg:px-8 ${mine ? 'lg:grid-cols-[15rem_minmax(0,1fr)]' : ''}`}
      >
        {mine ? <PanelNav publicSlug={mine.host.status === 'APPROVED' ? mine.host.slug : null} /> : null}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
