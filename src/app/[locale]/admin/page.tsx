import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import type { routing } from '@/i18n/routing';

/** /admin abre la verificación de Guías (la única sección hasta F7). */
export default async function AdminPage() {
  const locale = (await getLocale()) as (typeof routing.locales)[number];
  redirect({ href: '/admin/guias', locale });
}
