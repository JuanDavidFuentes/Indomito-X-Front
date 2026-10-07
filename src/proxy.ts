import { AUTH_COOKIES, LOCALES, WEB_PATHNAMES, type Locale } from '@juandavidfuentes/indomitox-shared';
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intl = createMiddleware(routing);

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000';

/** Páginas que exigen sesión, en cada idioma (p. ej. /es/cuenta, /en/account). */
const PROTECTED = LOCALES.flatMap((locale) =>
  (['/cuenta'] as const).map((pathname) => ({ locale, prefix: `/${locale}${WEB_PATHNAMES[pathname][locale]}` })),
);

function protectedLocale(pathname: string): Locale | undefined {
  return PROTECTED.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.locale;
}

function withApiCookies(response: NextResponse, apiResponse: Response | null): NextResponse {
  for (const cookie of apiResponse?.headers.getSetCookie() ?? []) response.headers.append('set-cookie', cookie);
  return response;
}

/**
 * 1. En las páginas privadas: si el token de acceso venció (su cookie dura lo mismo que él)
 *    pero hay refresh token, renueva la sesión contra la API y recarga la misma URL con las
 *    cookies nuevas. Sin sesión, lleva a ingresar y luego de vuelta (AUTH-07).
 * 2. Después, el enrutamiento por idioma de next-intl.
 */
export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const locale = protectedLocale(pathname);

  if (locale && !request.cookies.has(AUTH_COOKIES.accessToken)) {
    const refreshToken = request.cookies.get(AUTH_COOKIES.refreshToken)?.value;
    let apiResponse: Response | null = null;
    if (refreshToken) {
      apiResponse = await fetch(`${API_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          cookie: `${AUTH_COOKIES.refreshToken}=${refreshToken}`,
          origin: WEB_URL,
          'user-agent': request.headers.get('user-agent') ?? '',
        },
      }).catch(() => null);
      if (apiResponse?.ok) return withApiCookies(NextResponse.redirect(request.nextUrl), apiResponse);
    }
    const signIn = new URL(`/${locale}${WEB_PATHNAMES['/ingresar'][locale]}`, request.url);
    signIn.searchParams.set('next', `${pathname}${search}`);
    return withApiCookies(NextResponse.redirect(signIn), apiResponse);
  }

  return intl(request);
}

export const config = {
  // Todo excepto /api, recursos internos de Next y archivos con extensión (favicon, imágenes…).
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
