import type { Messages } from '@juandavidfuentes/indomitox-shared/i18n';
import type { routing } from './routing';

// Tipado estricto de claves de traducción y de idiomas en next-intl.
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
  }
}
