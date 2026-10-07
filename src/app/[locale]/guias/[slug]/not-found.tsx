import { Compass } from '@phosphor-icons/react/ssr';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/** El Guía no existe, no está aprobado o fue suspendido. */
export default function GuideNotFound() {
  const t = useTranslations();
  return (
    <section className="mx-auto grid max-w-xl justify-items-center gap-4 px-4 py-24 text-center sm:px-6">
      <Compass size={52} weight="duotone" className="text-primary" aria-hidden="true" />
      <h1 className="font-display text-4xl leading-tight font-extrabold uppercase italic">{t('guide.notFoundTitle')}</h1>
      <p className="text-muted-foreground">{t('guide.notFoundBody')}</p>
      <Link href="/" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
        {t('guide.exploreMore')}
      </Link>
    </section>
  );
}
