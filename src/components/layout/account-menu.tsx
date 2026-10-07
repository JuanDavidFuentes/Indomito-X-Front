'use client';

import { LOCALES, WEB_PATHNAMES } from '@juandavidfuentes/indomitox-shared';
import { Compass, ShieldCheck, SignOut, UserCircle } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/account/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from '@/i18n/navigation';
import { hasSessionHint } from '@/lib/api/client';
import { useSession, useSignOut } from '@/lib/session';

const subscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

/** Páginas de autenticación: no se vuelve a ellas después de ingresar. */
const AUTH_PAGES = new Set(
  LOCALES.flatMap((locale) =>
    (['/ingresar', '/registro', '/recuperar', '/verificar'] as const).map(
      (pathname) => `/${locale}${WEB_PATHNAMES[pathname][locale]}`,
    ),
  ),
);

/**
 * Cuenta en el encabezado. La sesión solo se conoce en el navegador (la portada es estática):
 * mientras se carga se reserva el espacio para que el encabezado no salte.
 */
export function AccountMenu() {
  const t = useTranslations();
  const isClient = useIsClient();
  const pathname = usePathname();
  const { data: user, isPending } = useSession();
  const signOut = useSignOut();

  if (!isClient || (isPending && hasSessionHint())) {
    return <span aria-hidden="true" className="inline-block size-11 animate-pulse rounded-full bg-current/10" />;
  }

  if (!user) {
    const next = AUTH_PAGES.has(pathname) ? undefined : `${pathname}${window.location.search}`;
    return (
      <Link
        href={{ pathname: '/ingresar', query: next ? { next } : undefined }}
        className="inline-flex h-11 items-center gap-2 rounded-full px-3 font-semibold transition-colors duration-150 hover:bg-current/10 sm:px-4"
      >
        <UserCircle size={24} aria-hidden="true" />
        <span className="max-sm:sr-only">{t('nav.signIn')}</span>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('nav.accountMenu')}
        className="inline-flex size-11 items-center justify-center rounded-full transition-colors duration-150 hover:bg-current/10"
      >
        <UserAvatar user={user} className="size-9" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="grid gap-0.5 px-2 py-2">
          <span className="truncate text-base font-semibold text-foreground">{user.name}</span>
          <span className="truncate text-sm font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/cuenta">
            <UserCircle size={20} aria-hidden="true" />
            {t('nav.account')}
          </Link>
        </DropdownMenuItem>
        {user.host || user.signupIntent === 'HOST' ? (
          <DropdownMenuItem asChild>
            <Link href="/panel">
              <Compass size={20} aria-hidden="true" />
              {t('nav.hostPanel')}
            </Link>
          </DropdownMenuItem>
        ) : null}
        {user.role === 'ADMIN' ? (
          <DropdownMenuItem asChild>
            <Link href="/admin/guias">
              <ShieldCheck size={20} aria-hidden="true" />
              {t('nav.admin')}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => signOut.mutate({}, { onSuccess: () => toast(t('auth.signedOut')) })}
        >
          <SignOut size={20} aria-hidden="true" />
          {t('nav.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
