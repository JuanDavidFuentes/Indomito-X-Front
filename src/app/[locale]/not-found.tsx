import { Compass } from '@phosphor-icons/react/ssr';
import { getTranslations } from 'next-intl/server';
import { TopoPattern } from '@/components/brand/topo-pattern';
import { Link } from '@/i18n/navigation';

/** Página no encontrada (un deporte o un destino que no existe, una dirección mal escrita…). */
export default async function NotFound() {
  const t = await getTranslations();
  return (
    <section className="relative isolate overflow-hidden">
      <TopoPattern variant="band" className="absolute inset-0 -z-10 size-full text-primary/10" />
      <div className="mx-auto grid max-w-2xl justify-items-center gap-4 px-4 py-24 text-center">
        <Compass size={56} weight="duotone" className="text-primary" aria-hidden="true" />
        <h1 className="font-display text-4xl leading-tight font-extrabold uppercase italic sm:text-5xl">{t('notFound.title')}</h1>
        <p className="text-lg text-muted-foreground">{t('notFound.body')}</p>
        <Link href="/buscar" className="mt-2 inline-flex h-12 items-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90">
          {t('guide.exploreMore')}
        </Link>
      </div>
    </section>
  );
}
