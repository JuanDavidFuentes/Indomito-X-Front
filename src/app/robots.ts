import { LOCALES, PRIVATE_WEB_PATHNAMES, WEB_PATHNAMES } from '@juandavidfuentes/indomitox-shared';
import type { MetadataRoute } from 'next';
import { WEB_URL } from '@/lib/api/public';

/** robots.txt: todo lo público se indexa; la cuenta, el panel del Guía y la administración, no. */
export default function robots(): MetadataRoute.Robots {
  const privatePrefixes = LOCALES.flatMap((locale) => PRIVATE_WEB_PATHNAMES.map((pathname) => `/${locale}${WEB_PATHNAMES[pathname][locale]}`));
  return {
    rules: { userAgent: '*', allow: '/', disallow: [...new Set(privatePrefixes)] },
    sitemap: `${WEB_URL}/sitemap.xml`,
    host: WEB_URL,
  };
}
