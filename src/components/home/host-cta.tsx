import { ArrowRight } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { TopoPattern } from '@/components/brand/topo-pattern';
import { Link } from '@/i18n/navigation';
import { PHOTOS } from '@/lib/photos';

/** Llamado a los Guías: bloque Noche con corte diagonal superior y foto de un guía en acción. */
export function HostCta() {
  const t = useTranslations();

  return (
    <section
      id="guias"
      aria-labelledby="guias-titulo"
      className="relative isolate overflow-hidden bg-night text-night-foreground clip-slope-t dark:bg-card"
    >
      <TopoPattern variant="band" className="absolute inset-0 -z-10 size-full text-brand/25" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-[calc(3.5vw+4rem)] pb-20 sm:px-6 md:grid-cols-2 md:gap-14 lg:px-8">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl [clip-path:polygon(0_0,100%_5%,100%_100%,0_95%)]">
          <Image
            src={PHOTOS['guia-rafting']}
            alt={t('photos.guia-rafting')}
            fill
            sizes="(min-width: 768px) 40rem, 100vw"
            quality={70}
            placeholder="blur"
            className="object-cover"
          />
        </div>
        <div>
          <p className="tape">{t('home.hostCtaEyebrow')}</p>
          <h2
            id="guias-titulo"
            className="mt-6 font-display text-4xl leading-[0.95] font-extrabold uppercase italic sm:text-5xl"
          >
            {t('home.hostCtaTitle')}
          </h2>
          <p className="mt-4 max-w-xl text-lg text-night-foreground/85">{t('home.hostCtaBody')}</p>
          <Link
            href="/panel"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl border-2 border-night-foreground px-6 font-semibold transition-colors duration-150 hover:bg-night-foreground hover:text-night"
          >
            {t('home.hostCtaButton')}
            <ArrowRight size={20} weight="bold" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
