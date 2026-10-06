import { DEFAULT_LOCALE, LOCALES } from '@juandavidfuentes/indomitox-shared';
import { defineRouting } from 'next-intl/routing';

/**
 * Rutas con prefijo de idioma y slugs traducidos (SEO por idioma).
 * Cada ruta nueva de la web se registra aquí con su traducción.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  pathnames: {
    '/': '/',
    '/buscar': { es: '/buscar', en: '/search', fr: '/recherche' },
  },
});
