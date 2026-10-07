import { HERO_FIELD_DATA, HOME_SPORTS, PHOTO_CREDITS } from '@juandavidfuentes/indomitox-shared';
import { CalendarBlank, MagnifyingGlass, MapPin } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { TopoPattern } from '@/components/brand/topo-pattern';
import { getPathname, Link } from '@/i18n/navigation';
import { PHOTOS } from '@/lib/photos';

const HERO_PHOTO = 'hero-chicamocha-parapente';

/**
 * Hero a sangre con la foto del Chicamocha, curvas de nivel, titular itálico y buscador.
 * Sube 4rem (-mt-16) para quedar debajo del encabezado transparente de la portada.
 */
export function Hero() {
  const t = useTranslations();
  const locale = useLocale();
  const credit = PHOTO_CREDITS[HERO_PHOTO];

  return (
    <section className="relative isolate -mt-16 overflow-hidden bg-night text-night-foreground clip-slope-b">
      {/* En móvil el encuadre corre a la izquierda para que el parapentista quede junto al titular. */}
      <Image
        src={PHOTOS[HERO_PHOTO]}
        alt={t(`photos.${HERO_PHOTO}`)}
        fill
        preload
        sizes="100vw"
        quality={80}
        placeholder="blur"
        className="-z-30 object-cover object-[40%_40%] md:object-[50%_40%]"
      />
      {/* Velos Noche: garantizan el contraste del texto sobre la foto. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-gradient-to-r from-night/95 via-night/75 to-night/45 md:via-night/60 md:via-40% md:to-night/0 md:to-75%"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-gradient-to-t from-night/85 via-night/0 via-45%" />
      <TopoPattern className="absolute inset-y-0 left-0 -z-10 h-full w-full text-brand/35 motion-safe:animate-drift md:w-[62%]" />

      <div className="mx-auto max-w-7xl px-4 pt-32 pb-[calc(3.5vw+7rem)] sm:px-6 md:pt-44 lg:px-8">
        <div className="max-w-2xl">
          <div className="animate-rise">
            <p className="tape">{t('home.heroEyebrow')}</p>
          </div>
          <h1 className="mt-6 animate-rise font-display text-5xl leading-[0.92] font-extrabold uppercase italic [animation-delay:90ms] sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
            {t('home.heroTitleLead')} <span className="text-brand">{t('home.heroTitleHighlight')}</span>
          </h1>
          <p className="mt-6 max-w-xl animate-rise text-lg text-night-foreground/90 [animation-delay:180ms] sm:text-xl">
            {t('home.heroSubtitle')}
          </p>

          <form
            action={getPathname({ href: '/buscar', locale })}
            role="search"
            className="mt-8 grid max-w-2xl animate-rise gap-1 rounded-2xl bg-card p-2 text-card-foreground shadow-2xl shadow-night/50 [animation-delay:270ms] sm:grid-cols-[1.4fr_1fr_auto]"
          >
            <label className="flex flex-col justify-center gap-0.5 rounded-xl px-3 py-2 transition-colors focus-within:bg-muted">
              <span className="text-xs font-bold tracking-[0.08em] uppercase">{t('home.searchLabel')}</span>
              <span className="flex items-center gap-2">
                <MapPin size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  name="q"
                  type="search"
                  autoComplete="off"
                  placeholder={t('home.searchPlaceholder')}
                  className="h-9 w-full min-w-0 bg-transparent text-base placeholder:text-muted-foreground focus-visible:outline-none"
                />
              </span>
            </label>
            <label className="flex flex-col justify-center gap-0.5 rounded-xl px-3 py-2 transition-colors focus-within:bg-muted sm:border-l sm:border-border">
              <span className="text-xs font-bold tracking-[0.08em] uppercase">{t('home.searchWhen')}</span>
              <span className="flex items-center gap-2">
                <CalendarBlank size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  name="fecha"
                  type="date"
                  className="h-9 w-full min-w-0 bg-transparent text-base text-card-foreground focus-visible:outline-none"
                />
              </span>
            </label>
            <button
              type="submit"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
            >
              <MagnifyingGlass size={20} weight="bold" aria-hidden="true" />
              {t('home.searchButton')}
            </button>
          </form>

          <nav aria-label={t('home.quickSports')} className="mt-6 animate-rise [animation-delay:360ms]">
            <ul className="flex flex-wrap gap-2">
              {HOME_SPORTS.slice(0, 5).map((sport) => (
                <li key={sport}>
                  <Link
                    href={{ pathname: '/buscar', query: { deporte: sport } }}
                    className="inline-flex h-11 items-center rounded-full border border-night-foreground/30 bg-night-foreground/10 px-4 text-sm font-semibold backdrop-blur-sm transition-colors duration-150 hover:bg-night-foreground/20"
                  >
                    {t(`sports.${sport}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Datos de campo + crédito de la foto (CC BY-SA exige autor y licencia). */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(3.5vw+4.5rem)] mx-auto hidden max-w-7xl justify-end px-4 sm:px-6 md:flex lg:px-8">
        <p className="pointer-events-auto text-right font-display text-sm font-semibold tracking-[0.14em] text-night-foreground/90">
          {t('home.heroCoordinates')} · {t('home.heroAltitude', { meters: HERO_FIELD_DATA.altitudeM })}
          <a
            href={credit.sourceUrl}
            className="mt-1 block font-sans text-xs font-normal tracking-normal normal-case text-night-foreground/80 hover:underline"
          >
            {t('common.photoCredit', { author: credit.author, license: credit.license })}
          </a>
        </p>
      </div>
      <a
        href={credit.sourceUrl}
        className="absolute right-4 bottom-[calc(3.5vw+4rem)] text-xs text-night-foreground/80 hover:underline md:hidden"
      >
        {t('common.photoCredit', { author: credit.author, license: credit.license })}
      </a>
    </section>
  );
}
