import { ShieldWarning } from '@phosphor-icons/react/ssr';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { TopoPattern } from '@/components/brand/topo-pattern';
import { AdminNav } from '@/components/admin/admin-nav';
import { getPathname, Link, redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getSessionUser } from '@/lib/api/host-server';

export async function generateMetadata({ params }: LayoutProps<'/[locale]/admin'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'admin' });
  // El panel de administración nunca se indexa (PLAN §6).
  return { title: { default: t('title'), template: `%s · ${t('title')}` }, robots: { index: false, follow: false } };
}

/** Administración (solo web, `noindex`): solo para el rol ADMIN; la API lo exige de nuevo en cada ruta. */
export default async function AdminLayout({ children }: LayoutProps<'/[locale]/admin'>) {
  const t = await getTranslations();
  const locale = (await getLocale()) as (typeof routing.locales)[number];
  const user = await getSessionUser();
  if (!user) {
    redirect({ href: { pathname: '/ingresar', query: { next: getPathname({ href: '/admin/guias', locale }) } }, locale });
  }

  return (
    <div>
      <header className="relative isolate overflow-hidden bg-night text-night-foreground clip-slope-b dark:bg-card">
        <TopoPattern variant="band" className="absolute inset-0 -z-10 size-full text-secondary/25" />
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-[calc(3.5vw+2rem)] sm:px-6 lg:px-8">
          <p className="tape">{t('admin.eyebrow')}</p>
          <h1 className="mt-4 font-display text-4xl leading-[0.95] font-extrabold uppercase italic sm:text-5xl">{t('admin.title')}</h1>
        </div>
      </header>
      {user?.role === 'ADMIN' ? (
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10 lg:px-8">
          <AdminNav />
          <div className="min-w-0">{children}</div>
        </div>
      ) : (
        <section className="mx-auto grid max-w-xl gap-4 px-4 py-20 text-center sm:px-6">
          <ShieldWarning size={48} weight="duotone" className="mx-auto text-destructive" aria-hidden="true" />
          <h2 className="font-display text-4xl font-extrabold uppercase italic">{t('admin.forbiddenTitle')}</h2>
          <p className="text-muted-foreground">{t('admin.forbiddenBody')}</p>
          <Link href="/" className="font-semibold text-primary underline-offset-4 hover:underline">
            {t('nav.explore')}
          </Link>
        </section>
      )}
    </div>
  );
}
