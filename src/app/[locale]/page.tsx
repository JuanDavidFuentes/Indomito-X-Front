import { HOME_SPORTS } from '@juandavidfuentes/indomitox-shared';
import { getTranslations } from 'next-intl/server';
import { AppCta } from '@/components/home/app-cta';
import { Destinations } from '@/components/home/destinations';
import { Elements } from '@/components/home/elements';
import { Featured } from '@/components/home/featured';
import { Hero } from '@/components/home/hero';
import { HostCta } from '@/components/home/host-cta';
import { Levels } from '@/components/home/levels';
import { SportTicker } from '@/components/home/sport-ticker';
import { ValueStrip } from '@/components/home/value-strip';
import { getFeaturedPlaces, getSports, searchListings } from '@/lib/api/public';

/** La portada se regenera cada 5 minutos (ISR) con las aventuras y los destinos de la API. */
export const revalidate = 300;

export default async function HomePage() {
  const t = await getTranslations();
  const [sports, featured, places] = await Promise.all([getSports(), searchListings({ sort: 'RELEVANCE' }, 300), getFeaturedPlaces()]);

  return (
    <>
      <Hero sports={sports} />
      <SportTicker
        items={HOME_SPORTS.map((sport) => t(`sports.${sport}`))}
        pauseLabel={t('common.pauseAnimation')}
        playLabel={t('common.playAnimation')}
      />
      <ValueStrip />
      <Elements />
      <Featured items={(featured?.items ?? []).slice(0, 8)} sports={sports} />
      <Destinations places={places} />
      <Levels />
      <HostCta />
      <AppCta />
    </>
  );
}
