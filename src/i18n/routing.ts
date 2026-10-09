import { DEFAULT_LOCALE, LOCALES, WEB_PATHNAMES } from '@juandavidfuentes/indomitox-shared';
import { defineRouting } from 'next-intl/routing';

/**
 * Rutas con prefijo de idioma y slugs traducidos (SEO por idioma).
 * Cada ruta nueva de la web se registra aquí con su traducción. Las que también usan la API
 * (enlaces de los correos) o la app viven en `WEB_PATHNAMES` del paquete compartido.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  pathnames: {
    '/': '/',
    ...WEB_PATHNAMES,
    // Páginas de aterrizaje y detalle (SRCH-06, LIST-05): las direcciones de los deportes ya
    // vienen traducidas del catálogo (`/es/torrentismo`, `/en/canyoning`), no de next-intl.
    '/[sport]': '/[sport]',
    '/[sport]/[place]': '/[sport]/[place]',
    '/[sport]/[place]/[slug]': '/[sport]/[place]/[slug]',
  },
});
