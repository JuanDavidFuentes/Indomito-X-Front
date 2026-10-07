import { HERO_FIELD_DATA, PHOTO_CREDITS, TAGLINES, type PhotoId } from '@juandavidfuentes/indomitox-shared';
import { Certificate, ShieldCheck, UsersThree } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { TopoPattern } from '@/components/brand/topo-pattern';
import { routing } from '@/i18n/routing';
import { PHOTOS } from '@/lib/photos';

/**
 * Marco de las pantallas de autenticación ("Expedición Santander"): foto real con velo Noche,
 * curvas de nivel, cinta y datos de campo a la izquierda; el formulario en una tarjeta a la
 * derecha. En el móvil la foto queda como franja con corte diagonal y la tarjeta la monta.
 */
export function AuthShell({
  photo,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  photo: PhotoId;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const t = useTranslations();
  const locale = useLocale() as (typeof routing.locales)[number];
  const credit = PHOTO_CREDITS[photo];

  return (
    <div className="relative">
      <div aria-hidden="true" className="relative h-44 overflow-hidden bg-night clip-slope-b sm:h-52 lg:hidden">
        <Image src={PHOTOS[photo]} alt="" fill sizes="100vw" quality={70} placeholder="blur" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/40 to-night/20" />
        <TopoPattern variant="band" className="absolute inset-0 size-full text-brand/30" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8 lg:py-14">
        <aside className="relative isolate hidden min-h-[38rem] overflow-hidden rounded-2xl bg-night text-night-foreground lg:flex lg:flex-col lg:justify-end">
          <Image
            src={PHOTOS[photo]}
            alt={t(`photos.${photo}`)}
            fill
            sizes="(min-width: 1024px) 40rem, 1px"
            quality={75}
            placeholder="blur"
            className="-z-20 object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/70 to-night/10" />
          <TopoPattern variant="band" className="absolute inset-0 -z-10 size-full text-brand/25" />
          <div className="p-10">
            <p className="tape">
              {t('home.heroCoordinates')} · {t('home.heroAltitude', { meters: HERO_FIELD_DATA.altitudeM })}
            </p>
            <p className="mt-6 max-w-md font-display text-5xl leading-[0.92] font-extrabold uppercase italic xl:text-6xl">
              {TAGLINES[locale]}
            </p>
            <ul className="mt-8 grid gap-3 text-night-foreground/90">
              <li className="flex items-center gap-3">
                <Certificate size={22} className="text-accent" aria-hidden="true" />
                {t('home.valueVerified')}
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck size={22} className="text-accent" aria-hidden="true" />
                {t('home.valueSafety')}
              </li>
              <li className="flex items-center gap-3">
                <UsersThree size={22} className="text-accent" aria-hidden="true" />
                {t('home.valueLocal')}
              </li>
            </ul>
            <p className="mt-10 text-xs text-night-foreground/70">
              {t('common.photoCredit', { author: credit.author, license: credit.license })}
            </p>
          </div>
        </aside>

        <div className="relative -mt-20 sm:-mt-24 lg:mt-0 lg:flex lg:items-center">
          <div className="mx-auto w-full max-w-md animate-rise rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl shadow-night/10 sm:p-8">
            <p className="tape">{eyebrow}</p>
            <h1 className="mt-5 font-display text-4xl leading-[0.95] font-extrabold uppercase italic sm:text-5xl">{title}</h1>
            {subtitle ? <p className="mt-3 text-muted-foreground">{subtitle}</p> : null}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
