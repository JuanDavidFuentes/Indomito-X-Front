import { PHOTO_CREDITS, PHOTO_IDS } from '@juandavidfuentes/indomitox-shared';
import { ArrowSquareOut } from '@phosphor-icons/react/ssr';
import type { Metadata } from 'next';
import Image from 'next/image';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { PHOTOS } from '@/lib/photos';

export async function generateMetadata({ params }: PageProps<'/[locale]/creditos'>): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'credits' });
  return { title: t('title') };
}

/** Créditos de las fotos: autor, licencia y fuente de cada imagen (lo exigen CC BY y CC BY-SA). */
export default async function CreditsPage() {
  const t = await getTranslations();

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
      <h1 className="font-display text-5xl leading-[0.95] font-extrabold uppercase italic sm:text-6xl">
        {t('credits.title')}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t('credits.intro')}</p>
      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        {PHOTO_IDS.map((id) => {
          const credit = PHOTO_CREDITS[id];
          return (
            <li key={id} className="flex gap-4 rounded-lg border border-border bg-card p-3">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image src={PHOTOS[id]} alt={t(`photos.${id}`)} fill sizes="6rem" quality={70} className="object-cover" />
              </div>
              <div className="min-w-0 text-sm">
                <p className="font-semibold [overflow-wrap:anywhere]">{credit.title}</p>
                <p className="mt-1 text-muted-foreground">
                  {t('credits.author')}: {credit.author}
                </p>
                <p className="text-muted-foreground">
                  {t('credits.license')}:{' '}
                  <a href={credit.licenseUrl} className="text-secondary underline-offset-2 hover:underline" rel="license">
                    {credit.license}
                  </a>
                  {credit.adapted ? ` · ${t('credits.adapted')}` : null}
                </p>
                <a
                  href={credit.sourceUrl}
                  className="mt-1 inline-flex items-center gap-1 font-semibold text-secondary underline-offset-2 hover:underline"
                >
                  {t('credits.source')}
                  <ArrowSquareOut size={14} aria-hidden="true" />
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
