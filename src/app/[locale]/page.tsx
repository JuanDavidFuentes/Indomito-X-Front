import { SPORT_ELEMENTS, type SportElement } from '@juandavidfuentes/indomitox-shared';
import {
  ArrowRight,
  Certificate,
  DeviceMobile,
  Flashlight,
  Lightning,
  MagnifyingGlass,
  MapPin,
  Mountains,
  ShieldCheck,
  Waves,
  Wind,
} from '@phosphor-icons/react/ssr';
import type { Icon } from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { TopoPattern } from '@/components/brand/topo-pattern';
import { getPathname, Link } from '@/i18n/navigation';

const ELEMENT_ICONS: Record<SportElement, Icon> = {
  WATER: Waves,
  AIR: Wind,
  LAND: Mountains,
  UNDERGROUND: Flashlight,
  PARK: Lightning,
};

/** Color de cada elemento (tokens): agua = Río, aire = Sol, tierra = Lava, etc. */
const ELEMENT_STYLES: Record<SportElement, string> = {
  WATER: 'bg-secondary text-secondary-foreground',
  AIR: 'bg-accent text-accent-foreground',
  LAND: 'bg-primary text-primary-foreground',
  UNDERGROUND: 'bg-night text-night-foreground ring-1 ring-border',
  PARK: 'bg-adrenaline text-adrenaline-foreground',
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ValueStrip />
      <Elements />
      <HostCta />
      <AppCta />
    </>
  );
}

function Hero() {
  const t = useTranslations('home');
  const locale = useLocale();

  return (
    <section className="relative isolate overflow-hidden bg-night text-night-foreground">
      <TopoPattern className="absolute inset-0 -z-10 size-full text-brand/30" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-night/50 to-night" />
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 md:pt-28 md:pb-32 lg:px-8">
        <p className="font-display text-sm font-semibold tracking-[0.25em] text-accent uppercase">
          {t('heroEyebrow')}
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[0.95] font-bold uppercase sm:text-6xl lg:text-7xl">
          {t('heroTitle')}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-night-foreground/85 sm:text-xl">
          {t('heroSubtitle')}
        </p>

        <form
          action={getPathname({ href: '/buscar', locale })}
          role="search"
          className="mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl bg-card p-3 text-card-foreground shadow-2xl sm:flex-row sm:items-end"
        >
          <label className="flex flex-1 flex-col gap-1 px-2 pt-1">
            <span className="text-sm font-semibold">{t('searchLabel')}</span>
            <span className="flex items-center gap-2">
              <MapPin size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                name="q"
                type="search"
                autoComplete="off"
                placeholder={t('searchPlaceholder')}
                className="h-11 w-full bg-transparent text-base placeholder:text-muted-foreground focus-visible:outline-none"
              />
            </span>
          </label>
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-[filter] duration-150 hover:brightness-110 active:brightness-95"
          >
            <MagnifyingGlass size={20} weight="bold" aria-hidden="true" />
            {t('searchButton')}
          </button>
        </form>
      </div>
    </section>
  );
}

function ValueStrip() {
  const t = useTranslations('home');
  const items = [
    { icon: Certificate, label: t('valueVerified') },
    { icon: ShieldCheck, label: t('valueSafety') },
    { icon: MapPin, label: t('valueLocal') },
  ];

  return (
    <section className="border-b border-border bg-card">
      <ul className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
        {items.map(({ icon: ItemIcon, label }) => (
          <li key={label} className="flex items-center gap-3 font-medium">
            <ItemIcon size={24} className="shrink-0 text-primary" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Elements() {
  const t = useTranslations();

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <h2 className="font-display text-4xl font-bold uppercase sm:text-5xl">
        {t('home.elementsTitle')}
      </h2>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{t('home.elementsSubtitle')}</p>
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {SPORT_ELEMENTS.map((element) => {
          const ElementIcon = ELEMENT_ICONS[element];
          return (
            <li
              key={element}
              className={`group relative flex min-h-40 flex-col justify-between overflow-hidden rounded-2xl p-4 last:col-span-2 sm:min-h-48 sm:p-5 lg:last:col-span-1 ${ELEMENT_STYLES[element]}`}
            >
              <ElementIcon size={36} weight="duotone" aria-hidden="true" />
              <div>
                <h3 className="font-display text-2xl leading-none font-bold uppercase sm:text-3xl">
                  {t(`elements.${element}`)}
                </h3>
                <p className="mt-1 text-sm font-medium opacity-90">
                  {t(`home.elementExamples.${element}`)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function HostCta() {
  const t = useTranslations('home');

  return (
    <section className="bg-muted">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl font-bold uppercase">{t('hostCtaTitle')}</h2>
          <p className="mt-3 text-lg text-muted-foreground">{t('hostCtaBody')}</p>
        </div>
        <Link
          href="/"
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl border-2 border-foreground px-6 font-semibold transition-colors duration-150 hover:bg-foreground hover:text-background"
        >
          {t('hostCtaButton')}
          <ArrowRight size={20} weight="bold" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function AppCta() {
  const t = useTranslations();

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-2xl bg-secondary p-8 text-secondary-foreground md:flex-row md:items-center">
        <DeviceMobile size={56} weight="duotone" className="shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <h2 className="font-display text-3xl font-bold uppercase">{t('home.appCtaTitle')}</h2>
          <p className="mt-2 text-lg opacity-95">{t('home.appCtaBody')}</p>
        </div>
        <span className="self-start rounded-full bg-secondary-foreground/15 px-4 py-2 text-sm font-semibold md:self-auto">
          {t('common.comingSoon')}
        </span>
      </div>
    </section>
  );
}
