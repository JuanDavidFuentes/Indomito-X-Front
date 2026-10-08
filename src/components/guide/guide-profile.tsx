import {
  departmentName,
  pickLocalized,
  SOCIAL_NETWORKS,
  type Locale,
  type PublicHostResponse,
  type SocialNetwork,
  type SportDto,
  type SportElement,
} from '@juandavidfuentes/indomitox-shared';
import {
  ArrowRight,
  Backpack,
  ChatCircleDots,
  FacebookLogo,
  Globe,
  InstagramLogo,
  MapPin,
  SealCheck,
  ShieldCheck,
  Star,
  TiktokLogo,
  Translate,
  YoutubeLogo,
} from '@phosphor-icons/react/ssr';
import type { Icon } from '@phosphor-icons/react';
import Image from 'next/image';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { LogoMark } from '@/components/brand/logo';
import { TopoPattern } from '@/components/brand/topo-pattern';
import { Link } from '@/i18n/navigation';

const SOCIAL_ICONS: Record<Exclude<SocialNetwork, 'whatsapp'>, Icon> = {
  website: Globe,
  instagram: InstagramLogo,
  facebook: FacebookLogo,
  tiktok: TiktokLogo,
  youtube: YoutubeLogo,
};

const DOT: Record<SportElement, string> = {
  WATER: 'bg-tint-water',
  AIR: 'bg-tint-air',
  LAND: 'bg-tint-land',
  UNDERGROUND: 'bg-tint-underground dark:bg-muted-foreground',
  PARK: 'bg-tint-park',
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="font-display text-4xl leading-tight font-extrabold uppercase italic">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/**
 * Página pública del Guía (PAGE-01): portada con velo Noche y corte diagonal, marca, RNT visible
 * (lo exige la ley), actividades, idiomas y redes. Las publicaciones (F3), las reseñas (F7) y el
 * chat (F6) llegan en sus fases.
 */
export function GuideProfile({ guide, sports }: { guide: PublicHostResponse; sports: SportDto[] }) {
  const t = useTranslations();
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const about = pickLocalized(guide.description, locale);
  const place = [guide.city, departmentName(guide.department)].filter(Boolean).join(', ');
  const sportElement = new Map(sports.map((sport) => [sport.key, sport.element]));
  const sportName = (key: string) =>
    pickLocalized(sports.find((sport) => sport.key === key)?.names, locale)?.text ??
    (t.has(`sports.${key}` as never) ? t(`sports.${key}` as never) : key);
  const monthYear = (iso: string) => format.dateTime(new Date(iso), { month: 'long', year: 'numeric' });
  const links = SOCIAL_NETWORKS.filter((network): network is Exclude<SocialNetwork, 'whatsapp'> => network !== 'whatsapp' && Boolean(guide.socialLinks[network]));

  return (
    <article>
      <header className="relative isolate overflow-hidden bg-night text-night-foreground clip-slope-b">
        {guide.coverUrl ? (
          <>
            <Image src={guide.coverUrl} alt="" fill preload sizes="100vw" quality={70} className="-z-20 object-cover" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/75 to-night/35" />
          </>
        ) : (
          <TopoPattern variant="hero" className="absolute inset-0 -z-10 size-full text-brand/30" />
        )}
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-16 pb-[calc(3.5vw+3.5rem)] sm:flex-row sm:items-end sm:px-6 sm:pt-28 lg:px-8">
          <div className="relative size-28 shrink-0 overflow-hidden rounded-full bg-night ring-4 ring-night-foreground/25 sm:size-36">
            {guide.logoUrl ? (
              <Image src={guide.logoUrl} alt={t('host.logo')} fill sizes="9rem" className="object-cover" />
            ) : (
              <LogoMark className="size-full p-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="tape inline-flex items-center gap-1.5">
              <SealCheck size={16} weight="fill" aria-hidden="true" />
              {t('guide.verified')}
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[0.9] font-extrabold uppercase italic [overflow-wrap:anywhere] sm:text-7xl">
              {guide.name}
            </h1>
            {place ? (
              <p className="mt-3 flex items-center gap-2 text-lg text-night-foreground/90">
                <MapPin size={22} weight="fill" className="shrink-0 text-brand" aria-hidden="true" />
                {place}
              </p>
            ) : null}
            <p className="mt-3 font-display text-sm font-bold tracking-[0.2em] text-night-foreground/75 uppercase">
              {guide.verifiedSince ? t('guide.verifiedSince', { date: monthYear(guide.verifiedSince) }) : null}
              {guide.rntNumber ? ` · ${t('guide.rnt', { number: guide.rntNumber })}` : null}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8">
        <div className="grid min-w-0 content-start gap-14 lg:col-start-1 lg:row-start-1">
          {about ? (
            <Section id="quienes-somos" title={t('guide.about')}>
              <p lang={about.locale} className="max-w-[70ch] text-lg leading-relaxed whitespace-pre-line">
                {about.text}
              </p>
              {about.locale !== locale ? (
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Translate size={18} aria-hidden="true" />
                  {t(`guide.originalIn.${about.locale}`)}
                </p>
              ) : null}
            </Section>
          ) : null}

          {guide.sportKeys.length ? (
            <Section id="actividades" title={t('guide.sports')}>
              <ul className="flex flex-wrap gap-2">
                {guide.sportKeys.map((key) => {
                  const element = sportElement.get(key);
                  return (
                    <li key={key} className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-border bg-card px-4 font-semibold">
                      {element ? <span className={`size-2.5 rounded-full ${DOT[element]}`} aria-hidden="true" /> : null}
                      {sportName(key)}
                    </li>
                  );
                })}
              </ul>
            </Section>
          ) : null}

          <Section id="aventuras" title={t('guide.listingsTitle')}>
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-center">
              <TopoPattern variant="band" className="absolute inset-0 size-full text-primary/10" />
              <div className="relative grid justify-items-center gap-3">
                <Backpack size={44} weight="duotone" className="text-primary" aria-hidden="true" />
                <p className="max-w-md text-lg font-semibold">{t('guide.listingsEmpty', { name: guide.name })}</p>
                <Link href="/" className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">
                  {t('guide.exploreMore')}
                  <ArrowRight size={18} weight="bold" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </Section>

          <Section id="resenas" title={t('guide.reviewsTitle')}>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Star size={22} aria-hidden="true" />
              {t('guide.reviewsEmpty')}
            </p>
          </Section>
        </div>

        {/* En el teléfono, el RNT y el contacto van justo después de la portada. */}
        <aside className="order-first grid content-start gap-4 lg:sticky lg:top-24 lg:order-none lg:col-start-2 lg:row-start-1 lg:self-start">
          {guide.rntNumber ? (
            <section aria-labelledby="rnt-title" className="rounded-xl border-2 border-secondary/50 bg-card p-5">
              <p id="rnt-title" className="flex items-center gap-2 font-semibold">
                <ShieldCheck size={24} weight="duotone" className="text-secondary" aria-hidden="true" />
                {t('guide.rntLabel')}
              </p>
              <p className="mt-2 font-display text-4xl font-extrabold tracking-wide tabular-nums">{guide.rntNumber}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('guide.rntNote')}</p>
            </section>
          ) : null}

          <section className="grid gap-4 rounded-xl border border-border bg-card p-5">
            <div>
              <button
                type="button"
                disabled
                aria-describedby="contact-soon"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground opacity-60"
              >
                <ChatCircleDots size={20} weight="bold" aria-hidden="true" />
                {t('guide.contact')}
              </button>
              <p id="contact-soon" className="mt-2 text-sm text-muted-foreground">
                {t('guide.contactSoon')}
              </p>
            </div>
            {guide.languages.length ? (
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{t('guide.languages')}</p>
                <p className="mt-1 font-medium">{guide.languages.map((language) => t(`spokenLanguages.${language}`)).join(', ')}</p>
              </div>
            ) : null}
            {links.length ? (
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{t('guide.social')}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {links.map((network) => {
                    const NetworkIcon = SOCIAL_ICONS[network];
                    return (
                      <li key={network}>
                        <a
                          href={guide.socialLinks[network]}
                          target="_blank"
                          rel="nofollow ugc noopener noreferrer"
                          aria-label={t(`socialNetworks.${network}`)}
                          className="inline-flex size-11 items-center justify-center rounded-full border border-border transition-colors duration-150 hover:bg-muted"
                        >
                          <NetworkIcon size={22} aria-hidden="true" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            <p className="border-t border-border pt-4 font-display text-sm font-bold tracking-[0.15em] text-muted-foreground uppercase">
              {t('guide.memberSince', { date: monthYear(guide.memberSince) })}
            </p>
          </section>
        </aside>
      </div>
    </article>
  );
}
